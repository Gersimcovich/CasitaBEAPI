import { NextResponse } from 'next/server';
import { getListing, convertGuestyToProperty } from '@/lib/guesty';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListing(id);
    const property = convertGuestyToProperty(listing);

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch listing',
      },
      { status: 500 }
    );
  }
}
