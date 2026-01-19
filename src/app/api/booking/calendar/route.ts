import { NextResponse } from 'next/server';
import { getCalendar } from '@/lib/guesty';

export async function GET(request: Request) {
  try {
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

    // Get calendar from Guesty
    const calendar = await getCalendar(listingId, from, to);

    // Transform for frontend use
    const availability = calendar.map(day => ({
      date: day.date,
      available: day.status === 'available',
      price: day.price,
      minNights: day.minNights,
      currency: day.currency,
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
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar',
      },
      { status: 500 }
    );
  }
}
