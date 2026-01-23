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
      const errorText = error.message;

      if (errorText.includes('not found') || errorText.includes('404')) {
        userMessage = 'This charming spot is no longer available. Explore our other beautiful properties!';
        statusCode = 404;
      } else if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429') || errorText.includes('rate limited')) {
        userMessage = 'We\'re experiencing high traffic. Please wait a moment and try again!';
        statusCode = 429;
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Let\'s try that again. Please refresh the page.';
      } else if (errorText.includes('timeout') || errorText.includes('ETIMEDOUT')) {
        userMessage = 'Taking a bit longer than expected. Please try again!';
      } else if (errorText.includes('network') || errorText.includes('ECONNREFUSED')) {
        userMessage = 'Looks like there\'s a connection hiccup. Check your internet and try again!';
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
