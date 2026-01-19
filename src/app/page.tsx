import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomeContent from '@/components/home/HomeContent';
import { getListings, convertGuestyToProperty } from '@/lib/guesty';

// Revalidate every 10 minutes to reduce API calls during rate limiting
export const revalidate = 600;

// Fallback properties when API is unavailable (rate limited)
// These will be replaced with real data once the cache populates
const FALLBACK_PROPERTIES = [
  {
    id: 'fallback-1',
    name: 'Luxurious Beachfront Villa',
    slug: 'fallback-1',
    description: 'Experience paradise in this stunning beachfront property with panoramic ocean views.',
    shortDescription: 'Stunning beachfront villa with ocean views',
    type: 'luxury-villa' as const,
    images: ['/casita-house.png'],
    price: { perNight: 450, currency: 'USD' },
    location: { address: 'Miami Beach, FL', city: 'Miami Beach', country: 'United States', coordinates: { lat: 25.7907, lng: -80.1300 } },
    amenities: ['wifi', 'pool', 'beach access', 'air conditioning', 'kitchen'],
    rating: 4.9,
    reviewCount: 48,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    isFeatured: true,
    isBeachfront: true,
    distanceToBeach: 0,
    policies: { checkIn: '3:00 PM', checkOut: '11:00 AM', cancellation: 'Flexible' },
  },
  {
    id: 'fallback-2',
    name: 'Modern Downtown Apartment',
    slug: 'fallback-2',
    description: 'Stylish apartment in the heart of the city with all modern amenities.',
    shortDescription: 'Stylish city center apartment',
    type: 'city-apartment' as const,
    images: ['/casita-house.png'],
    price: { perNight: 180, currency: 'USD' },
    location: { address: 'Miami, FL', city: 'Miami', country: 'United States', coordinates: { lat: 25.7617, lng: -80.1918 } },
    amenities: ['wifi', 'air conditioning', 'kitchen', 'washer', 'gym'],
    rating: 4.7,
    reviewCount: 92,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    isFeatured: true,
    isBeachfront: false,
    distanceToBeach: 2000,
    policies: { checkIn: '4:00 PM', checkOut: '10:00 AM', cancellation: 'Moderate' },
  },
  {
    id: 'fallback-3',
    name: 'Cozy Beach House',
    slug: 'fallback-3',
    description: 'Charming beach house perfect for family getaways.',
    shortDescription: 'Charming family beach house',
    type: 'beach-house' as const,
    images: ['/casita-house.png'],
    price: { perNight: 280, currency: 'USD' },
    location: { address: 'Sunny Isles, FL', city: 'Sunny Isles', country: 'United States', coordinates: { lat: 25.9509, lng: -80.1225 } },
    amenities: ['wifi', 'beach access', 'air conditioning', 'kitchen', 'parking'],
    rating: 4.8,
    reviewCount: 65,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    isFeatured: true,
    isBeachfront: true,
    distanceToBeach: 200,
    policies: { checkIn: '3:00 PM', checkOut: '11:00 AM', cancellation: 'Flexible' },
  },
];

async function getFeaturedProperties() {
  try {
    // Fetch listings with caching to avoid rate limiting
    const listings = await getListings({ active: true, limit: 50, useCache: true });
    const properties = listings.map(convertGuestyToProperty);

    if (properties.length === 0) {
      console.warn('No properties returned from Guesty API, using fallback data');
      return FALLBACK_PROPERTIES;
    }

    return properties;
  } catch (error) {
    console.error('Error fetching properties from Guesty:', error);
    // Return fallback properties instead of empty array
    console.warn('Using fallback properties due to API error');
    return FALLBACK_PROPERTIES;
  }
}

export default async function Home() {
  const properties = await getFeaturedProperties();

  return (
    <main className="min-h-screen">
      <Header />
      <HomeContent properties={properties} />
      <Footer />
    </main>
  );
}
