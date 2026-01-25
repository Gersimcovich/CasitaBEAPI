import { NextResponse } from 'next/server';
import { getCalendar as getCalendarBeapi, isConfigured as isBeapiConfigured } from '@/lib/guesty-beapi';
import { getCalendar as getCalendarLegacy } from '@/lib/guesty';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Validate required fields
  if (!listingId || !from || !to) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters: listingId, from, to',
      },
      { status: 400 }
    );
  }

  // Validate dates
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      },
      { status: 400 }
    );
  }

  if (toDate <= fromDate) {
    return NextResponse.json(
      {
        success: false,
        error: 'End date must be after start date',
      },
      { status: 400 }
    );
  }

  try {
    let calendar: Array<{ date: string; available: boolean; price?: number; minNights?: number }> = [];

    // Strategy 1: Try BEAPI calendar
    if (isBeapiConfigured()) {
      try {
        const beapiCalendar = await getCalendarBeapi(listingId, from, to);
        if (beapiCalendar && beapiCalendar.length > 0) {
          calendar = beapiCalendar;
        }
      } catch {
        // BEAPI failed, try legacy
      }
    }

    // Strategy 2: Try legacy Guesty calendar
    if (calendar.length === 0) {
      try {
        const legacyCalendar = await getCalendarLegacy(listingId, from, to);
        if (legacyCalendar && legacyCalendar.length > 0) {
          calendar = legacyCalendar.map(day => ({
            date: day.date,
            available: day.status === 'available',
            price: day.price,
            minNights: day.minNights,
          }));
        }
      } catch {
        // Legacy failed too
      }
    }

    // If no calendar data, return empty (allows booking attempt - availability verified at booking time)
    if (calendar.length === 0) {
      return NextResponse.json({
        success: true,
        listingId,
        from,
        to,
        availability: [],
        blockedDates: [],
        currency: 'USD',
      });
    }

    // Transform for frontend use
    const availability = calendar.map(day => ({
      date: day.date,
      available: day.available,
      price: day.price,
      minNights: day.minNights,
    }));

    // Get blocked dates for easy filtering
    const blockedDates = calendar
      .filter(day => !day.available)
      .map(day => day.date);

    return NextResponse.json({
      success: true,
      listingId,
      from,
      to,
      availability,
      blockedDates,
      currency: 'USD',
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);

    // Return empty calendar on error (allow booking attempt)
    return NextResponse.json({
      success: true,
      listingId,
      from,
      to,
      availability: [],
      blockedDates: [],
      currency: 'USD',
    });
  }
}
