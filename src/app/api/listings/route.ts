import { NextResponse } from 'next/server';
import { getListings as getListingsLegacy, convertGuestyToProperty } from '@/lib/guesty';
import { getListings as getListingsBeapi, isConfigured as isBeapiConfigured, BeapiListing } from '@/lib/guesty-beapi';
import { guestyProperties } from '@/data/guestyData';
import { Property } from '@/types';

// Generate location title from address
// For Miami Beach: "1200 Collins Ave" → "Collins Ave & 12th St"
// For Orlando: Use neighborhood (e.g., "Lake Berkley") or street name
function generateLocationTitle(address: string | undefined, city: string | undefined, neighborhood?: string): string {
  if (!address || !city) return 'Property';

  const cityLower = city.toLowerCase();

  // For Orlando/Kissimmee area - use neighborhood if available, otherwise street name
  if (cityLower.includes('orlando') || cityLower.includes('kissimmee') || cityLower.includes('davenport') || cityLower.includes('champions gate')) {
    // If we have a neighborhood, use that
    if (neighborhood) {
      return neighborhood;
    }
    // Otherwise use street name without number
    const streetPart = address.split(',')[0].trim();
    const match = streetPart.match(/^(\d+)\s+(.+)$/);
    if (match) {
      let streetName = match[2]
        .replace(/\bStreet\b/gi, 'St')
        .replace(/\bAvenue\b/gi, 'Ave')
        .replace(/\bDrive\b/gi, 'Dr')
        .replace(/\bBoulevard\b/gi, 'Blvd')
        .replace(/\bRoad\b/gi, 'Rd')
        .replace(/\bLane\b/gi, 'Ln')
        .replace(/\bCourt\b/gi, 'Ct')
        .replace(/\bPlace\b/gi, 'Pl')
        .replace(/\bTerrace\b/gi, 'Ter')
        .replace(/\bCircle\b/gi, 'Cir');
      return `${streetName}, ${city}`;
    }
    return `${streetPart}, ${city}`;
  }

  // Parse street number and name from address
  // Handles formats like "1200 Collins Ave" or "1200 Collins Avenue, Miami Beach, FL"
  const streetPart = address.split(',')[0].trim();
  const match = streetPart.match(/^(\d+)\s+(.+)$/);

  if (!match) return `${streetPart}, ${city}`;

  const streetNumber = parseInt(match[1], 10);
  let streetName = match[2]
    .replace(/\bStreet\b/gi, 'St')
    .replace(/\bAvenue\b/gi, 'Ave')
    .replace(/\bDrive\b/gi, 'Dr')
    .replace(/\bBoulevard\b/gi, 'Blvd')
    .replace(/\bRoad\b/gi, 'Rd')
    .replace(/\bLane\b/gi, 'Ln')
    .replace(/\bCourt\b/gi, 'Ct')
    .replace(/\bPlace\b/gi, 'Pl')
    .replace(/\bTerrace\b/gi, 'Ter')
    .replace(/\bCircle\b/gi, 'Cir');

  // For Miami Beach area, use the grid system to calculate cross street
  if (cityLower.includes('miami beach') || cityLower.includes('bal harbour') || cityLower.includes('surfside')) {
    if (streetNumber > 0) {
      const crossStreet = Math.round(streetNumber / 100);
      if (crossStreet > 0 && crossStreet <= 200) {
        // Get ordinal suffix
        const suffix = crossStreet === 1 ? 'st' : crossStreet === 2 ? 'nd' : crossStreet === 3 ? 'rd' :
          (crossStreet >= 11 && crossStreet <= 13) ? 'th' :
          crossStreet % 10 === 1 ? 'st' : crossStreet % 10 === 2 ? 'nd' : crossStreet % 10 === 3 ? 'rd' : 'th';
        return `${streetName} & ${crossStreet}${suffix} St`;
      }
    }
  }

  return `${streetName}, ${city}`;
}

// Transform static property to use cross-street location title
function transformStaticProperty(property: Property): Property {
  const locationTitle = generateLocationTitle(property.location.address, property.location.city, property.location.neighborhood);
  return {
    ...property,
    name: locationTitle,
  };
}

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
  // Get neighborhood from public description
  const neighborhood = listing.publicDescription?.neighborhood;

  // Generate location title instead of generic Guesty title
  // For Miami Beach: cross-street format (e.g., "Collins Ave & 12th St")
  // For Orlando: neighborhood or street name (e.g., "Lake Berkley")
  const locationTitle = generateLocationTitle(listing.address?.full, listing.address?.city, neighborhood);

  return {
    id: listing._id,
    name: locationTitle,
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
      neighborhood: neighborhood,
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
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  try {
    let properties: Property[] = [];
    let source = 'unknown';

    // Try BEAPI first if configured
    if (isBeapiConfigured()) {
      try {
        console.log('📡 Trying Guesty BEAPI client...');
        // BEAPI supports filtering by availability dates - only returns listings with available units
        const beapiParams: { limit: number; checkIn?: string; checkOut?: string; minOccupancy?: number } = { limit: 100 };
        if (checkIn) beapiParams.checkIn = checkIn;
        if (checkOut) beapiParams.checkOut = checkOut;
        if (guests) beapiParams.minOccupancy = parseInt(guests);

        const listings = await getListingsBeapi(beapiParams);
        const converted = listings
          .filter(l => l.active !== false)
          .map(convertBeapiToProperty);

        if (hasValidData(converted)) {
          properties = converted;
          source = 'beapi';
          console.log(`✅ BEAPI returned ${properties.length} available listings${checkIn ? ` for ${checkIn} to ${checkOut}` : ''}`);
        } else {
          console.log('⚠️ BEAPI returned sparse data, trying fallback...');
        }
      } catch (beapiError) {
        console.warn('⚠️ BEAPI failed:', beapiError);
      }
    }

    // Fallback to legacy client if BEAPI failed or returned bad data
    // Note: Legacy client does NOT filter by availability dates (would require too many API calls)
    if (!hasValidData(properties)) {
      try {
        console.log('📡 Trying legacy Guesty client...');
        if (checkIn) {
          console.log('⚠️ Legacy client cannot filter by availability - showing all listings');
        }
        const listings = await getListingsLegacy({ active: true, limit: 100, useCache: true });
        const converted = listings.map(convertGuestyToProperty);

        if (hasValidData(converted)) {
          properties = converted;
          source = 'legacy';
          console.log(`✅ Legacy client returned ${properties.length} listings (availability not filtered)`);
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
      properties = guestyProperties.map(transformStaticProperty);
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

    // Only BEAPI filters by availability dates - legacy/static show all listings
    const availabilityFiltered = !!(checkIn && checkOut && source === 'beapi');

    return NextResponse.json({
      success: true,
      data: properties,
      count: properties.length,
      source,
      availabilityFiltered, // true if results are filtered by date availability
    });
  } catch (error) {
    console.error('Error fetching listings:', error);

    // Even on error, return static fallback
    console.log('📦 Error occurred - returning static fallback data');
    let fallbackProperties = guestyProperties.map(transformStaticProperty);

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
