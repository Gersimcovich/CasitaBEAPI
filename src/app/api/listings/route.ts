import { NextResponse } from 'next/server';
import { getListings, searchListings, convertGuestyToProperty } from '@/lib/guesty';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const guests = searchParams.get('guests');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    let listings;

    // If search parameters are provided, use search
    if (city || country || guests || minPrice || maxPrice) {
      listings = await searchListings({
        city: city || undefined,
        country: country || undefined,
        guests: guests ? parseInt(guests) : undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      });
    } else {
      // Otherwise, get all active listings with caching
      listings = await getListings({ active: true, limit: 50, useCache: true });
    }

    // Convert to our property format
    const properties = listings.map(convertGuestyToProperty);

    return NextResponse.json({
      success: true,
      data: properties,
      count: properties.length,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch listings',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
