import { NextResponse } from 'next/server';
import { getListing, convertGuestyToProperty } from '@/lib/guesty';
import { Property } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const listing = await getListing(id);

    // Check if listing is null/undefined (can happen with fallback mode or API errors)
    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          error: 'This charming spot is no longer available. Explore our other beautiful properties!',
        },
        { status: 404 }
      );
    }

    const property = convertGuestyToProperty(listing) as Property;

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);

    let userMessage = 'We couldn\'t load this property right now. Give it another try!';
    let statusCode = 500;

    if (error instanceof Error) {
      const errorText = error.message.toLowerCase();

      // Check for 404/not found errors (including BEAPI format "Guesty BEAPI error: 404")
      if (errorText.includes('not found') || errorText.includes('404') || errorText.includes('does not exist')) {
        userMessage = 'This charming spot is no longer available. Explore our other beautiful properties!';
        statusCode = 404;
      } else if (errorText.includes('too_many_requests') || errorText.includes('429') || errorText.includes('rate limit')) {
        userMessage = 'We\'re experiencing high traffic. Please wait a moment and try again!';
        statusCode = 429;
      } else if (errorText.includes('unauthorized') || errorText.includes('401') || errorText.includes('authentication')) {
        userMessage = 'Let\'s try that again. Please refresh the page.';
        statusCode = 401;
      } else if (errorText.includes('timeout') || errorText.includes('etimedout') || errorText.includes('timed out')) {
        userMessage = 'Taking a bit longer than expected. Please try again!';
        statusCode = 504;
      } else if (errorText.includes('network') || errorText.includes('econnrefused') || errorText.includes('fetch failed')) {
        userMessage = 'Looks like there\'s a connection hiccup. Check your internet and try again!';
        statusCode = 503;
      } else if (errorText.includes('400') || errorText.includes('bad request') || errorText.includes('invalid')) {
        userMessage = 'This charming spot is no longer available. Explore our other beautiful properties!';
        statusCode = 404;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: statusCode }
    );
  }
}
