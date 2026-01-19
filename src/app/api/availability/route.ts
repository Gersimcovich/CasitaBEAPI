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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability',
      },
      { status: 500 }
    );
  }
}
