import { NextResponse } from 'next/server';
import { getListings } from '@/lib/guesty';

// Cache the stats with a 24-hour TTL
let cachedStats: {
  totalReviews: number;
  totalGuestsHosted: number;
  updatedAt: number;
} | null = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Estimate guests per review (industry average: ~30-40% of guests leave reviews)
const GUESTS_PER_REVIEW_RATIO = 3;

export async function GET() {
  try {
    // Check if we have valid cached data
    if (cachedStats && Date.now() - cachedStats.updatedAt < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: {
          totalReviews: cachedStats.totalReviews,
          totalGuestsHosted: cachedStats.totalGuestsHosted,
          cachedAt: new Date(cachedStats.updatedAt).toISOString(),
        },
      });
    }

    // Fetch all listings to aggregate review counts
    const listings = await getListings({ useCache: false, parentsOnly: true });

    // Sum up all review counts
    const totalReviews = listings.reduce((sum, listing) => {
      return sum + (listing.reviews?.count || 0);
    }, 0);

    // Estimate total guests hosted based on reviews
    // (reviews * ratio gives approximate total guests)
    const totalGuestsHosted = Math.round(totalReviews * GUESTS_PER_REVIEW_RATIO);

    // Update cache
    cachedStats = {
      totalReviews,
      totalGuestsHosted,
      updatedAt: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: {
        totalReviews,
        totalGuestsHosted,
        cachedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);

    // Return cached data if available, even if expired
    if (cachedStats) {
      return NextResponse.json({
        success: true,
        data: {
          totalReviews: cachedStats.totalReviews,
          totalGuestsHosted: cachedStats.totalGuestsHosted,
          cachedAt: new Date(cachedStats.updatedAt).toISOString(),
          stale: true,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
