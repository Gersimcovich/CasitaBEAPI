import { NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/email';

// Test endpoint to verify email sending works
// DELETE THIS FILE BEFORE PRODUCTION
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check SendGrid configuration
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
      return NextResponse.json(
        {
          success: false,
          error: 'SendGrid API key not configured',
          hint: 'Add SENDGRID_API_KEY to your .env.local file. Get it from: https://app.sendgrid.com/settings/api_keys'
        },
        { status: 500 }
      );
    }

    // Send a test booking confirmation email
    const result = await sendBookingConfirmationEmail({
      guestName: 'Test Guest',
      guestEmail: email,
      confirmationCode: 'TEST-' + Date.now().toString(36).toUpperCase(),
      propertyName: 'Ocean View Suite - Test Property',
      propertyAddress: '123 Ocean Drive, Miami Beach, FL 33139',
      checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
      guestsCount: 2,
      nightsCount: 3,
      pricing: {
        accommodation: 450,
        cleaningFee: 75,
        taxes: 68,
        total: 593,
        currency: 'USD',
      },
      checkInTime: '3:00 PM',
      checkOutTime: '11:00 AM',
      propertyType: 'self-checkin', // Test with self-checkin type
      specialInstructions: 'The parking spot is #42 in the underground garage. WiFi password: CasitaGuest2024',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        details: {
          recipient: email,
          type: 'booking_confirmation',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
          hint: 'Check your Resend API key and email domain configuration',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check server logs for more details',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration status
export async function GET() {
  const hasSendGrid = !!process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key_here';
  const fromEmail = process.env.EMAIL_FROM || 'reservations@hellocasita.com';
  const supportEmail = process.env.SUPPORT_EMAIL || 'reservations@hellocasita.com';
  const hostEmail = process.env.HOST_EMAIL || 'reservations@hellocasita.com';

  return NextResponse.json({
    status: hasSendGrid ? 'configured' : 'not_configured',
    provider: 'sendgrid',
    configuration: {
      sendGridApiKey: hasSendGrid ? '✓ Set' : '✗ Missing',
      fromEmail,
      supportEmail,
      hostEmail,
    },
    hint: hasSendGrid
      ? 'Email system configured with SendGrid. POST to this endpoint with {"email": "your@email.com"} to send a test.'
      : 'Add SENDGRID_API_KEY to .env.local. Get it from: https://app.sendgrid.com/settings/api_keys',
  });
}
