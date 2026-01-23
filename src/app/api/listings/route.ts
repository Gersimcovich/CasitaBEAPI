import { NextResponse } from 'next/server';
import { getListings as getListingsLegacy, convertGuestyToProperty } from '@/lib/guesty';
import { getListings as getListingsNew, isConfigured as isNewClientConfigured } from '@/lib/guesty-client';
import { Property } from '@/types';

// Sort properties by best reviews (highest rating with most reviews first)
function sortByBestReviews(properties: Property[]): Property[] {
  return [...properties].sort((a, b) => {
    const scoreA = a.rating * Math.log(a.reviewCount + 1);
    const scoreB = b.rating * Math.log(b.reviewCount + 1);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return b.rating - a.rating;
  });
}

// Convert new client listing to Property format
function convertNewListingToProperty(listing: {
  _id: string;
  title: string;
  nickname?: string;
  propertyType: string;
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  address: { full: string; city: string; country: string; lat: number; lng: number };
  prices?: { basePrice: number; currency: string; cleaningFee?: number };
  pictures: Array<{ original: string; large?: string; thumbnail?: string }>;
  amenities: string[];
  publicDescription?: { summary: string };
  reviews?: { count?: number; avg?: number };
  type?: string;
  parentId?: string | null;
}): Property {
  return {
    id: listing._id,
    name: listing.title || listing.nickname || 'Property',
    slug: listing._id,
    description: listing.publicDescription?.summary || '',
    shortDescription: listing.publicDescription?.summary?.substring(0, 150) || '',
    type: 'boutique-hotel',
    images: listing.pictures?.map(p => p.large || p.original).filter(Boolean) || [],
    price: {
      perNight: listing.prices?.basePrice || 0,
      cleaningFee: listing.prices?.cleaningFee,
      currency: listing.prices?.currency || 'USD',
    },
    location: {
      address: listing.address?.full || '',
      city: listing.address?.city || '',
      country: listing.address?.country || '',
      coordinates: {
        lat: listing.address?.lat || 0,
        lng: listing.address?.lng || 0,
      },
    },
    amenities: listing.amenities || [],
    rating: listing.reviews?.avg || 4.5,
    reviewCount: listing.reviews?.count || 0,
    maxGuests: listing.accommodates || 2,
    bedrooms: listing.bedrooms || 1,
    bathrooms: listing.bathrooms || 1,
    isFeatured: false,
    isBeachfront: false,
    petFriendly: listing.amenities?.some(a => a.toLowerCase().includes('pet')) || false,
    distanceToBeach: 2000,
    locationPerks: [],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Flexible',
    },
  };
}

/**
 * GET /api/listings
 *
 * PRODUCTION STRATEGY:
 * - Use new rate-limited client (Open API) with 6-hour cache
 * - NO live API calls on search - filter cached results client-side
 * - Availability/pricing only fetched on property detail page
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const guests = searchParams.get('guests');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  try {
    let properties: Property[];

    // Use new client if configured (has rate limiting, circuit breaker, etc.)
    if (isNewClientConfigured()) {
      console.log('📡 Using new rate-limited Guesty client');
      const listings = await getListingsNew();
      properties = listings
        .filter(l => !l.parentId && l.type !== 'MTL_CHILD') // Filter parent listings only
        .map(convertNewListingToProperty);
    } else {
      // Fallback to legacy client
      console.log('📡 Using legacy Guesty client');
      const listings = await getListingsLegacy({ active: true, limit: 100, useCache: true });
      properties = listings.map(convertGuestyToProperty);
    }

    // FILTER CLIENT-SIDE (no additional API calls!)
    if (city) {
      properties = properties.filter(p =>
        p.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    if (guests) {
      const guestCount = parseInt(guests);
      properties = properties.filter(p => p.maxGuests >= guestCount);
    }
    if (minPrice) {
      properties = properties.filter(p => p.price.perNight >= parseInt(minPrice));
    }
    if (maxPrice) {
      properties = properties.filter(p => p.price.perNight <= parseInt(maxPrice));
    }

    // Sort by best reviews
    properties = sortByBestReviews(properties);

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
        error: 'Unable to load properties. Please try again.',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
