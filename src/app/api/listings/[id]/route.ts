import { NextResponse } from 'next/server';
import { getListings as getListingsBeapi, getListing as getListingBeapi, isConfigured as isBeapiConfigured, BeapiListing } from '@/lib/guesty-beapi';
import { getListings as getListingsLegacy, convertGuestyToProperty } from '@/lib/guesty';
import { guestyProperties } from '@/data/guestyData';
import { Property } from '@/types';

// Generate location title from address (same as listings route)
function generateLocationTitle(address: string | undefined, city: string | undefined, neighborhood?: string): string {
  if (!address || !city) return 'Property';

  const cityLower = city.toLowerCase();

  if (cityLower.includes('orlando') || cityLower.includes('kissimmee') || cityLower.includes('davenport') || cityLower.includes('champions gate')) {
    if (neighborhood) return neighborhood;
    const streetPart = address.split(',')[0].trim();
    const match = streetPart.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const streetName = match[2]
        .replace(/\bStreet\b/gi, 'St').replace(/\bAvenue\b/gi, 'Ave')
        .replace(/\bDrive\b/gi, 'Dr').replace(/\bBoulevard\b/gi, 'Blvd')
        .replace(/\bRoad\b/gi, 'Rd').replace(/\bLane\b/gi, 'Ln');
      return `${streetName}, ${city}`;
    }
    return `${streetPart}, ${city}`;
  }

  const streetPart = address.split(',')[0].trim();
  const match = streetPart.match(/^(\d+)\s+(.+)$/);
  if (!match) return `${streetPart}, ${city}`;

  const streetNumber = parseInt(match[1], 10);
  const streetName = match[2]
    .replace(/\bStreet\b/gi, 'St').replace(/\bAvenue\b/gi, 'Ave')
    .replace(/\bDrive\b/gi, 'Dr').replace(/\bBoulevard\b/gi, 'Blvd')
    .replace(/\bRoad\b/gi, 'Rd').replace(/\bLane\b/gi, 'Ln');

  if (cityLower.includes('miami beach') || cityLower.includes('bal harbour') || cityLower.includes('surfside')) {
    if (streetNumber > 0) {
      const crossStreet = Math.round(streetNumber / 100);
      if (crossStreet > 0 && crossStreet <= 200) {
        const suffix = crossStreet === 1 ? 'st' : crossStreet === 2 ? 'nd' : crossStreet === 3 ? 'rd' :
          (crossStreet >= 11 && crossStreet <= 13) ? 'th' :
          crossStreet % 10 === 1 ? 'st' : crossStreet % 10 === 2 ? 'nd' : crossStreet % 10 === 3 ? 'rd' : 'th';
        return `${streetName} & ${crossStreet}${suffix} St`;
      }
    }
  }

  return `${streetName}, ${city}`;
}

// Convert BEAPI listing to Property format (same as listings route)
function convertBeapiToProperty(listing: BeapiListing): Property {
  const neighborhood = listing.publicDescription?.neighborhood;
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let property: Property | null = null;

    // Strategy 1: Try BEAPI individual listing
    if (isBeapiConfigured()) {
      try {
        const listing = await getListingBeapi(id);
        if (listing) {
          property = convertBeapiToProperty(listing);
        }
      } catch (e) {
        console.warn('BEAPI individual listing failed:', e);
      }
    }

    // Strategy 2: Try BEAPI listings and find by ID
    if (!property && isBeapiConfigured()) {
      try {
        const listings = await getListingsBeapi({ limit: 100 });
        const found = listings.find(l => l._id === id);
        if (found) {
          property = convertBeapiToProperty(found);
        }
      } catch (e) {
        console.warn('BEAPI listings search failed:', e);
      }
    }

    // Strategy 3: Try legacy Guesty client
    if (!property) {
      try {
        const listings = await getListingsLegacy({ active: true, limit: 100, useCache: true });
        const found = listings.find(l => l._id === id);
        if (found) {
          property = convertGuestyToProperty(found) as Property;
        }
      } catch (e) {
        console.warn('Legacy Guesty failed:', e);
      }
    }

    // Strategy 4: Check static fallback data
    if (!property) {
      const staticProperty = guestyProperties.find(p => p.id === id || p.slug === id);
      if (staticProperty) {
        property = staticProperty;
      }
    }

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error: 'This charming spot is no longer available. Explore our other beautiful properties!',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'We couldn\'t load this property right now. Give it another try!',
      },
      { status: 500 }
    );
  }
}
