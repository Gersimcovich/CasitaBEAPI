import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/guesty';

export async function POST(request: Request) {
  const body = await request.json();
  const { listingId, checkIn, checkOut, guestsCount } = body;

  // Validate required fields
  if (!listingId || !checkIn || !checkOut) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required fields: listingId, checkIn, checkOut',
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

  try {
    // Get quote from Guesty
    const quoteResult = await getQuote({
      listingId,
      checkIn,
      checkOut,
      guestsCount: guestsCount || 1,
    });

    if (!quoteResult.available) {
      return NextResponse.json({
        success: false,
        available: false,
        unavailableDates: quoteResult.unavailableDates,
        listing: quoteResult.listing,
        error: quoteResult.unavailableDates.length > 0
          ? 'These dates are already booked. Try adjusting your stay!'
          : 'This cozy spot can\'t fit that many guests. Try a larger property!',
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      quote: quoteResult.quote,
      listing: quoteResult.listing,
    });
  } catch (error) {
    console.error('Error getting quote:', error);

    // Parse error for user-friendly message
    let userMessage = 'We couldn\'t check availability right now. Please try again in a moment!';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      const errorText = error.message;

      // Parse Guesty BEAPI error codes
      if (errorText.includes('LISTING_IS_NOT_AVAILABLE')) {
        if (errorText.includes('allotment')) {
          userMessage = 'Not enough rooms available for those dates. Try different dates or fewer rooms!';
          errorCode = 'NO_AVAILABILITY';
        } else if (errorText.includes('minNights')) {
          userMessage = 'This stay requires a minimum number of nights. Add a few more nights to your trip!';
          errorCode = 'MIN_NIGHTS';
        } else if (errorText.includes('maxNights')) {
          userMessage = 'This stay has a maximum night limit. Shorten your trip a bit!';
          errorCode = 'MAX_NIGHTS';
        } else if (errorText.includes('closed') || errorText.includes('hardBlocked')) {
          userMessage = 'This property isn\'t available for those dates. Try different dates!';
          errorCode = 'DATES_BLOCKED';
        } else {
          userMessage = 'These dates are already booked. Try adjusting your stay!';
          errorCode = 'NOT_AVAILABLE';
        }
      } else if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429')) {
        userMessage = 'We\'re experiencing high traffic. Please wait a moment and try again - your dates may still be available!';
        errorCode = 'RATE_LIMITED';
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Let\'s try that again. Please refresh the page!';
        errorCode = 'AUTH_ERROR';
      } else if (errorText.includes('not found') || errorText.includes('404')) {
        userMessage = 'This charming spot is no longer available. Explore our other properties!';
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
