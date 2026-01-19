import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/guesty';

export async function POST(request: Request) {
  try {
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
          ? 'Selected dates are not available'
          : 'Property cannot accommodate this many guests',
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get quote',
      },
      { status: 500 }
    );
  }
}
