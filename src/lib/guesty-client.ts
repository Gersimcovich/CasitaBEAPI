/**
 * Guesty API Client - Production-Ready Wrapper
 *
 * Features:
 * - Rate limiting with Bottleneck
 * - Circuit breaker for 429s
 * - Token caching (refreshes before expiry)
 * - Response caching with TTLs
 * - Automatic fallback to cached data
 * - Open API as primary for guest-facing operations
 */

import Bottleneck from 'bottleneck';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPEN_API_URL = 'https://open-api.guesty.com/v1';
const OPEN_API_AUTH_URL = 'https://open-api.guesty.com/oauth2/token';

const OPEN_API_CLIENT_ID = process.env.GUESTY_CLIENT_ID || '';
const OPEN_API_CLIENT_SECRET = process.env.GUESTY_CLIENT_SECRET || '';

// Cache TTLs (in milliseconds)
const TTL = {
  LISTINGS: 6 * 60 * 60 * 1000,      // 6 hours
  LISTING_DETAIL: 6 * 60 * 60 * 1000, // 6 hours
  AVAILABILITY: 5 * 60 * 1000,        // 5 minutes
  QUOTE: 60 * 1000,                   // 60 seconds
  TOKEN: 23 * 60 * 60 * 1000,         // 23 hours (tokens last 24h)
};

// ============================================================================
// RATE LIMITER (Bottleneck)
// ============================================================================

// Open API: Conservative limits to stay well under their thresholds
const openApiLimiter = new Bottleneck({
  maxConcurrent: 2,           // Max 2 concurrent requests
  minTime: 250,               // At least 250ms between requests (4/sec max)
  reservoir: 50,              // Start with 50 requests
  reservoirRefreshAmount: 50, // Refill to 50
  reservoirRefreshInterval: 60 * 1000, // Every minute
});

// Log rate limit events
openApiLimiter.on('depleted', () => {
  console.warn('⚠️ Rate limiter depleted - requests will be queued');
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

const CIRCUIT_BREAKER_THRESHOLD = 3;     // Open after 3 failures
const CIRCUIT_BREAKER_TIMEOUT = 60 * 1000; // Stay open for 60 seconds

function checkCircuitBreaker(): boolean {
  if (!circuitBreaker.isOpen) return true;

  if (Date.now() >= circuitBreaker.blockedUntil) {
    console.log('🔄 Circuit breaker half-open - allowing test request');
    return true;
  }

  console.warn(`🚫 Circuit breaker OPEN - blocked until ${new Date(circuitBreaker.blockedUntil).toISOString()}`);
  return false;
}

function recordSuccess(): void {
  if (circuitBreaker.isOpen) {
    console.log('✅ Circuit breaker closing after successful request');
  }
  circuitBreaker.isOpen = false;
  circuitBreaker.failureCount = 0;
}

function recordFailure(is429: boolean): void {
  circuitBreaker.failureCount++;

  if (is429 || circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    circuitBreaker.blockedUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
    console.warn(`🚫 Circuit breaker OPEN - too many failures (blocking for ${CIRCUIT_BREAKER_TIMEOUT / 1000}s)`);
  }
}

// ============================================================================
// TOKEN CACHE
// ============================================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getOpenApiToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  console.log('🔑 Fetching new Open API token...');

  const response = await fetch(OPEN_API_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: OPEN_API_CLIENT_ID,
      client_secret: OPEN_API_CLIENT_SECRET,
      scope: 'open-api',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Open API token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + TTL.TOKEN,
  };

  console.log('✅ Open API token cached');
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

function getCacheKey(endpoint: string, params?: Record<string, string>): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `guesty:${endpoint}:${paramStr}`;
}

// ============================================================================
// CORE API FETCH WITH ALL PROTECTIONS
// ============================================================================

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  ttl?: number;
  skipCache?: boolean;
}

async function openApiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, ttl, skipCache = false } = options;
  const cacheKey = getCacheKey(endpoint, body as Record<string, string>);

  // Check cache first (for GET requests)
  if (method === 'GET' && !skipCache && ttl) {
    const cached = getCached<T>(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${endpoint}`);
      return cached;
    }
  }

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    // Return cached data if available (even if stale)
    const staleData = cache.get(cacheKey)?.data as T;
    if (staleData) {
      console.log(`📦 Circuit breaker open - returning stale cache: ${endpoint}`);
      return staleData;
    }
    throw new Error('Circuit breaker open and no cached data available');
  }

  // Rate-limited fetch
  return openApiLimiter.schedule(async () => {
    const token = await getOpenApiToken();

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

    console.log(`📡 API call: ${method} ${endpoint}`);
    const response = await fetch(`${OPEN_API_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      const is429 = response.status === 429;

      if (is429) {
        console.warn(`⚠️ Rate limited (429) on ${endpoint}`);
      }

      recordFailure(is429);

      // Return cached data on error if available
      const staleData = cache.get(cacheKey)?.data as T;
      if (staleData) {
        console.log(`📦 API error - returning stale cache: ${endpoint}`);
        return staleData;
      }

      throw new Error(`Open API error: ${response.status} - ${errorText}`);
    }

    recordSuccess();

    const data = await response.json();

    // Cache successful response
    if (method === 'GET' && ttl) {
      setCache(cacheKey, data, ttl);
      console.log(`💾 Cached: ${endpoint} (TTL: ${ttl / 1000}s)`);
    }

    return data as T;
  });
}

