import { NextResponse } from 'next/server';
import { createReservation, getQuote } from '@/lib/guesty';

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

    // Verify availability before creating reservation
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

    // Determine reservation status based on booking type
    const status = bookingType === 'instant' ? 'confirmed' : 'inquiry';

    // Create the reservation
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
      status,
      notes,
    });

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
      message: status === 'confirmed'
        ? 'Your booking has been confirmed!'
        : 'Your booking request has been submitted. We will contact you shortly.',
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create reservation',
      },
      { status: 500 }
    );
  }
}
