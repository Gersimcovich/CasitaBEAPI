/**
 * Guesty Booking Engine API (BEAPI) Client
 *
 * Better rate limits than Open API:
 * - 5 requests/second
 * - 275 requests/minute
 * - 16,500 requests/hour
 *
 * Uses separate credentials from Open API!
 */

import Bottleneck from 'bottleneck';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BEAPI_URL = 'https://booking.guesty.com/api';
const BEAPI_AUTH_URL = 'https://booking.guesty.com/oauth2/token';

// BEAPI has SEPARATE credentials from Open API
const BEAPI_CLIENT_ID = process.env.GUESTY_BEAPI_CLIENT_ID || '';
const BEAPI_CLIENT_SECRET = process.env.GUESTY_BEAPI_CLIENT_SECRET || '';

// Cache TTLs (in milliseconds)
const TTL = {
  LISTINGS: 6 * 60 * 60 * 1000,      // 6 hours
  LISTING_DETAIL: 6 * 60 * 60 * 1000, // 6 hours
  CALENDAR: 5 * 60 * 1000,            // 5 minutes
  QUOTE: 60 * 1000,                   // 60 seconds
  TOKEN: 23 * 60 * 60 * 1000,         // 23 hours (tokens last 24h)
};

// ============================================================================
// RATE LIMITER
// ============================================================================

const limiter = new Bottleneck({
  maxConcurrent: 3,           // Max 3 concurrent requests
  minTime: 200,               // At least 200ms between requests (5/sec max)
  reservoir: 200,             // Start with 200 requests
  reservoirRefreshAmount: 200,
  reservoirRefreshInterval: 60 * 1000, // Refresh every minute
});

limiter.on('depleted', () => {
  console.warn('⚠️ BEAPI rate limiter depleted - requests will be queued');
});

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitBreaker {
  isOpen: boolean;
  blockedUntil: number;
  failureCount: number;
}

const circuitBreaker: CircuitBreaker = {
  isOpen: false,
  blockedUntil: 0,
  failureCount: 0,
};

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_TIMEOUT = 60 * 1000;

function checkCircuitBreaker(): boolean {
  if (!circuitBreaker.isOpen) return true;

  if (Date.now() >= circuitBreaker.blockedUntil) {
    console.log('🔄 BEAPI circuit breaker half-open - allowing test request');
    return true;
  }

  console.warn(`🚫 BEAPI circuit breaker OPEN - blocked until ${new Date(circuitBreaker.blockedUntil).toISOString()}`);
  return false;
}

function recordSuccess(): void {
  if (circuitBreaker.isOpen) {
    console.log('✅ BEAPI circuit breaker closing after successful request');
  }
  circuitBreaker.isOpen = false;
  circuitBreaker.failureCount = 0;
}

function recordFailure(is429: boolean): void {
  circuitBreaker.failureCount++;

  if (is429 || circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    circuitBreaker.blockedUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
    console.warn(`🚫 BEAPI circuit breaker OPEN (blocking for ${CIRCUIT_BREAKER_TIMEOUT / 1000}s)`);
  }
}

// ============================================================================
// TOKEN CACHE
// ============================================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getBeapiToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  console.log('🔑 Fetching new BEAPI token...');

  const response = await fetch(BEAPI_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: BEAPI_CLIENT_ID,
      client_secret: BEAPI_CLIENT_SECRET,
      scope: 'booking_engine:api',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get BEAPI token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + TTL.TOKEN,
  };

  console.log('✅ BEAPI token cached');
  return cachedToken.token;
}

// ============================================================================
// RESPONSE CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

// ============================================================================
// CORE API FETCH
// ============================================================================

interface FetchOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  ttl?: number;
  skipCache?: boolean;
}

