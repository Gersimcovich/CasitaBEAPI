import { NextResponse } from 'next/server';
import { clearAllCaches, getListings } from '@/lib/guesty';

/**
 * POST /api/cache/refresh
 * Clears all in-memory caches and fetches fresh listing data from Guesty.
 * Use this after updating listings in Guesty to force the website to show new data.
 */
export async function POST() {
  try {
    // Clear all in-memory caches
    clearAllCaches();

    // Force a fresh fetch from Guesty API
    const listings = await getListings({ active: true, limit: 100, useCache: false });

    return NextResponse.json({
      success: true,
      message: 'Cache cleared and listings refreshed',
      listingsCount: listings.length,
    });
  } catch (error) {
    console.error('Cache refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}
