import { NextResponse } from 'next/server';
import { getListings as getListingsLegacy, convertGuestyToProperty } from '@/lib/guesty';
import { getListings as getListingsBeapi, isConfigured as isBeapiConfigured, BeapiListing } from '@/lib/guesty-beapi';
import { guestyProperties } from '@/data/guestyData';
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

// Convert BEAPI listing to Property format
function convertBeapiToProperty(listing: BeapiListing): Property {
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
    petFriendly: listing.petsAllowed || listing.amenities?.some(a => a.toLowerCase().includes('pet')) || false,
    distanceToBeach: 2000,
    locationPerks: [],
    policies: {
      checkIn: '3:00 PM',
      checkOut: '11:00 AM',
      cancellation: 'Flexible',
    },
  };
}

// Check if properties have valid data (not just empty defaults)
function hasValidData(properties: Property[]): boolean {
  if (properties.length === 0) return false;

  // Check if most properties have meaningful data
  const validCount = properties.filter(p =>
    p.name !== 'Property' &&
    p.images.length > 0 &&
    p.location.city !== ''
  ).length;

  return validCount > properties.length * 0.5; // At least 50% should be valid
}

/**
 * GET /api/listings
 *
 * PRODUCTION STRATEGY:
 * 1. Primary: BEAPI (Booking Engine API) with better rate limits
 * 2. Secondary: Legacy client with disk cache
 * 3. Final fallback: Static data from guestyData.ts
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const guests = searchParams.get('guests');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  try {
    let properties: Property[] = [];
    let source = 'unknown';

    // Try BEAPI first if configured
    if (isBeapiConfigured()) {
      try {
        console.log('📡 Trying Guesty BEAPI client...');
        const listings = await getListingsBeapi({ limit: 100 });
        const converted = listings
          .filter(l => l.active !== false)
          .map(convertBeapiToProperty);

        if (hasValidData(converted)) {
          properties = converted;
          source = 'beapi';
          console.log(`✅ BEAPI returned ${properties.length} valid listings`);
        } else {
          console.log('⚠️ BEAPI returned sparse data, trying fallback...');
        }
      } catch (beapiError) {
        console.warn('⚠️ BEAPI failed:', beapiError);
      }
    }

    // Fallback to legacy client if BEAPI failed or returned bad data
    if (!hasValidData(properties)) {
      try {
        console.log('📡 Trying legacy Guesty client...');
        const listings = await getListingsLegacy({ active: true, limit: 100, useCache: true });
        const converted = listings.map(convertGuestyToProperty);

        if (hasValidData(converted)) {
          properties = converted;
          source = 'legacy';
          console.log(`✅ Legacy client returned ${properties.length} valid listings`);
        } else {
          console.log('⚠️ Legacy client returned sparse data, using static fallback...');
        }
      } catch (legacyError) {
        console.warn('⚠️ Legacy client failed:', legacyError);
      }
    }

    // Final fallback to static data
    if (!hasValidData(properties)) {
      console.log('📦 Using static fallback data from guestyData.ts');
      properties = guestyProperties;
      source = 'static';
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
      source, // Include source for debugging
    });
  } catch (error) {
    console.error('Error fetching listings:', error);

    // Even on error, return static fallback
    console.log('📦 Error occurred - returning static fallback data');
    let fallbackProperties = guestyProperties;

    // Apply filters to fallback
    if (city) {
      fallbackProperties = fallbackProperties.filter(p =>
        p.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    if (guests) {
      const guestCount = parseInt(guests);
      fallbackProperties = fallbackProperties.filter(p => p.maxGuests >= guestCount);
    }
    if (minPrice) {
      fallbackProperties = fallbackProperties.filter(p => p.price.perNight >= parseInt(minPrice));
    }
    if (maxPrice) {
      fallbackProperties = fallbackProperties.filter(p => p.price.perNight <= parseInt(maxPrice));
    }

    return NextResponse.json({
      success: true,
      data: sortByBestReviews(fallbackProperties),
      count: fallbackProperties.length,
      source: 'static-fallback',
    });
  }
}
