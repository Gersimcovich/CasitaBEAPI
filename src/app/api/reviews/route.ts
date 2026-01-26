import { NextResponse } from 'next/server';
import { getListings, getReviews, GuestyReview } from '@/lib/guesty';

// Cache for all reviews
let allReviewsCache: { data: (GuestyReview & { propertyName?: string })[]; expiresAt: number } | null = null;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export async function GET() {
  try {
    // Check cache
    if (allReviewsCache && allReviewsCache.expiresAt > Date.now()) {
      return NextResponse.json({
        success: true,
        data: allReviewsCache.data,
        count: allReviewsCache.data.length,
        cached: true,
      });
    }

    // Get all listings
    const listings = await getListings({ active: true, limit: 100, useCache: true });

    // Fetch reviews for each listing (in parallel, but limited to avoid rate limits)
    const reviewPromises = listings.slice(0, 20).map(async (listing) => {
      try {
        const reviews = await getReviews(listing._id);
        // Add property info to each review
        return reviews.map(r => ({
          ...r,
          propertyName: listing.nickname || listing.title,
        }));
      } catch {
        return [];
      }
    });

    const reviewsByListing = await Promise.all(reviewPromises);
    const allReviews = reviewsByListing.flat();

    // Filter to positive reviews (rating >= 4) and sort by date
    const positiveReviews = allReviews
      .filter(r => r.rating && r.rating >= 4 && r.publicReview && r.publicReview.length > 20)
      .sort((a, b) => {
        // Sort by rating first, then by date
        if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
        return new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime();
      })
      .slice(0, 20); // Keep top 20 reviews

    // Cache the results
    allReviewsCache = {
      data: positiveReviews,
      expiresAt: Date.now() + CACHE_DURATION,
    };

    return NextResponse.json({
      success: true,
      data: positiveReviews,
      count: positiveReviews.length,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);

    // Return cached data if available even if expired
    if (allReviewsCache?.data) {
      return NextResponse.json({
        success: true,
        data: allReviewsCache.data,
        count: allReviewsCache.data.length,
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to load reviews',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
