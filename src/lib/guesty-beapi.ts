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
import { promises as fs } from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BEAPI_URL = 'https://booking.guesty.com/api';
const BEAPI_AUTH_URL = 'https://booking.guesty.com/oauth2/token';

// BEAPI has TWO instances with separate credentials:
// 1. Request to Book (RTB) - for browsing, calendar, quotes, and inquiries
// 2. Instant Booking - for confirmed reservations with payment
const BEAPI_RTB_CLIENT_ID = process.env.GUESTY_BEAPI_CLIENT_ID || process.env.GUESTY_BEAPI_CLIENT_ID_REQUEST_TO_BOOK || '';
const BEAPI_RTB_CLIENT_SECRET = process.env.GUESTY_BEAPI_CLIENT_SECRET || process.env.GUESTY_BEAPI_CLIENT_SECRET_REQUEST_TO_BOOK || '';
const BEAPI_INSTANT_CLIENT_ID = process.env.GUESTY_BEAPI_INSTANT_CLIENT_ID || process.env.GUESTY_BEAPI_CLIENT_ID_INSTANT_BOOKINGS || '';
const BEAPI_INSTANT_CLIENT_SECRET = process.env.GUESTY_BEAPI_INSTANT_CLIENT_SECRET || process.env.GUESTY_BEAPI_CLIENT_SECRET_INSTANT_BOOKINGS || '';

export type BeapiInstance = 'rtb' | 'instant';

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
  console.warn('BEAPI rate limiter depleted - requests will be queued');
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
    // BEAPI circuit breaker half-open - allowing test request
    return true;
  }

  console.warn(`BEAPI circuit breaker OPEN - blocked until ${new Date(circuitBreaker.blockedUntil).toISOString()}`);
  return false;
}

function recordSuccess(): void {
  if (circuitBreaker.isOpen) {
    // BEAPI circuit breaker closing after successful request
  }
  circuitBreaker.isOpen = false;
  circuitBreaker.failureCount = 0;
}

function recordFailure(is429: boolean): void {
  circuitBreaker.failureCount++;

  if (is429 || circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    circuitBreaker.blockedUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
    console.warn(`BEAPI circuit breaker OPEN (blocking for ${CIRCUIT_BREAKER_TIMEOUT / 1000}s)`);
  }
}

// ============================================================================
// TOKEN CACHE (with file persistence for serverless)
// ============================================================================

// Separate token files and caches per instance
const TOKEN_FILES: Record<BeapiInstance, string> = {
  rtb: '/tmp/beapi-token-rtb.json',
  instant: '/tmp/beapi-token-instant.json',
};

const cachedTokens: Record<BeapiInstance, { token: string; expiresAt: number } | null> = {
  rtb: null,
  instant: null,
};

const INSTANCE_CREDENTIALS: Record<BeapiInstance, { clientId: string; clientSecret: string }> = {
  rtb: { clientId: BEAPI_RTB_CLIENT_ID, clientSecret: BEAPI_RTB_CLIENT_SECRET },
  instant: { clientId: BEAPI_INSTANT_CLIENT_ID, clientSecret: BEAPI_INSTANT_CLIENT_SECRET },
};

