import { NextResponse } from 'next/server';
import { getCalendar } from '@/lib/guesty';

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
    // Get calendar from Guesty - this is the only source of truth
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

    let userMessage = 'Unable to load availability calendar. Please try again.';

    if (error instanceof Error) {
      const errorText = error.message;

      if (errorText.includes('not found') || errorText.includes('404')) {
        userMessage = 'This property is no longer available.';
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Unable to load calendar. Please refresh and try again.';
      } else if (errorText.includes('timeout') || errorText.includes('ETIMEDOUT')) {
        userMessage = 'The request took too long. Please try again.';
      } else if (errorText.includes('network') || errorText.includes('ECONNREFUSED')) {
        userMessage = 'Connection issue. Please check your internet and try again.';
      } else if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429') || errorText.includes('rate limited')) {
        userMessage = 'We\'re experiencing high traffic. Please wait a moment and try again.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: 500 }
    );
  }
}
