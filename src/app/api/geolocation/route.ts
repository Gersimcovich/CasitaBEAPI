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

// French-speaking countries
const FRENCH_COUNTRIES = [
  'FR', // France
  'BE', // Belgium (French-speaking part)
  'CH', // Switzerland (French-speaking part)
  'CA', // Canada (French-speaking part - Quebec)
  'LU', // Luxembourg
  'MC', // Monaco
  'SN', // Senegal
  'CI', // Côte d'Ivoire
  'ML', // Mali
  'BF', // Burkina Faso
  'NE', // Niger
  'TG', // Togo
  'BJ', // Benin
  'MG', // Madagascar
  'CM', // Cameroon
  'CD', // Democratic Republic of the Congo
  'CG', // Republic of the Congo
  'GA', // Gabon
  'DJ', // Djibouti
  'CF', // Central African Republic
  'TD', // Chad
  'RW', // Rwanda
  'BI', // Burundi
  'HT', // Haiti
  'MU', // Mauritius
  'SC', // Seychelles
  'KM', // Comoros
  'MR', // Mauritania
  'GN', // Guinea
];

// German-speaking countries
const GERMAN_COUNTRIES = [
  'DE', // Germany
  'AT', // Austria
  'LI', // Liechtenstein
];

// Italian-speaking countries
const ITALIAN_COUNTRIES = [
  'IT', // Italy
  'SM', // San Marino
  'VA', // Vatican City
];

// Polish-speaking country
const POLISH_COUNTRIES = [
  'PL', // Poland
];

// Arabic-speaking countries
const ARABIC_COUNTRIES = [
  'SA', // Saudi Arabia
  'AE', // United Arab Emirates
  'EG', // Egypt
  'IQ', // Iraq
  'JO', // Jordan
  'KW', // Kuwait
  'LB', // Lebanon
  'LY', // Libya
  'MA', // Morocco
  'OM', // Oman
  'QA', // Qatar
  'SY', // Syria
  'TN', // Tunisia
  'YE', // Yemen
  'BH', // Bahrain
  'DZ', // Algeria
  'SD', // Sudan
  'PS', // Palestine
];

// Hebrew-speaking country
const HEBREW_COUNTRIES = [
  'IL', // Israel
];

// Chinese-speaking countries
const CHINESE_COUNTRIES = [
  'CN', // China
  'TW', // Taiwan
  'HK', // Hong Kong
  'MO', // Macau
  'SG', // Singapore (significant Chinese population)
];

// Russian-speaking countries
const RUSSIAN_COUNTRIES = [
  'RU', // Russia
  'BY', // Belarus
  'KZ', // Kazakhstan
  'KG', // Kyrgyzstan
  'TJ', // Tajikistan
  'UZ', // Uzbekistan
  'TM', // Turkmenistan
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

  if (FRENCH_COUNTRIES.includes(upperCountry)) {
    return 'fr';
  }

  if (GERMAN_COUNTRIES.includes(upperCountry)) {
    return 'de';
  }

  if (ITALIAN_COUNTRIES.includes(upperCountry)) {
    return 'it';
  }

  if (POLISH_COUNTRIES.includes(upperCountry)) {
    return 'pl';
  }

  if (ARABIC_COUNTRIES.includes(upperCountry)) {
    return 'ar';
  }

  if (HEBREW_COUNTRIES.includes(upperCountry)) {
    return 'he';
  }

  if (CHINESE_COUNTRIES.includes(upperCountry)) {
    return 'zh';
  }

  if (RUSSIAN_COUNTRIES.includes(upperCountry)) {
    return 'ru';
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
