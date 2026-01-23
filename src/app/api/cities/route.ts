import { NextResponse } from 'next/server';
import { getCities } from '@/lib/guesty';

export async function GET() {
  try {
    const cities = await getCities();

    return NextResponse.json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);

    let userMessage = 'Unable to load cities. Please try again.';

    if (error instanceof Error) {
      const errorText = error.message;

      if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429') || errorText.includes('rate limited')) {
        userMessage = 'We\'re experiencing high traffic. Please wait a moment and try again.';
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
