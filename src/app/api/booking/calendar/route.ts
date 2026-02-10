import { NextResponse } from 'next/server';
import { getCalendar as getCalendarLegacy, getCalendarFresh } from '@/lib/guesty';

// Generate array of dates between from and to (YYYY-MM-DD format)
function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const refresh = searchParams.get('refresh') === 'true';

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
    // If refresh=true, bypass all caches and fetch directly from Guesty
    // Otherwise: memory cache -> disk cache -> MongoDB -> BEAPI -> Open API -> stale disk cache (24h)
    const calendar = refresh
      ? await getCalendarFresh(listingId, from, to)
      : await getCalendarLegacy(listingId, from, to);

    if (!calendar || calendar.length === 0) {
      // No data from any source — return error so frontend can show "try again"
      return NextResponse.json({
        success: false,
        error: 'Calendar data temporarily unavailable. Please try again shortly.',
        listingId,
        from,
        to,
      }, { status: 503 });
    }

    // Transform for frontend use
    const availability = calendar.map(day => ({
      date: day.date,
      available: day.status === 'available',
      price: day.price,
      minNights: day.minNights,
    }));

    // Get blocked dates for easy filtering
    const blockedDates = calendar
      .filter(day => day.status !== 'available')
      .map(day => day.date);


    return NextResponse.json({
      success: true,
      listingId,
      from,
      to,
      availability,
      blockedDates,
      currency: calendar[0]?.currency || 'USD',
    });
  } catch (error) {
    console.error('Calendar API error:', error);

    // All sources failed — return error instead of fake blocked dates
    return NextResponse.json({
      success: false,
      error: 'Calendar data temporarily unavailable. Please try again shortly.',
      listingId,
      from,
      to,
    }, { status: 503 });
  }
}
