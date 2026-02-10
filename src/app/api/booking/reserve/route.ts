import { NextResponse } from 'next/server';
import { createReservation, createQuote, getQuote, createInquiry } from '@/lib/guesty';
import { createInstantQuote, isInstantConfigured } from '@/lib/guesty-beapi';
import { sendBookingConfirmationEmail, sendInquiryConfirmationEmail, sendHostNotificationEmail } from '@/lib/email';
import Stripe from 'stripe';

// Host email for notifications (can be moved to env var)
const HOST_EMAIL = process.env.HOST_EMAIL || 'bookings@hellocasita.com';

// Lazy Stripe initialization — avoid crashing at build time
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover',
    });
  }
  return _stripe;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      listingId,
      checkIn,
      checkOut,
      guestsCount,
      guest,
      bookingType = 'inquiry', // 'inquiry' or 'instant'
      paymentIntentId, // Stripe PaymentIntent ID for instant bookings (payment already authorized)
      quoteId, // Optional: pre-fetched quote ID
      ratePlanId, // Optional: pre-fetched rate plan ID
      notes,
    } = body;

    // Validate required fields
    if (!listingId || !checkIn || !checkOut || !guest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate guest info
    if (!guest.firstName || !guest.lastName || !guest.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Guest first name, last name, and email are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guest.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate dates - compare as strings (YYYY-MM-DD format) to avoid timezone issues
    // Same-day reservations are allowed until 11:59 PM local time
    const todayStr = new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format

    if (checkIn < todayStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check-in date cannot be in the past',
        },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check-out date must be after check-in date',
        },
        { status: 400 }
      );
    }

    // Verify availability and get quote
    const quoteResult = await getQuote({
      listingId,
      checkIn,
      checkOut,
      guestsCount: guestsCount || 1,
    });

    if (!quoteResult.available) {
      return NextResponse.json({
        success: false,
        error: quoteResult.unavailableDates.length > 0
          ? 'Selected dates are no longer available'
          : 'Property cannot accommodate this many guests',
        unavailableDates: quoteResult.unavailableDates,
      }, { status: 409 }); // Conflict
    }

    // Handle instant booking with Stripe payment
    // Flow: Payment already authorized via Stripe → Capture payment → Create reservation in Guesty
    if (bookingType === 'instant' && paymentIntentId) {
      // Step 1: Capture the Stripe payment (it was authorized with manual capture)
      let paymentIntent;
      try {
        paymentIntent = await getStripe().paymentIntents.capture(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json({
            success: false,
            error: 'Payment could not be captured. Please try again.',
            errorCode: 'PAYMENT_CAPTURE_FAILED',
          }, { status: 400 });
        }
      } catch (stripeError) {
        console.error('Stripe capture error:', stripeError);
        return NextResponse.json({
          success: false,
          error: 'Payment processing failed. Please try again.',
          errorCode: 'STRIPE_ERROR',
        }, { status: 400 });
      }

      // Step 2: Create quote in Guesty to get quote/ratePlan IDs
      let finalQuoteId = quoteId;
      let finalRatePlanId = ratePlanId;

      if (!finalQuoteId || !finalRatePlanId || finalRatePlanId === 'estimated') {
        // Try Instant Booking quote first (more likely to return ratePlans)
        if (isInstantConfigured()) {
          try {
            const instantQuote = await createInstantQuote({
              listingId,
              checkInDateLocalized: checkIn,
              checkOutDateLocalized: checkOut,
              guestsCount: guestsCount || 1,
            });

            if (instantQuote) {
              finalQuoteId = instantQuote._id;
              finalRatePlanId = instantQuote.ratePlans?.[0]?._id || instantQuote._id;
            }
          } catch (e) {
            console.warn('Instant quote failed, falling back to regular quote:', e);
          }
        }

        // Fall back to regular quote if instant quote failed
        if (!finalQuoteId || !finalRatePlanId) {
          const freshQuote = await createQuote({
            listingId,
            checkIn,
            checkOut,
            guestsCount: guestsCount || 1,
          });

          finalQuoteId = freshQuote._id;
          // Try to get ratePlanId from the quote, fallback to using quoteId
          // (BEAPI often uses quoteId as default ratePlanId when ratePlans array is empty)
          finalRatePlanId = freshQuote.ratePlans?.[0]?._id || freshQuote._id;

        }
      }

      // Step 3: Create reservation in Guesty as inquiry (with payment reference in notes)
      // Using inquiry endpoint since we handle payment via Stripe, not through Guesty
      const paymentNote = `Payment processed via Stripe. PaymentIntent: ${paymentIntentId}. Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`;
      const fullNotes = notes ? `${notes}\n\n${paymentNote}` : paymentNote;

      const reservation = await createInquiry({
        quoteId: finalQuoteId,
        ratePlanId: finalRatePlanId,
        guest: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
        },
        message: fullNotes,
      });

      // Calculate nights count
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nightsCount = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      // Send confirmation email to guest (async, don't block response)
      const listingData = reservation.listing as { _id: string; title: string; picture?: { thumbnail?: string }; address?: { full?: string } };
      sendBookingConfirmationEmail({
        guestName: `${guest.firstName} ${guest.lastName}`,
        guestEmail: guest.email,
        confirmationCode: reservation.confirmationCode,
        propertyName: reservation.listing.title,
        propertyImage: listingData.picture?.thumbnail,
        propertyAddress: listingData.address?.full || '',
        checkIn: reservation.checkInDateLocalized,
        checkOut: reservation.checkOutDateLocalized,
        guestsCount: reservation.guestsCount,
        nightsCount,
        pricing: {
          accommodation: reservation.money.fareAccommodation,
          cleaningFee: reservation.money.fareCleaning,
          serviceFee: 0, // No service fee for direct bookings
          taxes: reservation.money.totalTaxes,
          total: paymentIntent.amount / 100, // Use actual charged amount
          currency: paymentIntent.currency.toUpperCase(),
        },
      }).catch(err => console.error('Failed to send guest confirmation email:', err));

      // Send notification to host (async, don't block response)
      sendHostNotificationEmail({
        hostEmail: HOST_EMAIL,
        guestName: `${guest.firstName} ${guest.lastName}`,
        guestEmail: guest.email,
        guestPhone: guest.phone,
        propertyName: reservation.listing.title,
        checkIn: reservation.checkInDateLocalized,
        checkOut: reservation.checkOutDateLocalized,
        guestsCount: reservation.guestsCount,
        total: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        confirmationCode: reservation.confirmationCode,
        isInstantBooking: true,
      }).catch(err => console.error('Failed to send host notification email:', err));

      return NextResponse.json({
        success: true,
        reservation: {
          id: reservation._id,
          confirmationCode: reservation.confirmationCode,
          status: 'confirmed', // We consider it confirmed since payment is captured
          checkIn: reservation.checkInDateLocalized,
          checkOut: reservation.checkOutDateLocalized,
          guestsCount: reservation.guestsCount,
          guest: {
            firstName: reservation.guest.firstName,
            lastName: reservation.guest.lastName,
            email: reservation.guest.email,
          },
          listing: {
            id: reservation.listing._id,
            title: reservation.listing.title,
          },
          pricing: {
            accommodation: reservation.money.fareAccommodation,
            cleaningFee: reservation.money.fareCleaning,
            fees: 0,
            taxes: reservation.money.totalTaxes,
            total: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
          },
          stripePaymentId: paymentIntentId,
        },
        message: 'Your booking has been confirmed! A confirmation email is on its way.',
      });
    }

    // Fallback to inquiry/request to book (no payment)
    const reservation = await createReservation({
      listingId,
      checkIn,
      checkOut,
      guest: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
      },
      guestsCount: guestsCount || 1,
      status: 'inquiry',
      notes,
    });

    // Send inquiry confirmation email to guest (async, don't block response)
    const inquiryListingData = reservation.listing as { _id: string; title: string; picture?: { thumbnail?: string } };
    sendInquiryConfirmationEmail({
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestEmail: guest.email,
      propertyName: reservation.listing.title,
      propertyImage: inquiryListingData.picture?.thumbnail,
      checkIn: reservation.checkInDateLocalized,
      checkOut: reservation.checkOutDateLocalized,
      guestsCount: reservation.guestsCount,
      message: notes,
    }).catch(err => console.error('Failed to send inquiry confirmation email:', err));

    // Send notification to host (async, don't block response)
    sendHostNotificationEmail({
      hostEmail: HOST_EMAIL,
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      propertyName: reservation.listing.title,
      checkIn: reservation.checkInDateLocalized,
      checkOut: reservation.checkOutDateLocalized,
      guestsCount: reservation.guestsCount,
      total: reservation.money.subTotalPrice,
      currency: reservation.money.currency,
      confirmationCode: reservation.confirmationCode,
      isInstantBooking: false,
    }).catch(err => console.error('Failed to send host notification email:', err));

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation._id,
        confirmationCode: reservation.confirmationCode,
        status: reservation.status,
        checkIn: reservation.checkInDateLocalized,
        checkOut: reservation.checkOutDateLocalized,
        guestsCount: reservation.guestsCount,
        guest: {
          firstName: reservation.guest.firstName,
          lastName: reservation.guest.lastName,
          email: reservation.guest.email,
        },
        listing: {
          id: reservation.listing._id,
          title: reservation.listing.title,
        },
        pricing: {
          accommodation: reservation.money.fareAccommodation,
          cleaningFee: reservation.money.fareCleaning,
          fees: reservation.money.totalFees,
          taxes: reservation.money.totalTaxes,
          total: reservation.money.subTotalPrice,
          currency: reservation.money.currency,
        },
      },
      message: 'Your booking request has been submitted. We will contact you shortly.',
    });
  } catch (error) {
    console.error('Error creating reservation:', error);

    // Parse error for user-friendly message
    let userMessage = 'Unable to complete your booking. Please try again.';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      const errorText = error.message;

      // Parse Guesty BEAPI error codes
      if (errorText.includes('LISTING_IS_NOT_AVAILABLE')) {
        if (errorText.includes('allotment')) {
          userMessage = 'Sorry, not enough rooms are available for your selected dates. Please try different dates or fewer rooms.';
          errorCode = 'NO_AVAILABILITY';
        } else if (errorText.includes('minNights')) {
          userMessage = 'This stay does not meet the minimum night requirement. Please select more nights.';
          errorCode = 'MIN_NIGHTS';
        } else if (errorText.includes('maxNights')) {
          userMessage = 'This stay exceeds the maximum nights allowed. Please select fewer nights.';
          errorCode = 'MAX_NIGHTS';
        } else if (errorText.includes('closed') || errorText.includes('hardBlocked')) {
          userMessage = 'This property is not available for the selected dates.';
          errorCode = 'DATES_BLOCKED';
        } else {
          userMessage = 'This property is not available for the selected dates. Please try different dates.';
          errorCode = 'NOT_AVAILABLE';
        }
      } else if (errorText.includes('GUEST_ALREADY_EXISTS')) {
        userMessage = 'A booking with this email already exists. Please check your email for confirmation.';
        errorCode = 'DUPLICATE_GUEST';
      } else if (errorText.includes('INVALID_GUEST')) {
        userMessage = 'Please check your contact information and try again.';
        errorCode = 'INVALID_GUEST';
      } else if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429')) {
        userMessage = 'We\'re experiencing high demand. Please wait a moment and try again.';
        errorCode = 'RATE_LIMITED';
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Unable to process your booking. Please refresh and try again.';
        errorCode = 'AUTH_ERROR';
      } else if (errorText.includes('PAYMENT')) {
        userMessage = 'There was an issue processing your request. Please try again.';
        errorCode = 'PAYMENT_ERROR';
      } else if (errorText.includes('not found') || errorText.includes('404')) {
        userMessage = 'This property is no longer available.';
        errorCode = 'NOT_FOUND';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        errorCode,
      },
      { status: 500 }
    );
  }
}