async function loadTokenFromFile(instance: BeapiInstance): Promise<{ token: string; expiresAt: number } | null> {
  try {
    const content = await fs.readFile(TOKEN_FILES[instance], 'utf-8');
    const data = JSON.parse(content);
    if (data.expiresAt > Date.now() + 5 * 60 * 1000) {
      return data;
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return null;
}

async function saveTokenToFile(instance: BeapiInstance, token: string, expiresAt: number): Promise<void> {
  try {
    await fs.writeFile(TOKEN_FILES[instance], JSON.stringify({ token, expiresAt }));
  } catch {
    // Ignore file write errors
  }
}

async function getBeapiToken(instance: BeapiInstance = 'rtb'): Promise<string> {
  const cached = cachedTokens[instance];

  // Check memory cache first
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token;
  }

  // Check file cache (persists across serverless cold starts within same instance)
  const fileToken = await loadTokenFromFile(instance);
  if (fileToken) {
    cachedTokens[instance] = fileToken;
    // BEAPI token loaded from file cache
    return fileToken.token;
  }

  const creds = INSTANCE_CREDENTIALS[instance];
  if (!creds.clientId || !creds.clientSecret) {
    throw new Error(`BEAPI [${instance}] credentials not configured`);
  }

  // Fetching new BEAPI token

  const response = await fetch(BEAPI_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      scope: 'booking_engine:api',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get BEAPI [${instance}] token: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + TTL.TOKEN;

  cachedTokens[instance] = {
    token: data.access_token,
    expiresAt,
  };

  // Save to file for persistence
  await saveTokenToFile(instance, data.access_token, expiresAt);

  // BEAPI token cached
  return cachedTokens[instance]!.token;
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
  instance?: BeapiInstance;
}

async function beapiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, ttl, skipCache = false, instance = 'rtb' } = options;
  const cacheKey = `beapi:${endpoint}:${body ? JSON.stringify(body) : ''}`;

  // Check cache first (for GET requests)
  if (method === 'GET' && !skipCache && ttl) {
    const cached = getCached<T>(cacheKey);
    if (cached) {
      // BEAPI cache hit
      return cached;
    }
  }

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    const staleData = cache.get(cacheKey)?.data as T;
    if (staleData) {
      // BEAPI circuit breaker open - returning stale cache
      return staleData;
    }
    throw new Error('BEAPI circuit breaker open and no cached data available');
  }

  // Rate-limited fetch
  return limiter.schedule(async () => {
    const token = await getBeapiToken(instance);

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

    // BEAPI call
    const response = await fetch(`${BEAPI_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      const is429 = response.status === 429;

      if (is429) {
        console.warn(`BEAPI rate limited (429) on ${endpoint}`);
      }

      recordFailure(is429);

      const staleData = cache.get(cacheKey)?.data as T;
      if (staleData) {
        // BEAPI error - returning stale cache
        return staleData;
      }

      throw new Error(`BEAPI error: ${response.status} - ${errorText}`);
    }

    recordSuccess();

    const data = await response.json();

    // Cache successful response
    if (method === 'GET' && ttl) {
      setCache(cacheKey, data, ttl);
      // BEAPI response cached
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
 * Handles both 'data' and 'days' response formats from BEAPI
 * Handles both 'status' string and 'available' boolean fields
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
    type CalendarDayRaw = {
      date: string;
      status?: string;
      available?: boolean;
      price?: number;
      minNights?: number;
      cta?: boolean;
      ctd?: boolean;
    };
    const response = await beapiFetch<
      CalendarDayRaw[] | { data?: CalendarDayRaw[]; days?: CalendarDayRaw[] }
    >(
      `/listings/${listingId}/calendar?from=${from}&to=${to}`,
      { ttl: TTL.CALENDAR }
    );

    // Handle response: BEAPI returns a raw array, not wrapped in {data/days}
    const rawDays = Array.isArray(response)
      ? response
      : (response.data || response.days || []);

    // Convert to consistent format with 'available' boolean
    return rawDays.map(day => {
      let available: boolean;
      if (day.status !== undefined) {
        // Convert status string to boolean (available, unavailable, reserved, booked)
        available = day.status === 'available';
      } else if (day.available !== undefined) {
        available = day.available;
      } else {
        // Default to available if no status info
        available = true;
      }

      return {
        date: day.date,
        available,
        price: day.price,
        minNights: day.minNights,
      };
    });
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
  } catch (error) {
    console.error('BEAPI createQuote failed:', error);
    return null;
  }
}

/**
 * Create a quote using the Instant Booking instance
 * Required before creating an instant reservation
 */
export async function createInstantQuote(params: {
  listingId: string;
  checkInDateLocalized: string;
  checkOutDateLocalized: string;
  guestsCount: number;
  coupons?: string[];
}): Promise<{
  _id: string;
  ratePlans?: Array<{ _id: string }>;
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
    return await beapiFetch('/reservations/quotes', {
      method: 'POST',
      body: params,
      instance: 'instant',
    });
  } catch {
    return null;
  }
}

/**
 * Create an instant reservation (confirmed booking with payment)
 * Uses the Instant Booking BEAPI instance
 */
export async function createInstantReservation(params: {
  quoteId: string;
  ratePlanId: string;
  ccToken: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}): Promise<Record<string, unknown>> {
  return beapiFetch(`/reservations/quotes/${params.quoteId}/instant`, {
    method: 'POST',
    body: {
      ratePlanId: params.ratePlanId,
      ccToken: params.ccToken,
      guest: params.guest,
    },
    instance: 'instant',
  });
}

/**
 * Create a booking inquiry (request to book)
 * Uses the Request to Book BEAPI instance
 */
export async function createInquiryReservation(params: {
  quoteId: string;
  ratePlanId: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  message?: string;
  ccToken?: string;
}): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    ratePlanId: params.ratePlanId,
    guest: params.guest,
  };
  if (params.message) body.message = params.message;
  if (params.ccToken) body.ccToken = params.ccToken;

  return beapiFetch(`/reservations/quotes/${params.quoteId}/inquiry`, {
    method: 'POST',
    body,
    instance: 'rtb',
  });
}

/**
 * Check if BEAPI Request to Book is configured
 */
export function isConfigured(): boolean {
  return !!(BEAPI_RTB_CLIENT_ID && BEAPI_RTB_CLIENT_SECRET);
}

/**
 * Check if BEAPI Instant Booking is configured
 */
export function isInstantConfigured(): boolean {
  return !!(BEAPI_INSTANT_CLIENT_ID && BEAPI_INSTANT_CLIENT_SECRET);
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