// ============================================================================
// PUBLIC API METHODS
// ============================================================================

export interface GuestyListing {
  _id: string;
  title: string;
  nickname?: string;
  propertyType: string;
  roomType?: string;
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  beds?: number;
  address: {
    full: string;
    city: string;
    country: string;
    state?: string;
    street?: string;
    lat: number;
    lng: number;
  };
  prices?: {
    basePrice: number;
    currency: string;
    cleaningFee?: number;
  };
  picture?: {
    thumbnail: string;
    regular: string;
    large: string;
  };
  pictures: Array<{
    original: string;
    large?: string;
    thumbnail?: string;
  }>;
  amenities: string[];
  publicDescription?: {
    summary: string;
    space?: string;
  };
  terms?: {
    checkIn?: { from?: string; to?: string };
    checkOut?: { from?: string; to?: string };
    cancellationPolicy?: string;
  };
  reviews?: {
    count?: number;
    avg?: number;
  };
  active?: boolean;
  type?: 'SINGLE' | 'MTL' | 'MTL_CHILD';
  parentId?: string | null;
}

/**
 * Get all listings - cached for 6 hours
 */
export async function getListings(): Promise<GuestyListing[]> {
  const data = await openApiFetch<{ results: GuestyListing[] }>(
    '/listings?limit=100&fields=_id,title,nickname,propertyType,roomType,accommodates,bedrooms,bathrooms,beds,address,prices,picture,pictures,amenities,publicDescription,terms,reviews,active,type,parentId',
    { ttl: TTL.LISTINGS }
  );
  return data.results || [];
}

/**
 * Get single listing - cached for 6 hours
 */
export async function getListing(listingId: string): Promise<GuestyListing | null> {
  try {
    const data = await openApiFetch<GuestyListing>(
      `/listings/${listingId}?fields=_id,title,nickname,propertyType,roomType,accommodates,bedrooms,bathrooms,beds,address,prices,picture,pictures,amenities,publicDescription,terms,reviews,active,type,parentId`,
      { ttl: TTL.LISTING_DETAIL }
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Get availability for a listing - cached for 5 minutes
 */
export async function getAvailability(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; status: string; price?: number }>> {
  try {
    const data = await openApiFetch<{
      data: {
        days: Array<{
          date: string;
          status: string;
          price?: number;
          currency?: string;
        }>;
      };
    }>(
      `/availability-pricing/${listingId}?startDate=${startDate}&endDate=${endDate}`,
      { ttl: TTL.AVAILABILITY }
    );
    return data.data?.days || [];
  } catch {
    return [];
  }
}

/**
 * Create a quote - cached for 60 seconds
 */
export async function createQuote(params: {
  listingId: string;
  checkInDateLocalized: string;
  checkOutDateLocalized: string;
  guestsCount: number;
}): Promise<{
  _id: string;
  ratePlans: Array<{
    _id: string;
    money: {
      fareAccommodation: number;
      fareCleaning: number;
      totalTaxes: number;
      hostServiceFee: number;
      currency: string;
    };
  }>;
} | null> {
  try {
    const cacheKey = `quote:${params.listingId}:${params.checkInDateLocalized}:${params.checkOutDateLocalized}:${params.guestsCount}`;
    const cached = getCached<{
      _id: string;
      ratePlans: Array<{
        _id: string;
        money: {
          fareAccommodation: number;
          fareCleaning: number;
          totalTaxes: number;
          hostServiceFee: number;
          currency: string;
        };
      }>;
    }>(cacheKey);
    if (cached) return cached;

    const data = await openApiFetch<{
      _id: string;
      ratePlans: Array<{
        _id: string;
        money: {
          fareAccommodation: number;
          fareCleaning: number;
          totalTaxes: number;
          hostServiceFee: number;
          currency: string;
        };
      }>;
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
 * Check if Open API is configured
 */
export function isConfigured(): boolean {
  return !!(OPEN_API_CLIENT_ID && OPEN_API_CLIENT_SECRET);
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
