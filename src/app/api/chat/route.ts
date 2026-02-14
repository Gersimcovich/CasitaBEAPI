import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  lookupReservation,
  cancelReservation,
  modifyReservationDates,
  getListingDetails
} from '@/lib/guesty';
import type { ChatResponse, ReservationContext, ParsedIntent } from '@/types/chat';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Session storage (in production, use Redis or a database)
const sessions = new Map<string, {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  reservation?: ReservationContext;
  pendingAction?: 'cancel' | 'modify';
  createdAt: number;
}>();

// Clean up old sessions periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  for (const [id, session] of sessions) {
    if (now - session.createdAt > maxAge) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

const SYSTEM_PROMPT = `You are Casita's friendly AI guest assistant. You help guests with their vacation rental bookings in Miami Beach and South Florida.

Your capabilities:
1. Look up reservations (requires confirmation code + email for security)
2. Show booking details (dates, property, pricing)
3. Cancel reservations (requires confirmation from guest)
4. Modify reservation dates (requires confirmation from guest)
5. Answer general questions about properties and policies

Personality:
- Warm, helpful, and professional
- Use occasional Spanish phrases like "Hola!", "Gracias", "Perfecto"
- Keep responses concise but friendly
- If unsure, offer to connect them with human support via WhatsApp: 555-876-7325

IMPORTANT RULES:
1. NEVER show or discuss reservation details without verification (confirmation code + email)
2. ALWAYS confirm before canceling or modifying reservations
3. When asked about canceling/modifying, ask for confirmation: "Are you sure you want to [action]?"
4. Format prices with $ and include currency

When you need to perform an action, respond with a JSON block at the END of your message in this format:
\`\`\`action
{"type": "lookup", "confirmationCode": "ABC123", "email": "guest@email.com"}
\`\`\`

Or:
\`\`\`action
{"type": "cancel", "confirmed": true}
\`\`\`

Or:
\`\`\`action
{"type": "modify_dates", "newCheckIn": "2025-03-15", "newCheckOut": "2025-03-20", "confirmed": true}
\`\`\`

Only include the action block when you have ALL required information and (for cancel/modify) explicit confirmation from the guest.
For lookup, you need both confirmationCode AND email.
For cancel/modify, "confirmed" should only be true when the guest explicitly says yes/confirm.`;

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function parseActionFromResponse(response: string): ParsedIntent | null {
  const actionMatch = response.match(/```action\n([\s\S]*?)\n```/);
  if (!actionMatch) return null;

  try {
    const action = JSON.parse(actionMatch[1]);
    return action as ParsedIntent;
  } catch {
    return null;
  }
}

function cleanResponseText(response: string): string {
  // Remove action blocks from the visible response
  return response.replace(/```action\n[\s\S]*?\n```/g, '').trim();
}

