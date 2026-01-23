import { NextResponse } from 'next/server';
import { getListings, searchListings, convertGuestyToProperty } from '@/lib/guesty';
import { Property } from '@/types';

// Sort properties by best reviews (highest rating with most reviews first)
function sortByBestReviews(properties: Property[]): Property[] {
  return [...properties].sort((a, b) => {
    // Calculate weighted score: rating * log(reviewCount + 1) for balanced ranking
    const scoreA = a.rating * Math.log(a.reviewCount + 1);
    const scoreB = b.rating * Math.log(b.reviewCount + 1);

    if (scoreB !== scoreA) {
      return scoreB - scoreA; // Higher score first
    }
    // If scores are equal, prefer higher rating
    return b.rating - a.rating;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const country = searchParams.get('country');
  const guests = searchParams.get('guests');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  try {
    let listings;

    // If search parameters are provided, use search
    if (city || country || guests || minPrice || maxPrice || checkIn || checkOut) {
      listings = await searchListings({
        city: city || undefined,
        country: country || undefined,
        guests: guests ? parseInt(guests) : undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
      });
    } else {
      // Otherwise, get all active listings with caching
      listings = await getListings({ active: true, limit: 100, useCache: true });
    }

    // Convert to our property format and sort by best reviews
    const properties = sortByBestReviews(listings.map(convertGuestyToProperty));

    return NextResponse.json({
      success: true,
      data: properties,
      count: properties.length,
    });
  } catch (error) {
    console.error('Error fetching listings:', error);

    let userMessage = 'Unable to load properties. Please try again.';

    if (error instanceof Error) {
      const errorText = error.message;

      if (errorText.includes('TOO_MANY_REQUESTS') || errorText.includes('429') || errorText.includes('rate limited')) {
        userMessage = 'We\'re experiencing high traffic. Please wait a moment and try again.';
      } else if (errorText.includes('UNAUTHORIZED') || errorText.includes('401')) {
        userMessage = 'Unable to load properties. Please refresh and try again.';
      } else if (errorText.includes('timeout') || errorText.includes('ETIMEDOUT')) {
        userMessage = 'The request took too long. Please try again.';
      } else if (errorText.includes('network') || errorText.includes('ECONNREFUSED')) {
        userMessage = 'Connection issue. Please check your internet and try again.';
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
