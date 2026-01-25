import { NextResponse } from 'next/server';
import { createQuote as createQuoteBeapi, isConfigured as isBeapiConfigured, getListings as getListingsBeapi } from '@/lib/guesty-beapi';
import { getQuote as getQuoteLegacy } from '@/lib/guesty';

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
  const todayStr = new Date().toLocaleDateString('en-CA');

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
    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nightsCount = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Strategy 1: Try BEAPI quote
    if (isBeapiConfigured()) {
      try {
        const beapiQuote = await createQuoteBeapi({
          listingId,
          checkInDateLocalized: checkIn,
          checkOutDateLocalized: checkOut,
          guestsCount: guestsCount || 1,
        });

        if (beapiQuote) {
          return NextResponse.json({
            success: true,
            available: true,
            quote: {
              nightsCount,
              pricePerNight: Math.round(beapiQuote.money.fareAccommodation / nightsCount),
              accommodation: beapiQuote.money.fareAccommodation,
              cleaningFee: beapiQuote.money.fareCleaning || 0,
              serviceFee: beapiQuote.money.hostServiceFee || 0,
              taxes: beapiQuote.money.totalTaxes || 0,
              total: beapiQuote.money.totalPrice,
              currency: beapiQuote.money.currency || 'USD',
            },
          });
        }
      } catch (e) {
        console.warn('BEAPI quote failed:', e);
      }
    }

    // Strategy 2: Try legacy Guesty quote
    try {
      const quoteResult = await getQuoteLegacy({
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
          error: quoteResult.unavailableDates?.length > 0
            ? 'These dates are already booked. Try adjusting your stay!'
            : 'This cozy spot can\'t fit that many guests. Try a larger property!',
        });
      }

      return NextResponse.json({
        success: true,
        available: true,
        quote: quoteResult.quote,
      });
    } catch (e) {
      console.warn('Legacy quote failed:', e);
    }

    // Strategy 3: Estimate from listing base price
    try {
      const listings = await getListingsBeapi({ limit: 100 });
      const listing = listings.find(l => l._id === listingId);

      if (listing && listing.prices?.basePrice) {
        const basePrice = listing.prices.basePrice;
        const cleaningFee = listing.prices.cleaningFee || 0;
        const accommodation = basePrice * nightsCount;
        const serviceFee = Math.round(accommodation * 0.10); // Estimate 10% service fee
        const taxes = Math.round(accommodation * 0.13); // Estimate 13% taxes
        const total = accommodation + cleaningFee + serviceFee + taxes;

        return NextResponse.json({
          success: true,
          available: true,
          quote: {
            nightsCount,
            pricePerNight: basePrice,
            accommodation,
            cleaningFee,
            serviceFee,
            taxes,
            total,
            currency: listing.prices.currency || 'USD',
            estimated: true, // Flag that this is an estimate
          },
        });
      }
    } catch (e) {
      console.warn('Estimate from listing failed:', e);
    }

    // All strategies failed
    return NextResponse.json(
      {
        success: false,
        error: 'We couldn\'t check availability right now. Please try again in a moment!',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error getting quote:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'We couldn\'t check availability right now. Please try again in a moment!',
      },
      { status: 500 }
    );
  }
}
