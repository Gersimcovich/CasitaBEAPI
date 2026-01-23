import { NextResponse } from 'next/server';
import { getReviews } from '@/lib/guesty';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    const reviews = await getReviews(listingId);

    return NextResponse.json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);

    let userMessage = 'Unable to load reviews. Please try again.';

    if (error instanceof Error) {
      const errorText = error.message;

      if (errorText.includes('not found') || errorText.includes('404')) {
        userMessage = 'No reviews found for this property.';
      } else if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429')) {
        userMessage = 'We\'re experiencing high demand. Please wait a moment and try again.';
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Unable to load reviews. Please refresh and try again.';
      } else if (errorText.includes('timeout') || errorText.includes('ETIMEDOUT')) {
        userMessage = 'The request took too long. Please try again.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