function formatReservationDetails(reservation: ReservationContext): string {
  return `
**Reservation Found!**

- **Confirmation Code:** ${reservation.confirmationCode}
- **Property:** ${reservation.propertyName}
- **Address:** ${reservation.propertyAddress}
- **Check-in:** ${reservation.checkIn}
- **Check-out:** ${reservation.checkOut}
- **Guests:** ${reservation.guestsCount}
- **Total:** $${reservation.totalPrice.toFixed(2)} ${reservation.currency}
- **Status:** ${reservation.status}
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId: requestSessionId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        reply: 'The chat assistant is temporarily unavailable. Please contact us via WhatsApp at 555-876-7325.',
        sessionId: requestSessionId || generateSessionId(),
        error: 'API key not configured'
      } as ChatResponse);
    }

    // Get or create session
    const sessionId = requestSessionId || generateSessionId();
    let session = sessions.get(sessionId);

    if (!session) {
      session = {
        messages: [],
        createdAt: Date.now()
      };
      sessions.set(sessionId, session);
    }

    // Add user message to history
    session.messages.push({ role: 'user', content: message });

    // Build context for Claude
    let contextInfo = '';
    if (session.reservation) {
      contextInfo = `\n\nCURRENT VERIFIED RESERVATION:\n${JSON.stringify(session.reservation, null, 2)}`;
      if (session.pendingAction) {
        contextInfo += `\n\nPENDING ACTION: Guest was asked about ${session.pendingAction}. Waiting for their confirmation.`;
      }
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextInfo,
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse any action from the response
    const action = parseActionFromResponse(assistantMessage);
    const cleanedResponse = cleanResponseText(assistantMessage);

    let finalResponse = cleanedResponse;
    let responseAction: ChatResponse['action'] = undefined;
    let responseReservation: ReservationContext | undefined = undefined;

    // Handle actions
    if (action) {
      if (action.type === 'lookup' && action.confirmationCode && action.email) {
        // Look up reservation
        const reservation = await lookupReservation(action.confirmationCode, action.email);

        if (reservation) {
          // Get property details using listingId
          const listingDetails = reservation.listingId
            ? await getListingDetails(reservation.listingId)
            : null;

          const reservationContext: ReservationContext = {
            id: reservation._id,
            confirmationCode: reservation.confirmationCode || action.confirmationCode,
            guestEmail: reservation.guest?.email || action.email,
            guestName: `${reservation.guest?.firstName || ''} ${reservation.guest?.lastName || ''}`.trim(),
            propertyName: listingDetails?.name || 'Property',
            propertyAddress: listingDetails?.address || '',
            checkIn: reservation.checkInDateLocalized || '',
            checkOut: reservation.checkOutDateLocalized || '',
            guestsCount: reservation.guestsCount || 1,
            totalPrice: reservation.money?.subTotalPrice || 0,
            currency: reservation.money?.currency || 'USD',
            status: reservation.status || 'confirmed'
          };

          session.reservation = reservationContext;
          responseReservation = reservationContext;
          responseAction = 'lookup_success';

          finalResponse = `${cleanedResponse}\n\n${formatReservationDetails(reservationContext)}\n\nHow can I help you with this reservation?`;
        } else {
          responseAction = 'lookup_failed';
          finalResponse = `I couldn't find a reservation with that confirmation code and email combination. Please double-check the information or contact us via WhatsApp at 555-876-7325 for assistance.`;
        }
      } else if (action.type === 'cancel' && action.confirmed && session.reservation) {
        // Cancel reservation
        const result = await cancelReservation(session.reservation.id);

        if (result.success) {
          responseAction = 'cancel_success';
          finalResponse = `Your reservation (${session.reservation.confirmationCode}) has been canceled. ${result.message}`;
          // Clear the reservation from session
          session.reservation = undefined;
          session.pendingAction = undefined;
        } else {
          responseAction = 'cancel_failed';
          finalResponse = result.message;
        }
      } else if (action.type === 'modify_dates' && action.confirmed && session.reservation && action.newCheckIn && action.newCheckOut) {
        // Modify reservation dates
        const result = await modifyReservationDates(
          session.reservation.id,
          action.newCheckIn,
          action.newCheckOut
        );

        if (result.success) {
          // Update session reservation
          session.reservation.checkIn = action.newCheckIn;
          session.reservation.checkOut = action.newCheckOut;
          responseReservation = session.reservation;
          responseAction = 'modify_success';
          finalResponse = result.message;
          session.pendingAction = undefined;
        } else {
          responseAction = 'modify_failed';
          finalResponse = result.message;
        }
      } else if (action.type === 'cancel' && !action.confirmed) {
        session.pendingAction = 'cancel';
        responseAction = 'cancel_request';
      } else if (action.type === 'modify_dates' && !action.confirmed) {
        session.pendingAction = 'modify';
        responseAction = 'modify_request';
      }
    }

    // Add assistant response to history
    session.messages.push({ role: 'assistant', content: finalResponse });

    // Keep only last 20 messages to manage context
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    return NextResponse.json({
      reply: finalResponse,
      sessionId,
      action: responseAction,
      reservation: responseReservation
    } as ChatResponse);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      reply: 'Lo siento, something went wrong. Please try again or contact us via WhatsApp at 555-876-7325.',
      sessionId: generateSessionId(),
      error: 'Internal error'
    } as ChatResponse);
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Casita AI Chat API',
    configured: !!process.env.ANTHROPIC_API_KEY
  });
}
