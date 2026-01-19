import { NextResponse } from 'next/server';
import { getCities } from '@/lib/guesty';

export async function GET() {
  try {
    const cities = await getCities();

    return NextResponse.json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    // Return fallback cities even on error
    const fallbackCities = ['Miami Beach', 'Bal Harbour', 'Sunny Isles', 'Miami', 'Fort Lauderdale'];
    return NextResponse.json({
      success: true,
      data: fallbackCities,
      count: fallbackCities.length,
    });
  }
}