async function beapiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, ttl, skipCache = false } = options;
  const cacheKey = `beapi:${endpoint}:${body ? JSON.stringify(body) : ''}`;

  // Check cache first (for GET requests)
  if (method === 'GET' && !skipCache && ttl) {
    const cached = getCached<T>(cacheKey);
    if (cached) {
      console.log(`📦 BEAPI cache hit: ${endpoint}`);
      return cached;
    }
  }

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    const staleData = cache.get(cacheKey)?.data as T;
    if (staleData) {
      console.log(`📦 BEAPI circuit breaker open - returning stale cache: ${endpoint}`);
      return staleData;
    }
    throw new Error('BEAPI circuit breaker open and no cached data available');
  }

  // Rate-limited fetch
  return limiter.schedule(async () => {
    const token = await getBeapiToken();

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`📡 BEAPI call: ${method} ${endpoint}`);
    const response = await fetch(`${BEAPI_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      const is429 = response.status === 429;

      if (is429) {
        console.warn(`⚠️ BEAPI rate limited (429) on ${endpoint}`);
      }

      recordFailure(is429);

      const staleData = cache.get(cacheKey)?.data as T;
      if (staleData) {
        console.log(`📦 BEAPI error - returning stale cache: ${endpoint}`);
        return staleData;
      }

      throw new Error(`BEAPI error: ${response.status} - ${errorText}`);
    }

    recordSuccess();

    const data = await response.json();

    // Cache successful response
    if (method === 'GET' && ttl) {
      setCache(cacheKey, data, ttl);
      console.log(`💾 BEAPI cached: ${endpoint} (TTL: ${ttl / 1000}s)`);
    }

    return data as T;
  });
}

// ============================================================================
// PUBLIC API METHODS
// ============================================================================

export interface BeapiListing {
  _id: string;
  title: string;
  nickname?: string;
  propertyType?: string;
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  beds?: number;
  address: {
    full?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  prices: {
    basePrice: number;
    currency: string;
    cleaningFee?: number;
    weeklyPriceFactor?: number;
    monthlyPriceFactor?: number;
  };
  picture?: {
    thumbnail?: string;
    regular?: string;
    large?: string;
  };
  pictures: Array<{
    original: string;
    large?: string;
    thumbnail?: string;
    caption?: string;
  }>;
  amenities?: string[];
  publicDescription?: {
    summary?: string;
    space?: string;
    access?: string;
    neighborhood?: string;
  };
  terms?: {
    minNights?: number;
    maxNights?: number;
  };
  reviews?: {
    count?: number;
    avg?: number;
  };
  petsAllowed?: boolean;
  active?: boolean;
}

/**
 * Get all listings from BEAPI - cached for 6 hours
 */
export async function getListings(params?: {
  limit?: number;
  checkIn?: string;
  checkOut?: string;
  minOccupancy?: number;
}): Promise<BeapiListing[]> {
  const queryParams = new URLSearchParams();
  queryParams.set('limit', String(params?.limit || 100));

  if (params?.checkIn) queryParams.set('checkIn', params.checkIn);
  if (params?.checkOut) queryParams.set('checkOut', params.checkOut);
  if (params?.minOccupancy) queryParams.set('minOccupancy', String(params.minOccupancy));

  const data = await beapiFetch<{ results: BeapiListing[] }>(
    `/listings?${queryParams.toString()}`,
    { ttl: TTL.LISTINGS }
  );
  return data.results || [];
}

/**
 * Get single listing from BEAPI - cached for 6 hours
 */
export async function getListing(listingId: string): Promise<BeapiListing | null> {
  try {
    const data = await beapiFetch<BeapiListing>(
      `/listings/${listingId}`,
      { ttl: TTL.LISTING_DETAIL }
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Get calendar/availability for a listing - cached for 5 minutes
 */
export async function getCalendar(
  listingId: string,
  from: string,
  to: string
): Promise<Array<{
  date: string;
  available: boolean;
  price?: number;
  minNights?: number;
}>> {
  try {
    const data = await beapiFetch<{
      days: Array<{
        date: string;
        available: boolean;
        price?: number;
        minNights?: number;
      }>;
    }>(
      `/listings/${listingId}/calendar?from=${from}&to=${to}`,
      { ttl: TTL.CALENDAR }
    );
    return data.days || [];
  } catch {
    return [];
  }
}

/**
 * Get cities with listings
 */
export async function getCities(limit = 100): Promise<string[]> {
  try {
    const data = await beapiFetch<{ results: Array<{ city: string }> }>(
      `/listings/cities?limit=${limit}`,
      { ttl: TTL.LISTINGS }
    );
    return data.results?.map(r => r.city).filter(Boolean) || [];
  } catch {
    return [];
  }
}

/**
 * Create a quote for booking
 */
export async function createQuote(params: {
  listingId: string;
  checkInDateLocalized: string;
  checkOutDateLocalized: string;
  guestsCount: number;
  coupons?: string[];
}): Promise<{
  _id: string;
  money: {
    fareAccommodation: number;
    fareCleaning: number;
    totalTaxes: number;
    hostServiceFee: number;
    currency: string;
    hostPayout: number;
    totalPrice: number;
  };
  expireAt: string;
} | null> {
  try {
    const cacheKey = `quote:${params.listingId}:${params.checkInDateLocalized}:${params.checkOutDateLocalized}:${params.guestsCount}`;
    const cached = getCached<{
      _id: string;
      money: {
        fareAccommodation: number;
        fareCleaning: number;
        totalTaxes: number;
        hostServiceFee: number;
        currency: string;
        hostPayout: number;
        totalPrice: number;
      };
      expireAt: string;
    }>(cacheKey);
    if (cached) return cached;

    const data = await beapiFetch<{
      _id: string;
      money: {
        fareAccommodation: number;
        fareCleaning: number;
        totalTaxes: number;
        hostServiceFee: number;
        currency: string;
        hostPayout: number;
        totalPrice: number;
      };
      expireAt: string;
    }>('/reservations/quotes', {
      method: 'POST',
      body: params,
    });

    setCache(cacheKey, data, TTL.QUOTE);
    return data;
  } catch {
    return null;
  }
}

/**
 * Check if BEAPI is configured
 */
export function isConfigured(): boolean {
  return !!(BEAPI_CLIENT_ID && BEAPI_CLIENT_SECRET);
}

/**
 * Get circuit breaker status (for monitoring)
 */
export function getCircuitBreakerStatus(): CircuitBreaker {
  return { ...circuitBreaker };
}

/**
 * Get cache stats (for monitoring)
 */
export function getCacheStats(): { entries: number; keys: string[] } {
  return {
    entries: cache.size,
    keys: Array.from(cache.keys()),
  };
}
