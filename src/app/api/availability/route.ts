import { NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/guesty';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    if (!listingId || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: listingId, checkIn, checkOut',
        },
        { status: 400 }
      );
    }

    const availability = await checkAvailability(listingId, checkIn, checkOut);

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error checking availability:', error);

    let userMessage = 'Unable to check availability. Please try again.';

    if (error instanceof Error) {
      const errorText = error.message;

      if (errorText.includes('LISTING_IS_NOT_AVAILABLE')) {
        if (errorText.includes('allotment')) {
          userMessage = 'Sorry, not enough rooms are available for your selected dates.';
        } else if (errorText.includes('minNights')) {
          userMessage = 'This stay does not meet the minimum night requirement.';
        } else if (errorText.includes('maxNights')) {
          userMessage = 'This stay exceeds the maximum nights allowed.';
        } else {
          userMessage = 'This property is not available for the selected dates.';
        }
      } else if (errorText.includes('not found') || errorText.includes('404')) {
        userMessage = 'This property is no longer available.';
      } else if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429')) {
        userMessage = 'We\'re experiencing high demand. Please wait a moment and try again.';
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Unable to check availability. Please refresh and try again.';
      } else if (errorText.includes('timeout') || errorText.includes('ETIMEDOUT')) {
        userMessage = 'The request took too long. Please try again.';
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
