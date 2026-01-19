import { NextRequest, NextResponse } from 'next/server';

// Map of country codes to our supported countries
const supportedCountries = ['US', 'CA', 'MX', 'AR', 'CO', 'BR'];

// Latin American Spanish-speaking countries (map to 'es' locale)
const latinSpanishCountries = [
  'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO',
  'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR'
];

// Portuguese-speaking countries (map to 'pt' locale)
const portugueseCountries = ['BR', 'PT', 'AO', 'MZ'];

export async function GET(request: NextRequest) {
  try {
    // Try to get country from various headers
    // Vercel/Next.js provides geo data
    const country = request.headers.get('x-vercel-ip-country') ||
                   request.headers.get('cf-ipcountry') || // Cloudflare
                   null;

    // If we have a country code from headers
    if (country) {
      // Check if it's a supported country
      if (supportedCountries.includes(country)) {
        return NextResponse.json({
          success: true,
          countryCode: country,
          source: 'headers',
        });
      }

      // Map to closest supported country based on language/region
      if (latinSpanishCountries.includes(country)) {
        // Default Latin Spanish speakers to Mexico (most neutral)
        return NextResponse.json({
          success: true,
          countryCode: 'MX',
          detectedCountry: country,
          source: 'headers-mapped',
        });
      }

      if (portugueseCountries.includes(country)) {
        return NextResponse.json({
          success: true,
          countryCode: 'BR',
          detectedCountry: country,
          source: 'headers-mapped',
        });
      }
    }

    // Try IP-based geolocation using free service
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';

    // Skip geolocation for localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return NextResponse.json({
        success: true,
        countryCode: 'US', // Default for local development
        source: 'default-local',
      });
    }

    // Use ip-api.com (free, no API key needed, 45 requests/minute limit)
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        const detectedCountry = geoData.countryCode;

        if (detectedCountry) {
          // Check if supported
          if (supportedCountries.includes(detectedCountry)) {
            return NextResponse.json({
              success: true,
              countryCode: detectedCountry,
              source: 'ip-api',
            });
          }

          // Map to closest supported
          if (latinSpanishCountries.includes(detectedCountry)) {
            return NextResponse.json({
              success: true,
              countryCode: 'MX',
              detectedCountry,
              source: 'ip-api-mapped',
            });
          }

          if (portugueseCountries.includes(detectedCountry)) {
            return NextResponse.json({
              success: true,
              countryCode: 'BR',
              detectedCountry,
              source: 'ip-api-mapped',
            });
          }
        }
      }
    } catch (geoError) {
      console.error('Geolocation API error:', geoError);
    }

    // Default to US/English if all else fails
    return NextResponse.json({
      success: true,
      countryCode: 'US',
      source: 'default',
    });
  } catch (error) {
    console.error('Error detecting location:', error);
    return NextResponse.json({
      success: false,
      countryCode: 'US',
      error: 'Detection failed',
    });
  }
}
