import { NextResponse } from 'next/server';
import { createQuote as createQuoteBeapi, isConfigured as isBeapiConfigured, getListings as getListingsBeapi } from '@/lib/guesty-beapi';
import { getQuote as getQuoteLegacy, getListings as getListingsLegacy, invalidateCalendarForDates } from '@/lib/guesty';
import { guestyProperties } from '@/data/guestyData';

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
          // Direct booking: no service fee (hostServiceFee is Guesty's commission to host, not guest)
          // Total = accommodation + cleaning + taxes only
          const accommodation = beapiQuote.money.fareAccommodation;
          const cleaningFee = beapiQuote.money.fareCleaning || 0;
          const taxes = beapiQuote.money.totalTaxes || 0;
          const directTotal = accommodation + cleaningFee + taxes;

          return NextResponse.json({
            success: true,
            available: true,
            quote: {
              quoteId: beapiQuote._id,
              nightsCount,
              pricePerNight: Math.round(directTotal / nightsCount), // All-in price per night
              accommodation,
              cleaningFee,
              serviceFee: 0, // No service fee for direct bookings
              taxes,
              total: directTotal,
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
      console.log('Quote request:', { listingId, checkIn, checkOut, guestsCount: guestsCount || 1 });
      const quoteResult = await getQuoteLegacy({
        listingId,
        checkIn,
        checkOut,
        guestsCount: guestsCount || 1,
      });
      console.log('Quote result:', JSON.stringify(quoteResult, null, 2));

      if (!quoteResult.available) {
        // Invalidate stale calendar cache for these dates so the widget updates
        if (quoteResult.unavailableDates?.length > 0) {
          invalidateCalendarForDates(listingId, quoteResult.unavailableDates);
        }

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

    // Strategy 3: Estimate from BEAPI listing base price
    if (isBeapiConfigured()) {
      try {
        const listings = await getListingsBeapi({ limit: 100 });
        const listing = listings.find(l => l._id === listingId);

        if (listing && listing.prices?.basePrice) {
          const basePrice = listing.prices.basePrice;
          const cleaningFee = listing.prices.cleaningFee || 0;
          const accommodation = basePrice * nightsCount;
          const taxes = Math.round(accommodation * 0.13);
          const total = accommodation + cleaningFee + taxes; // No service fee for direct bookings

          return NextResponse.json({
            success: true,
            available: true,
            quote: {
              nightsCount,
              pricePerNight: Math.round(total / nightsCount), // All-in price per night
              accommodation,
              cleaningFee,
              serviceFee: 0,
              taxes,
              total,
              currency: listing.prices.currency || 'USD',
              estimated: true,
            },
          });
        }
      } catch (e) {
        console.warn('BEAPI estimate failed:', e);
      }
    }

    // Strategy 4: Estimate from legacy listing
    try {
      const listings = await getListingsLegacy({ active: true, limit: 100, useCache: true });
      const listing = listings.find(l => l._id === listingId);

      if (listing && listing.prices?.basePrice) {
        const basePrice = listing.prices.basePrice;
        const cleaningFee = listing.prices.cleaningFee || 0;
        const accommodation = basePrice * nightsCount;
        const taxes = Math.round(accommodation * 0.13);
        const total = accommodation + cleaningFee + taxes; // No service fee for direct bookings

        return NextResponse.json({
          success: true,
          available: true,
          quote: {
            nightsCount,
            pricePerNight: Math.round(total / nightsCount), // All-in price per night
            accommodation,
            cleaningFee,
            serviceFee: 0,
            taxes,
            total,
            currency: listing.prices.currency || 'USD',
            estimated: true,
          },
        });
      }
    } catch (e) {
      console.warn('Legacy estimate failed:', e);
    }

    // Strategy 5: Estimate from static data
    const staticProperty = guestyProperties.find(p => p.id === listingId || p.slug === listingId);
    if (staticProperty && staticProperty.price?.perNight) {
      const basePrice = staticProperty.price.perNight;
      const cleaningFee = staticProperty.price.cleaningFee || 0;
      const accommodation = basePrice * nightsCount;
      const taxes = Math.round(accommodation * 0.13);
      const total = accommodation + cleaningFee + taxes; // No service fee for direct bookings

      return NextResponse.json({
        success: true,
        available: true,
        quote: {
          nightsCount,
          pricePerNight: Math.round(total / nightsCount), // All-in price per night
          accommodation,
          cleaningFee,
          serviceFee: 0,
          taxes,
          total,
          currency: staticProperty.price.currency || 'USD',
          estimated: true,
        },
      });
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
