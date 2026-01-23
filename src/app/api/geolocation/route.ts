import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@/i18n/translations';

// Country to language mapping
// Spanish-speaking countries
const SPANISH_COUNTRIES = [
  'ES', // Spain
  'MX', // Mexico
  'AR', // Argentina
  'CO', // Colombia
  'PE', // Peru
  'VE', // Venezuela
  'CL', // Chile
  'EC', // Ecuador
  'GT', // Guatemala
  'CU', // Cuba
  'BO', // Bolivia
  'DO', // Dominican Republic
  'HN', // Honduras
  'PY', // Paraguay
  'SV', // El Salvador
  'NI', // Nicaragua
  'CR', // Costa Rica
  'PA', // Panama
  'UY', // Uruguay
  'PR', // Puerto Rico
  'GQ', // Equatorial Guinea
];

// Portuguese-speaking countries
const PORTUGUESE_COUNTRIES = [
  'BR', // Brazil
  'PT', // Portugal
  'AO', // Angola
  'MZ', // Mozambique
  'CV', // Cape Verde
  'GW', // Guinea-Bissau
  'ST', // São Tomé and Príncipe
  'TL', // Timor-Leste
];

function getLocaleFromCountry(countryCode: string | null): Locale {
  if (!countryCode) return 'en';

  const upperCountry = countryCode.toUpperCase();

  if (SPANISH_COUNTRIES.includes(upperCountry)) {
    return 'es';
  }

  if (PORTUGUESE_COUNTRIES.includes(upperCountry)) {
    return 'pt';
  }

  // Default to English for all other countries
  return 'en';
}

export async function GET(request: NextRequest) {
  try {
    // Try to get country from Vercel's geolocation headers (works on Vercel deployment)
    const vercelCountry = request.headers.get('x-vercel-ip-country');

    if (vercelCountry) {
      const locale = getLocaleFromCountry(vercelCountry);
      return NextResponse.json({
        locale,
        country: vercelCountry,
        source: 'vercel-headers',
      });
    }

    // Fallback: Try Cloudflare headers
    const cfCountry = request.headers.get('cf-ipcountry');
    if (cfCountry) {
      const locale = getLocaleFromCountry(cfCountry);
      return NextResponse.json({
        locale,
        country: cfCountry,
        source: 'cloudflare-headers',
      });
    }

    // Final fallback: Use a free IP geolocation API
    // Get the client IP from various headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp;

    if (clientIp && !isLocalIP(clientIp)) {
      try {
        // Use ip-api.com (free, no API key required, 45 requests/minute)
        const geoResponse = await fetch(
          `http://ip-api.com/json/${clientIp}?fields=countryCode`,
          { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.countryCode) {
            const locale = getLocaleFromCountry(geoData.countryCode);
            return NextResponse.json({
              locale,
              country: geoData.countryCode,
              source: 'ip-api',
            });
          }
        }
      } catch (error) {
        console.error('IP geolocation API error:', error);
      }
    }

    // Default fallback
    return NextResponse.json({
      locale: 'en' as Locale,
      country: null,
      source: 'default',
    });
  } catch (error) {
    console.error('Geolocation error:', error);
    return NextResponse.json({
      locale: 'en' as Locale,
      country: null,
      source: 'error',
    });
  }
}

function isLocalIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}
