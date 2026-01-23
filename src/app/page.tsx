import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HomeContent from '@/components/home/HomeContent';
import { getListings, convertGuestyToProperty } from '@/lib/guesty';
import { Property } from '@/types';

// Revalidate every 10 minutes to reduce API calls during rate limiting
export const revalidate = 600;

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

async function getFeaturedProperties(): Promise<Property[]> {
  try {
    // Fetch all listings from Guesty with caching
    const listings = await getListings({ active: true, limit: 100, useCache: true });
    const properties = listings.map(convertGuestyToProperty);

    return sortByBestReviews(properties);
  } catch (error) {
    console.error('Error fetching properties from Guesty:', error);
    // Return empty array - let the frontend handle the error state
    return [];
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
