// Guesty Booking Engine API (BEAPI) Integration
// Documentation: https://booking-api-docs.guesty.com/
// Better rate limits than Open API: 5/sec, 275/min, 16,500/hour
// Supports 3 API credentials with automatic failover when rate limited

import { promises as fs } from 'fs';
import path from 'path';

// Set to true to skip API calls and use only fallback data (useful during development)
const USE_FALLBACK_ONLY = process.env.GUESTY_USE_FALLBACK_ONLY === 'true';

// ============================================================================
// PERSISTENT DATA STORAGE
// Save last known good data from BEAPI to files for fallback when APIs fail
// ============================================================================

const DATA_DIR = path.join(process.cwd(), '.guesty-cache');

interface PersistedListings {
  listings: GuestyListing[];
  savedAt: string;
}

interface PersistedCalendar {
  [listingId: string]: {
    days: CalendarDay[];
    savedAt: string;
  };
}

interface PersistedRates {
  [listingId: string]: {
    [dateRange: string]: {
      pricePerNight: number;
      total: number;
      currency: string;
      savedAt: string;
    };
  };
}

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

// Save listings to persistent storage
async function saveListingsToDisk(listings: GuestyListing[]): Promise<void> {
  try {
    await ensureDataDir();
    const data: PersistedListings = {
      listings,
      savedAt: new Date().toISOString(),
    };
    await fs.writeFile(
      path.join(DATA_DIR, 'listings.json'),
      JSON.stringify(data, null, 2)
    );
    console.log(`💾 Saved ${listings.length} listings to disk`);
  } catch (error) {
    console.error('Failed to save listings to disk:', error);
  }
}

// Load listings from persistent storage
async function loadListingsFromDisk(): Promise<GuestyListing[] | null> {
  try {
    const filePath = path.join(DATA_DIR, 'listings.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: PersistedListings = JSON.parse(fileContent);
    console.log(`📂 Loaded ${data.listings.length} listings from disk (saved: ${data.savedAt})`);
    return data.listings;
  } catch {
    return null;
  }
}

// Save calendar data to persistent storage
async function saveCalendarToDisk(listingId: string, days: CalendarDay[]): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, 'calendar.json');

    // Load existing calendar data
    let allCalendars: PersistedCalendar = {};
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      allCalendars = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }

    // Update with new data
    allCalendars[listingId] = {
      days,
      savedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(allCalendars, null, 2));
    console.log(`💾 Saved calendar for ${listingId} to disk (${days.length} days)`);
  } catch (error) {
    console.error('Failed to save calendar to disk:', error);
  }
}

// Load calendar data from persistent storage
// maxAgeMs controls how old cached data can be (default 1h fresh, up to 24h stale fallback)
// from/to: if provided, validates cached dates overlap with requested range
async function loadCalendarFromDisk(listingId: string, maxAgeMs?: number, from?: string, to?: string): Promise<CalendarDay[] | null> {
  try {
    const filePath = path.join(DATA_DIR, 'calendar.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const allCalendars: PersistedCalendar = JSON.parse(fileContent);

    const calendarData = allCalendars[listingId];
    if (calendarData) {
      const savedTime = new Date(calendarData.savedAt).getTime();
      const maxAge = maxAgeMs ?? 60 * 60 * 1000; // default 1 hour
      if (Date.now() - savedTime > maxAge) {
        console.log(`📂 Disk calendar for ${listingId} expired (saved: ${calendarData.savedAt}, maxAge: ${Math.round(maxAge / 60000)}m)`);
        return null;
      }

      // Validate cached dates overlap with requested range
      if (from && to && calendarData.days.length > 0) {
        const cachedFrom = calendarData.days[0].date;
        const cachedTo = calendarData.days[calendarData.days.length - 1].date;
        // If cached range doesn't overlap requested range, reject it
        if (cachedTo < from || cachedFrom > to) {
          console.log(`📂 Disk calendar for ${listingId} has wrong date range (cached: ${cachedFrom}→${cachedTo}, requested: ${from}→${to})`);
          return null;
        }
      }

      console.log(`📂 Loaded calendar for ${listingId} from disk (saved: ${calendarData.savedAt})`);
      return calendarData.days;
    }
    return null;
  } catch {
    return null;
  }
}

// Save rates/pricing to persistent storage
async function saveRatesToDisk(
  listingId: string,
  checkIn: string,
  checkOut: string,
  pricePerNight: number,
  total: number,
  currency: string
): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, 'rates.json');

    // Load existing rates data
    let allRates: PersistedRates = {};
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      allRates = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }

    // Update with new data
    if (!allRates[listingId]) {
      allRates[listingId] = {};
    }

    const dateRange = `${checkIn}_${checkOut}`;
    allRates[listingId][dateRange] = {
      pricePerNight,
      total,
      currency,
      savedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(allRates, null, 2));
    console.log(`💾 Saved rates for ${listingId} (${checkIn} - ${checkOut}) to disk`);
  } catch (error) {
    console.error('Failed to save rates to disk:', error);
  }
}

// Load rates from persistent storage
async function loadRatesFromDisk(
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<{ pricePerNight: number; total: number; currency: string } | null> {
  try {
    const filePath = path.join(DATA_DIR, 'rates.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const allRates: PersistedRates = JSON.parse(fileContent);

    const dateRange = `${checkIn}_${checkOut}`;
    const rateData = allRates[listingId]?.[dateRange];
    if (rateData) {
      console.log(`📂 Loaded rates for ${listingId} from disk (saved: ${rateData.savedAt})`);
      return {
        pricePerNight: rateData.pricePerNight,
        total: rateData.total,
        currency: rateData.currency,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Primary BEAPI credentials (Request to Book — for browsing, calendar, quotes, inquiries)
const GUESTY_BEAPI_CLIENT_ID = process.env.GUESTY_BEAPI_CLIENT_ID || process.env.GUESTY_BEAPI_CLIENT_ID_REQUEST_TO_BOOK || '';
const GUESTY_BEAPI_CLIENT_SECRET = process.env.GUESTY_BEAPI_CLIENT_SECRET || process.env.GUESTY_BEAPI_CLIENT_SECRET_REQUEST_TO_BOOK || '';

// Secondary BEAPI credentials (failover)
const GUESTY_BEAPI_CLIENT_ID_2 = process.env.GUESTY_BEAPI_CLIENT_ID_2 || '';
const GUESTY_BEAPI_CLIENT_SECRET_2 = process.env.GUESTY_BEAPI_CLIENT_SECRET_2 || '';

// Tertiary BEAPI credentials (third fallback)
const GUESTY_BEAPI_CLIENT_ID_3 = process.env.GUESTY_BEAPI_CLIENT_ID_3 || '';
const GUESTY_BEAPI_CLIENT_SECRET_3 = process.env.GUESTY_BEAPI_CLIENT_SECRET_3 || '';

const GUESTY_API_URL = 'https://booking.guesty.com/api';
const GUESTY_AUTH_URL = 'https://booking.guesty.com/oauth2/token';

// Open API credentials (fallback for calendar/pricing when BEAPI is rate limited)
const GUESTY_OPEN_API_CLIENT_ID = process.env.GUESTY_CLIENT_ID || '';
const GUESTY_OPEN_API_CLIENT_SECRET = process.env.GUESTY_CLIENT_SECRET || '';
const GUESTY_OPEN_API_URL = 'https://open-api.guesty.com/v1';
const GUESTY_OPEN_API_AUTH_URL = 'https://open-api.guesty.com/oauth2/token';

// Open API token cache (with file persistence for serverless)
const OPEN_API_TOKEN_FILE = '/tmp/open-api-token.json';
let openApiToken: { token: string; expiresAt: number } | null = null;

async function loadOpenApiTokenFromFile(): Promise<{ token: string; expiresAt: number } | null> {
  try {
    const content = await fs.readFile(OPEN_API_TOKEN_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (data.expiresAt > Date.now() + 5 * 60 * 1000) {
      return data;
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return null;
}

async function saveOpenApiTokenToFile(token: string, expiresAt: number): Promise<void> {
  try {
    await fs.writeFile(OPEN_API_TOKEN_FILE, JSON.stringify({ token, expiresAt }));
  } catch {
    // Ignore file write errors
  }
}

// Track which API is currently active (1 = primary, 2 = secondary, 3 = tertiary)
let activeApiIndex = 1;
// Track when each API was rate limited (to try switching back later)
let apiRateLimitedAt: { [key: number]: number | null } = { 1: null, 2: null, 3: null };
const RATE_LIMIT_COOLDOWN = 5 * 60 * 1000; // 5 minutes before trying an API again

// Global rate limit check - if all APIs are rate limited, don't even try
function areAllApisRateLimited(): boolean {
  const now = Date.now();
  const api1Limited = apiRateLimitedAt[1] && (now - apiRateLimitedAt[1] < RATE_LIMIT_COOLDOWN);
  const api2Limited = !hasTertiaryApi() || (apiRateLimitedAt[2] && (now - apiRateLimitedAt[2]! < RATE_LIMIT_COOLDOWN));
  const api3Limited = !hasTertiaryApi() || (apiRateLimitedAt[3] && (now - apiRateLimitedAt[3]! < RATE_LIMIT_COOLDOWN));

  if (!hasSecondaryApi()) return !!api1Limited;
  if (!hasTertiaryApi()) return !!(api1Limited && api2Limited);
  return !!(api1Limited && api2Limited && api3Limited);
}

// Backwards compatibility
function areBothApisRateLimited(): boolean {
  return areAllApisRateLimited();
}

interface GuestyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface GuestyListing {
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
  // Dynamic pricing returned when searching with checkIn/checkOut dates
  price?: {
    value: number; // Total price for the stay
    currency: string;
  };
  // Additional pricing details for date searches
  accommodationFare?: number;
  nightsCount?: number;
  picture?: {
    thumbnail: string;
    regular: string;
    large: string;
    caption?: string;
  };
  pictures: Array<{
    original: string;
    large?: string;
    thumbnail?: string;
    caption?: string;
  }>;
  amenities: string[];
  publicDescription?: {
    summary: string;
    space?: string;
    access?: string;
    notes?: string;
  };
  terms?: {
    checkIn?: {
      from?: string;
      to?: string;
    };
    checkOut?: {
      from?: string;
      to?: string;
    };
    cancellationPolicy?: string;
  };
  reviews?: {
    count?: number;
    avg?: number;
  };
  active?: boolean;
  type?: 'SINGLE' | 'MTL' | 'MTL_CHILD';
  parentId?: string | null;
  listingRooms?: Array<{ _id: string }>;
  timezone?: string;
}

interface GuestyReservation {
  _id: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  checkInDateLocalized: string;
  checkOutDateLocalized: string;
  guestName?: string;
  guestsCount: number;
  status: 'inquiry' | 'reserved' | 'confirmed' | 'declined' | 'canceled' | 'closed' | 'expired';
  confirmationCode?: string;
  source?: string;
  guest?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  money: {
    fareAccommodation: number;
    fareCleaning: number;
    totalFees: number;
    totalTaxes: number;
    subTotalPrice: number;
    hostPayout: number;
    totalPaid: number;
    balanceDue: number;
    currency: string;
  };
  nightsCount: number;
  listing?: {
    _id: string;
    title?: string;
    nickname?: string;
    picture?: { thumbnail?: string };
    pictures?: { thumbnail?: string }[];
    address?: { full?: string };
  };
}

interface GuestyGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface ReservationQuote {
  _id: string;
  listingId: string;
  checkInDateLocalized: string;
  checkOutDateLocalized: string;
  guestsCount: number;
  ratePlans: Array<{
    _id: string;
    name: string;
    money: {
      fareAccommodation: number;
      fareCleaning: number;
      totalFees: number;
      totalTaxes: number;
      subTotalPrice: number;
      hostPayout: number;
      currency: string;
    };
  }>;
}

interface CreateReservationResponse {
  _id: string;
  confirmationCode: string;
  status: string;
  checkInDateLocalized: string;
  checkOutDateLocalized: string;
  guestsCount: number;
  guest: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  money: {
    fareAccommodation: number;
    fareCleaning: number;
    totalFees: number;
    totalTaxes: number;
    subTotalPrice: number;
    hostPayout: number;
    currency: string;
  };
  listing: {
    _id: string;
    title: string;
  };
}

interface CalendarDay {
  date: string;
  status: 'available' | 'booked' | 'blocked';
  price: number;
  minNights?: number;
  currency: string;
}

// Token cache - BEAPI tokens last 24 hours (separate cache for each API)
// File-based persistence for serverless cold starts
// NOTE: Primary uses same file as guesty-beapi.ts to share cached tokens
const BEAPI_TOKEN_FILES = {
  1: '/tmp/beapi-token.json',  // Shared with guesty-beapi.ts
  2: '/tmp/beapi-token-2.json',
  3: '/tmp/beapi-token-3.json',
};

const cachedTokens: { [key: number]: { token: string; expiresAt: number } | null } = {
  1: null,
  2: null,
  3: null,
};

async function loadBeapiTokenFromFile(apiIndex: number): Promise<{ token: string; expiresAt: number } | null> {
  try {
    const content = await fs.readFile(BEAPI_TOKEN_FILES[apiIndex as 1 | 2 | 3], 'utf-8');
    const data = JSON.parse(content);
    if (data.expiresAt > Date.now() + 5 * 60 * 1000) {
      return data;
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return null;
}

async function saveBeapiTokenToFile(apiIndex: number, token: string, expiresAt: number): Promise<void> {
  try {
    await fs.writeFile(BEAPI_TOKEN_FILES[apiIndex as 1 | 2 | 3], JSON.stringify({ token, expiresAt }));
  } catch {
    // Ignore file write errors
  }
}

// AGGRESSIVE CACHING to minimize API calls and prevent rate limiting
// Listings cache - 24 hours (properties rarely change, this is the main data)
let cachedListings: { data: GuestyListing[]; expiresAt: number } | null = null;
const LISTINGS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - properties don't change often

// Individual listing cache - 12 hours
const listingCache = new Map<string, { data: GuestyListing; expiresAt: number }>();
const LISTING_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

// Calendar cache - 4 hours (balance between freshness and API calls)
const calendarCache = new Map<string, { data: CalendarDay[]; expiresAt: number }>();
const CALENDAR_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Quote cache - 2 hours (quotes valid for 24h in Guesty, but prices can change)
const quoteCache = new Map<string, { data: ReservationQuote; expiresAt: number }>();
const QUOTE_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Request deduplication - prevent multiple simultaneous requests for same data
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicate requests - if a request is already in flight, return the same promise
 */
function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) {
    console.log(`🔄 Deduplicating request: ${key}`);
    return pending as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if Open API is available
 */
function hasOpenApi(): boolean {
  return !!(GUESTY_OPEN_API_CLIENT_ID && GUESTY_OPEN_API_CLIENT_SECRET);
}

/**
 * Get Open API access token (with file persistence for serverless)
 */
async function getOpenApiAccessToken(): Promise<string> {
  // Check memory cache first
  if (openApiToken && openApiToken.expiresAt > Date.now()) {
    return openApiToken.token;
  }

  // Check file cache (persists across serverless cold starts)
  const fileToken = await loadOpenApiTokenFromFile();
  if (fileToken) {
    openApiToken = fileToken;
    console.log('🔑 Open API token loaded from file cache');
    return fileToken.token;
  }

  if (!hasOpenApi()) {
    throw new Error('Open API credentials not configured');
  }

  const response = await fetch(GUESTY_OPEN_API_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: GUESTY_OPEN_API_CLIENT_ID,
      client_secret: GUESTY_OPEN_API_CLIENT_SECRET,
      scope: 'open-api',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Open API access token: ${error}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + (data.expires_in - 300) * 1000;

  openApiToken = {
    token: data.access_token,
    expiresAt,
  };

  // Save to file for persistence
  await saveOpenApiTokenToFile(data.access_token, expiresAt);

  console.log('✅ Open API token cached (memory + file)');
  return data.access_token;
}

/**
 * Make a request to Guesty Open API
 */
async function openApiFetch<T>(endpoint: string): Promise<T> {
  const token = await getOpenApiAccessToken();

  const response = await fetch(`${GUESTY_OPEN_API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Open API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get calendar data from Open API (fallback when BEAPI is rate limited)
 * Uses the availability-pricing endpoint for dynamic pricing
 */
async function getCalendarFromOpenApi(
  listingId: string,
  from: string,
  to: string,
  cacheKey: string
): Promise<CalendarDay[]> {
  // Use the availability-pricing calendar endpoint for dynamic pricing
  const data = await openApiFetch<{
    status: number;
    data: {
      days: Array<{
        date: string;
        price: number;
        currency: string;
        status: string;
        minNights: number;
        blocks: {
          m: boolean;  // manual block
          r: boolean;  // reservation
          b: boolean;  // blocked
          bd: boolean; // blocked dates
          sr: boolean; // soft reservation
          abl: boolean;
          a: boolean;
          bw: boolean;
          o: boolean;
          pt: boolean;
        };
      }>;
    };
  }>(`/availability-pricing/api/calendar/listings/${listingId}?startDate=${from}&endDate=${to}`);

  const calendar: CalendarDay[] = (data.data?.days || []).map(day => {
    // Check if any block is active
    const isBlocked = day.blocks && (
      day.blocks.m || day.blocks.r || day.blocks.b ||
      day.blocks.bd || day.blocks.sr || day.blocks.abl ||
      day.blocks.a || day.blocks.bw || day.blocks.o || day.blocks.pt
    );

    return {
      date: day.date,
      status: isBlocked ? 'booked' : (day.status === 'available' ? 'available' : 'blocked'),
      price: day.price,
      minNights: day.minNights || 1,
      currency: day.currency || 'USD',
    };
  });

  // Cache the result
  calendarCache.set(cacheKey, {
    data: calendar,
    expiresAt: Date.now() + CALENDAR_CACHE_DURATION,
  });

  console.log(`✅ Got calendar with dynamic pricing from Open API for ${listingId}`);
  return calendar;
}

/**
 * Get credentials for the specified API index
 */
function getCredentials(apiIndex: number): { clientId: string; clientSecret: string } {
  if (apiIndex === 3) {
    return {
      clientId: GUESTY_BEAPI_CLIENT_ID_3,
      clientSecret: GUESTY_BEAPI_CLIENT_SECRET_3,
    };
  }
  if (apiIndex === 2) {
    return {
      clientId: GUESTY_BEAPI_CLIENT_ID_2,
      clientSecret: GUESTY_BEAPI_CLIENT_SECRET_2,
    };
  }
  return {
    clientId: GUESTY_BEAPI_CLIENT_ID,
    clientSecret: GUESTY_BEAPI_CLIENT_SECRET,
  };
}

/**
 * Check if secondary API is available
 */
function hasSecondaryApi(): boolean {
  return !!(GUESTY_BEAPI_CLIENT_ID_2 && GUESTY_BEAPI_CLIENT_SECRET_2);
}

/**
 * Check if tertiary API is available
 */
function hasTertiaryApi(): boolean {
  return !!(GUESTY_BEAPI_CLIENT_ID_3 && GUESTY_BEAPI_CLIENT_SECRET_3);
}

/**
 * Switch to the next available API when rate limited
 */
function switchToOtherApi(): boolean {
  const now = Date.now();

  // Mark current API as rate limited
  apiRateLimitedAt[activeApiIndex] = now;

  // Try to find an API that has cooled down
  const apiOrder = [1, 2, 3];
  for (const apiIdx of apiOrder) {
    if (apiIdx === activeApiIndex) continue;
    if (apiIdx === 2 && !hasSecondaryApi()) continue;
    if (apiIdx === 3 && !hasTertiaryApi()) continue;

    const rateLimitedAt = apiRateLimitedAt[apiIdx];
    if (!rateLimitedAt || now - rateLimitedAt >= RATE_LIMIT_COOLDOWN) {
      console.log(`🔄 Switching to API ${apiIdx} BEAPI credentials due to rate limiting`);
      activeApiIndex = apiIdx;
      return true;
    }
  }

  // All APIs are rate limited
  const availableApis = [1];
  if (hasSecondaryApi()) availableApis.push(2);
  if (hasTertiaryApi()) availableApis.push(3);
  console.warn(`⚠️ All ${availableApis.length} APIs rate limited`);
  return false;
}

/**
 * Get OAuth2 access token from Guesty BEAPI with automatic failover
 */
async function getAccessToken(retryCount = 0, attemptedApis: Set<number> = new Set()): Promise<string> {
  const MAX_RETRIES = 2;
  const BASE_DELAY = 1000;

  // If all APIs are rate limited, throw immediately
  if (areAllApisRateLimited()) {
    throw new Error('RATE_LIMITED: All APIs are in cooldown');
  }

  // Periodically check if we can switch to a cooled-down API
  const now = Date.now();
  if (activeApiIndex !== 1 && apiRateLimitedAt[1] && now - apiRateLimitedAt[1] >= RATE_LIMIT_COOLDOWN) {
    console.log('🔄 Cooldown expired, switching back to primary BEAPI credentials');
    activeApiIndex = 1;
    apiRateLimitedAt[1] = null;
  }

  // Get the right cached token for current API
  const cachedToken = cachedTokens[activeApiIndex];

  // Check memory cache - BEAPI tokens last 24 hours
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  // Check file cache (persists across serverless cold starts)
  const fileToken = await loadBeapiTokenFromFile(activeApiIndex);
  if (fileToken) {
    cachedTokens[activeApiIndex] = fileToken;
    console.log(`🔑 BEAPI token ${activeApiIndex} loaded from file cache`);
    return fileToken.token;
  }

  const { clientId, clientSecret } = getCredentials(activeApiIndex);

  if (!clientId || !clientSecret) {
    // If current API has no credentials, try switching
    if (hasSecondaryApi() && activeApiIndex === 1) {
      activeApiIndex = 2;
      return getAccessToken(0, attemptedApis);
    }
    throw new Error('GUESTY_BEAPI_CLIENT_ID and GUESTY_BEAPI_CLIENT_SECRET must be configured in .env.local');
  }

  attemptedApis.add(activeApiIndex);

  try {
    const response = await fetch(GUESTY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'booking_engine:api',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      const isRateLimited = response.status === 429 || error.includes('TOO_MANY_REQUESTS');

      // If rate limited, try switching to other API
      if (isRateLimited) {
        console.warn(`⚠️ API ${activeApiIndex} rate limited on auth`);

        // Try another API if we haven't exhausted all options
        const maxApis = 1 + (hasSecondaryApi() ? 1 : 0) + (hasTertiaryApi() ? 1 : 0);
        if (attemptedApis.size < maxApis) {
          if (switchToOtherApi()) {
            return getAccessToken(0, attemptedApis);
          }
        }

        // If we can retry on current API, do so
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount);
          console.warn(`Rate limited on auth, retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          return getAccessToken(retryCount + 1, attemptedApis);
        }
      }

      throw new Error(`Failed to get Guesty BEAPI access token: ${error}`);
    }

    const data: GuestyToken = await response.json();

    // Cache token for the current API (expires in 24 hours, we refresh 5 min early)
    const expiresAt = Date.now() + (data.expires_in - 300) * 1000;
    const tokenData = {
      token: data.access_token,
      expiresAt,
    };

    cachedTokens[activeApiIndex] = tokenData;

    // Save to file for persistence across serverless cold starts
    await saveBeapiTokenToFile(activeApiIndex, data.access_token, expiresAt);

    const apiNames = { 1: 'primary', 2: 'secondary', 3: 'tertiary' };
    console.log(`✅ BEAPI ${apiNames[activeApiIndex as keyof typeof apiNames]} token cached (memory + file)`);
    return data.access_token;
  } catch (error) {
    // Network error - try other API if available
    if (error instanceof Error && !error.message.includes('Failed to get Guesty')) {
      const maxApis = 1 + (hasSecondaryApi() ? 1 : 0) + (hasTertiaryApi() ? 1 : 0);
      if (attemptedApis.size < maxApis) {
        console.warn(`Network error on API ${activeApiIndex}, trying other API`);
        if (switchToOtherApi()) {
          return getAccessToken(0, attemptedApis);
        }
      }

      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        console.warn(`Network error on auth, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return getAccessToken(retryCount + 1, attemptedApis);
      }
    }
    throw error;
  }
}

/**
 * Make an authenticated request to Guesty BEAPI with automatic failover
 */
async function beapiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
  attemptedSwitch = false
): Promise<T> {
  const MAX_RETRIES = 2;
  const BASE_DELAY = 1000;

  const token = await getAccessToken();

  try {
    const response = await fetch(`${GUESTY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      const isRateLimited = response.status === 429 || error.includes('TOO_MANY_REQUESTS');

      // Handle rate limiting (429) - try failover to other API
      if (isRateLimited) {
        console.warn(`⚠️ API ${activeApiIndex} rate limited on ${endpoint}`);

        // Try switching to other API if we haven't already
        const maxApis = 1 + (hasSecondaryApi() ? 1 : 0) + (hasTertiaryApi() ? 1 : 0);
        if (!attemptedSwitch && maxApis > 1) {
          // Clear current token cache to force re-auth
          cachedTokens[activeApiIndex] = null;

          if (switchToOtherApi()) {
            const apiNames = { 1: 'primary', 2: 'secondary', 3: 'tertiary' };
            console.log(`🔄 Retrying request with ${apiNames[activeApiIndex as keyof typeof apiNames]} API`);
            return beapiFetch<T>(endpoint, options, 0, true);
          }
        }

        // If we can still retry on current API, do so
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount);
          console.warn(`Rate limited, retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          return beapiFetch<T>(endpoint, options, retryCount + 1, attemptedSwitch);
        }
      }

      throw new Error(`Guesty BEAPI error: ${response.status} - ${error}`);
    }

    return response.json();
  } catch (error) {
    // Network error - try other API if available
    if (error instanceof Error && !error.message.includes('Guesty BEAPI error')) {
      if (!attemptedSwitch && hasSecondaryApi()) {
        console.warn(`Network error on API ${activeApiIndex}, trying failover`);
        if (switchToOtherApi()) {
          return beapiFetch<T>(endpoint, options, 0, true);
        }
      }

      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        console.warn(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return beapiFetch<T>(endpoint, options, retryCount + 1, attemptedSwitch);
      }
    }
    throw error;
  }
}

function isParentListing(listing: GuestyListing): boolean {
  if (listing.type === 'MTL_CHILD') return false;
  if (listing.parentId) return false;
  return true;
}

function filterParentListings(listings: GuestyListing[]): GuestyListing[] {
  return listings.filter(isParentListing);
}

/**
 * Get listings from Open API (fallback when BEAPI is rate limited)
 * Open API has different rate limits and can serve as backup
 */
async function getListingsFromOpenApi(): Promise<GuestyListing[]> {
  if (!hasOpenApi()) {
    throw new Error('Open API not configured');
  }

  console.log('📡 Fetching listings from Open API (BEAPI fallback)...');

  const data = await openApiFetch<{
    results: Array<{
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
      listingRooms?: Array<{ _id: string }>;
    }>;
    count: number;
  }>('/listings?limit=100&fields=_id,title,nickname,propertyType,roomType,accommodates,bedrooms,bathrooms,beds,address,prices,picture,pictures,amenities,publicDescription,terms,reviews,active,type,parentId,listingRooms');

  console.log(`✅ Open API returned ${data.results?.length || 0} listings`);

  // Convert Open API format to match BEAPI GuestyListing format
  return (data.results || []).map(listing => ({
    ...listing,
    timezone: undefined,
  })) as GuestyListing[];
}

// Track if a background refresh is already in progress
let isRefreshingListings = false;

/**
 * Background refresh listings - does NOT block the main request
 */
async function refreshListingsInBackground(): Promise<void> {
  if (isRefreshingListings) {
    console.log('🔄 Background refresh already in progress, skipping');
    return;
  }

  isRefreshingListings = true;
  console.log('🔄 Starting background listings refresh...');

  try {
    // Try BEAPI first
    if (!areBothApisRateLimited()) {
      try {
        const data = await beapiFetch<{ results: GuestyListing[] }>('/listings?limit=100');
        if (data.results && data.results.length > 0) {
          cachedListings = {
            data: data.results,
            expiresAt: Date.now() + LISTINGS_CACHE_DURATION,
          };
          await saveListingsToDisk(data.results);
          console.log(`✅ Background refresh: ${data.results.length} listings from BEAPI`);
          return;
        }
      } catch (e) {
        console.warn('⚠️ Background BEAPI refresh failed:', e);
      }
    }

    // Try Open API as fallback
    if (hasOpenApi()) {
      try {
        const openApiListings = await getListingsFromOpenApi();
        if (openApiListings.length > 0) {
          cachedListings = {
            data: openApiListings,
            expiresAt: Date.now() + LISTINGS_CACHE_DURATION,
          };
          await saveListingsToDisk(openApiListings);
          console.log(`✅ Background refresh: ${openApiListings.length} listings from Open API`);
        }
      } catch (e) {
        console.warn('⚠️ Background Open API refresh failed:', e);
      }
    }
  } finally {
    isRefreshingListings = false;
  }
}

/**
 * Get all listings - ALWAYS returns immediately from cache/disk
 *
 * PRODUCTION STRATEGY (never blocks, never rate limits):
 * 1. Return from memory cache (instant)
 * 2. Return from disk cache (fast)
 * 3. If data is stale (>12h), trigger background refresh (non-blocking)
 * 4. Only call API directly if NO cached data exists at all
 *
 * This ensures user requests NEVER wait for API calls!
 */
export async function getListings(params?: {
  limit?: number;
  skip?: number;
  active?: boolean;
  useCache?: boolean;
  parentsOnly?: boolean;
  checkIn?: string;
  checkOut?: string;
  minOccupancy?: number;
}): Promise<GuestyListing[]> {
  // If fallback mode is enabled, return empty array to trigger fallback in caller
  if (USE_FALLBACK_ONLY) {
    return [];
  }

  const useCache = params?.useCache !== false;
  const parentsOnly = params?.parentsOnly !== false;

  // Helper to filter and limit results
  const processResults = (listings: GuestyListing[]): GuestyListing[] => {
    let results = listings;
    if (parentsOnly) {
      results = filterParentListings(results);
    }
    if (params?.limit) {
      results = results.slice(0, params.limit);
    }
    return results;
  };

  // STEP 1: Check memory cache first (instant)
  if (useCache && cachedListings && cachedListings.data.length > 0 && !params?.skip) {
    const isExpired = cachedListings.expiresAt < Date.now();
    console.log(`📦 Returning ${cachedListings.data.length} listings from memory${isExpired ? ' (stale, refreshing in background)' : ''}`);

    // If stale, trigger background refresh but still return cached data immediately
    if (isExpired) {
      refreshListingsInBackground().catch(() => {});
    }

    return processResults(cachedListings.data);
  }

  // STEP 2: Check disk cache (fast)
  const diskListings = await loadListingsFromDisk();
  if (diskListings && diskListings.length > 0) {
    // Load into memory cache
    cachedListings = {
      data: diskListings,
      expiresAt: Date.now() + LISTINGS_CACHE_DURATION,
    };

    // Check age and trigger background refresh if stale
    try {
      const filePath = path.join(DATA_DIR, 'listings.json');
      const stats = await fs.stat(filePath);
      const ageMs = Date.now() - stats.mtime.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);

      console.log(`📂 Returning ${diskListings.length} listings from disk (${ageHours.toFixed(1)}h old)`);

      // If older than 12 hours, refresh in background
      if (ageHours > 12) {
        console.log('⏰ Data is stale, triggering background refresh...');
        refreshListingsInBackground().catch(() => {});
      }
    } catch {
      // Couldn't check age, still return data
    }

    return processResults(diskListings);
  }

  // STEP 3: NO cached data at all - we MUST fetch (first run only)
  console.log('⚠️ No cached data found - fetching from API (first run)...');

  // Use request deduplication for first-run scenario
  const cacheKey = `listings-first-run`;

  return deduplicateRequest(cacheKey, async () => {
    // Try BEAPI first
    if (!areBothApisRateLimited()) {
      try {
        const data = await beapiFetch<{ results: GuestyListing[] }>('/listings?limit=100');

        // Cache to memory
        if (!params?.skip) {
          cachedListings = {
            data: data.results,
            expiresAt: Date.now() + LISTINGS_CACHE_DURATION,
          };

          // SAVE TO DISK for persistence across restarts
          await saveListingsToDisk(data.results);
          console.log(`✅ BEAPI returned ${data.results.length} listings - saved to disk`);
        }

        return processResults(data.results);
      } catch (beapiError) {
        console.warn('⚠️ BEAPI failed:', beapiError);
        // Continue to Open API fallback
      }
    } else {
      console.log('⚠️ All BEAPI credentials rate limited');
    }

    // STEP 4: Try Open API as fallback
    if (hasOpenApi()) {
      try {
        const openApiListings = await getListingsFromOpenApi();

        if (!params?.skip && openApiListings.length > 0) {
          cachedListings = {
            data: openApiListings,
            expiresAt: Date.now() + LISTINGS_CACHE_DURATION,
          };
          // Save Open API results to disk too
          await saveListingsToDisk(openApiListings);
          console.log(`✅ Open API returned ${openApiListings.length} listings - saved to disk`);
        }

        return processResults(openApiListings);
      } catch (openApiError) {
        console.warn('⚠️ Open API also failed:', openApiError);
      }
    }

    // STEP 5: Return disk data as last resort (even if stale)
    if (diskListings && diskListings.length > 0) {
      console.log('📦 All APIs failed - returning stale disk data');
      return processResults(diskListings);
    }

    // STEP 6: Return memory cache as absolute last resort
    if (cachedListings && cachedListings.data.length > 0) {
      console.log('📦 Returning stale memory cache');
      return processResults(cachedListings.data);
    }

    throw new Error('All APIs unavailable and no cached data');
  });
}

/**
 * Get a single listing by ID with caching
 */
export async function getListing(listingId: string): Promise<GuestyListing> {
  // If fallback mode, return a minimal listing that triggers fallback handling
  if (USE_FALLBACK_ONLY) {
    // Return null-like to trigger fallback - caller should handle this
    return null as unknown as GuestyListing;
  }

  // Check cache
  const cached = listingCache.get(listingId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Check if it's in the listings cache (even if expired, for fallback)
  const listingsData = cachedListings?.data || [];
  const foundInListings = listingsData.find(l => l._id === listingId);

  // If valid listings cache, use it
  if (cachedListings && cachedListings.expiresAt > Date.now() && foundInListings) {
    listingCache.set(listingId, {
      data: foundInListings,
      expiresAt: Date.now() + LISTING_CACHE_DURATION,
    });
    return foundInListings;
  }

  try {
    const listing = await beapiFetch<GuestyListing>(`/listings/${listingId}`);

    listingCache.set(listingId, {
      data: listing,
      expiresAt: Date.now() + LISTING_CACHE_DURATION,
    });

    return listing;
  } catch (error) {
    // Return stale cache if available when rate-limited
    if (cached && cached.data) {
      console.warn('BEAPI listing error, returning stale cache:', error);
      return cached.data;
    }
    // Try from stale listings cache
    if (foundInListings) {
      console.warn('BEAPI listing error, returning from stale listings cache:', error);
      return foundInListings;
    }
    throw error;
  }
}

/**
 * Search listings with filters
 */
export async function searchListings(params: {
  city?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  parentsOnly?: boolean;
}): Promise<GuestyListing[]> {
  // Helper to filter results locally
  const filterResults = (listings: GuestyListing[]): GuestyListing[] => {
    let results = listings;

    // Filter by city locally
    if (params.city) {
      results = results.filter(listing =>
        listing.address?.city?.toLowerCase().includes(params.city!.toLowerCase())
      );
    }

    // Filter by guest capacity locally
    if (params.guests) {
      results = results.filter(listing => listing.accommodates >= params.guests!);
    }

    // Filter by price locally
    if (params.minPrice) {
      results = results.filter(listing => (listing.prices?.basePrice || 0) >= params.minPrice!);
    }
    if (params.maxPrice) {
      results = results.filter(listing => (listing.prices?.basePrice || 0) <= params.maxPrice!);
    }

    if (params.parentsOnly !== false) {
      results = filterParentListings(results);
    }

    return results;
  };

  try {
    // Build query params for BEAPI
    const searchParams = new URLSearchParams();
    searchParams.set('limit', '100');

    if (params.checkIn) searchParams.set('checkIn', params.checkIn);
    if (params.checkOut) searchParams.set('checkOut', params.checkOut);
    if (params.guests) searchParams.set('minOccupancy', params.guests.toString());
    if (params.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());

    const endpoint = `/listings?${searchParams.toString()}`;
    const data = await beapiFetch<{ results: GuestyListing[] }>(endpoint);

    return filterResults(data.results);
  } catch (error) {
    // Return filtered stale cache if available when rate-limited
    if (cachedListings && cachedListings.data.length > 0) {
      console.warn('BEAPI search error, returning filtered stale cache:', error);
      return filterResults(cachedListings.data);
    }
    throw error;
  }
}

/**
 * Generate a synthetic calendar with all dates available.
 * Used when all APIs are rate limited and no cached data exists.
 * Actual availability is verified at booking time via getQuote.
 */
function generateSyntheticCalendar(from: string, to: string): CalendarDay[] {
  const days: CalendarDay[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current < end) {
    days.push({
      date: current.toISOString().split('T')[0],
      status: 'available',
      price: 0, // Price unknown — frontend uses property base price
      minNights: undefined,
      currency: 'USD',
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Get calendar availability for a listing
 * STRATEGY: Memory cache -> Disk cache -> BEAPI (best availability) -> Open API -> Stale cache -> Synthetic
 * BEAPI has proper availability status, Open API availability-pricing may not be accurate
 */
export async function getCalendar(
  listingId: string,
  from: string,
  to: string
): Promise<CalendarDay[]> {
  // If fallback mode, return synthetic calendar (all dates available)
  if (USE_FALLBACK_ONLY) {
    return generateSyntheticCalendar(from, to);
  }

  const cacheKey = `${listingId}-${from}-${to}`;

  // STEP 1: Check memory cache first (fastest)
  const cached = calendarCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`📦 Calendar for ${listingId} from memory cache`);
    return cached.data;
  }

  // STEP 2: Check disk cache (validate date range matches)
  const diskCalendar = await loadCalendarFromDisk(listingId, undefined, from, to);
  if (diskCalendar && diskCalendar.length > 0) {
    // Load to memory cache
    calendarCache.set(cacheKey, {
      data: diskCalendar,
      expiresAt: Date.now() + CALENDAR_CACHE_DURATION,
    });
    console.log(`📂 Calendar for ${listingId} loaded from disk`);
    return diskCalendar;
  }

  // STEP 3: Try BEAPI FIRST (has proper availability status)
  if (!areBothApisRateLimited()) {
    try {
      console.log('📅 Trying BEAPI for calendar...');
      // BEAPI calendar returns a raw array of day objects
      type CalendarDayRaw = {
        date: string;
        status?: string;
        available?: boolean;
        price?: number;
        minNights?: number;
        currency?: string;
        cta?: boolean;
        ctd?: boolean;
      };
      const response = await beapiFetch<
        CalendarDayRaw[] | { data?: CalendarDayRaw[]; days?: CalendarDayRaw[] }
      >(`/listings/${listingId}/calendar?from=${from}&to=${to}`);

      // Handle response: BEAPI returns a raw array, not wrapped in {data/days}
      const rawDays = Array.isArray(response)
        ? response
        : (response.data || response.days || []);
      console.log(`📅 BEAPI calendar: ${rawDays.length} days, isArray=${Array.isArray(response)}`);

      if (rawDays.length > 0) {
        const priceSample = rawDays.slice(0, 5).map(d => `${d.date}: $${d.price}`);
        console.log(`📅 BEAPI Calendar: ${priceSample.join(', ')} ...`);

        const uniquePrices = new Set(rawDays.map(d => d.price));
        if (uniquePrices.size === 1) {
          console.warn(`⚠️ BEAPI: All ${rawDays.length} days have same price: $${rawDays[0]?.price} (base price)`);
        } else {
          console.log(`✅ BEAPI: Found ${uniquePrices.size} different price points`);
        }
      }

      // Handle both 'status' string and 'available' boolean formats
      const calendar = rawDays.map(day => {
        let status: 'available' | 'booked' | 'blocked';
        if (day.status) {
          // Use status string directly (available, unavailable, reserved, booked)
          status = day.status === 'available' ? 'available' : 'booked';
        } else if (day.available !== undefined) {
          // Convert boolean to status
          status = day.available ? 'available' : 'booked';
        } else {
          // Default to available if no status info
          status = 'available';
        }

        return {
          date: day.date,
          status,
          price: day.price || 0,
          minNights: day.minNights,
          currency: day.currency || 'USD',
        };
      });

      // Cache to memory
      calendarCache.set(cacheKey, {
        data: calendar,
        expiresAt: Date.now() + CALENDAR_CACHE_DURATION,
      });

      // Save to disk for persistence
      await saveCalendarToDisk(listingId, calendar);

      return calendar;
    } catch (beapiError) {
      console.warn('BEAPI calendar failed:', beapiError);
    }
  } else {
    console.log('⚠️ All BEAPI credentials rate limited');
  }

  // STEP 4: Try Open API as fallback (has dynamic pricing but may not have accurate availability)
  if (hasOpenApi()) {
    try {
      console.log('📅 Trying Open API for calendar (fallback)...');
      const openApiCalendar = await getCalendarFromOpenApi(listingId, from, to, cacheKey);
      if (openApiCalendar.length > 0) {
        const uniquePrices = new Set(openApiCalendar.map(d => d.price));
        console.log(`✅ Open API: ${openApiCalendar.length} days, ${uniquePrices.size} unique prices`);

        // Save to disk for persistence
        await saveCalendarToDisk(listingId, openApiCalendar);
        return openApiCalendar;
      }
    } catch (openApiError) {
      console.warn('Open API calendar failed:', openApiError);
    }
  }

  // STEP 5: Return stale memory cache if available
  if (cached && cached.data.length > 0) {
    console.warn('All calendar APIs failed, returning stale memory cache');
    return cached.data;
  }

  // STEP 6: Last resort - try stale disk cache (up to 24h old)
  // Stale availability data is far better than blocking all dates
  const STALE_DISK_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  const staleDiskCalendar = await loadCalendarFromDisk(listingId, STALE_DISK_MAX_AGE, from, to);
  if (staleDiskCalendar && staleDiskCalendar.length > 0) {
    console.warn(`⚠️ Using stale disk cache for ${listingId} (all APIs failed)`);
    // Refresh memory cache with stale data so subsequent requests don't hit disk
    calendarCache.set(cacheKey, {
      data: staleDiskCalendar,
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 min - short TTL for stale data
    });
    return staleDiskCalendar;
  }

  // STEP 7: Generate synthetic calendar when all APIs fail
  // All dates shown as available - actual availability is verified at booking time via getQuote
  console.warn(`⚠️ All APIs rate limited, no cache for ${listingId} — returning synthetic calendar`);
  const synthetic = generateSyntheticCalendar(from, to);
  // Cache with short TTL so we retry APIs soon
  calendarCache.set(cacheKey, {
    data: synthetic,
    expiresAt: Date.now() + (2 * 60 * 1000), // 2 min
  });
  return synthetic;
}

/**
 * Check availability for a listing
 */
export async function checkAvailability(
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<{
  available: boolean;
  nightsCount: number;
  pricePerNight: number;
  totalAccommodation: number;
  cleaningFee: number;
  taxes: number;
  totalPrice: number;
  currency: string;
  unavailableDates: string[];
}> {
  const calendar = await getCalendar(listingId, checkIn, checkOut);

  const stayNights = calendar.filter(day => day.date !== checkOut);

  const unavailableDates = stayNights
    .filter(day => day.status !== 'available')
    .map(day => day.date);

  const isAvailable = unavailableDates.length === 0;
  const nightsCount = stayNights.length;

  const totalAccommodation = stayNights.reduce((sum, day) => sum + day.price, 0);
  const pricePerNight = nightsCount > 0 ? Math.round(totalAccommodation / nightsCount) : 0;

  const cleaningFee = 0;
  const taxRate = 0.13;
  const taxes = Math.round((totalAccommodation + cleaningFee) * taxRate);
  const totalPrice = totalAccommodation + cleaningFee + taxes;

  return {
    available: isAvailable,
    nightsCount,
    pricePerNight,
    totalAccommodation,
    cleaningFee,
    taxes,
    totalPrice,
    currency: calendar[0]?.currency || 'USD',
    unavailableDates,
  };
}

/**
 * Create a reservation quote (BEAPI quote flow)
 */
export async function createQuote(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  coupons?: string[];
}): Promise<ReservationQuote> {
  // If fallback mode, return null to trigger estimated quote handling in caller
  if (USE_FALLBACK_ONLY) {
    return null as unknown as ReservationQuote;
  }

  const cacheKey = `${params.listingId}-${params.checkIn}-${params.checkOut}-${params.guestsCount}`;

  // Check cache
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // If both APIs are rate limited, return stale cache or throw
  if (areBothApisRateLimited()) {
    if (cached && cached.data) {
      console.log('Both APIs rate limited - returning stale cached quote');
      return cached.data;
    }
    throw new Error('Both APIs rate limited - quotes unavailable');
  }

  try {
    const requestBody: Record<string, unknown> = {
      listingId: params.listingId,
      checkInDateLocalized: params.checkIn,
      checkOutDateLocalized: params.checkOut,
      guestsCount: params.guestsCount,
    };

    if (params.coupons && params.coupons.length > 0) {
      requestBody.coupons = params.coupons;
    }

    const quote = await beapiFetch<ReservationQuote>('/reservations/quotes', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // Cache the quote
    quoteCache.set(cacheKey, {
      data: quote,
      expiresAt: Date.now() + QUOTE_CACHE_DURATION,
    });

    return quote;
  } catch (error) {
    // Return stale cache if available when rate-limited
    if (cached && cached.data) {
      console.warn('BEAPI quote error, returning stale cache:', error);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Get a price quote using the BEAPI quote flow
 */
export async function getQuote(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
}): Promise<{
  available: boolean;
  quote: {
    quoteId: string;
    ratePlanId: string;
    nightsCount: number;
    pricePerNight: number;
    accommodation: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    total: number;
    currency: string;
  } | null;
  unavailableDates: string[];
  listing: {
    id: string;
    title: string;
    maxGuests: number;
  } | null;
}> {
  try {
    const listing = await getListing(params.listingId);

    if (params.guestsCount > listing.accommodates) {
      return {
        available: false,
        quote: null,
        unavailableDates: [],
        listing: {
          id: listing._id,
          title: listing.title,
          maxGuests: listing.accommodates,
        },
      };
    }

    // Check availability first
    const availability = await checkAvailability(
      params.listingId,
      params.checkIn,
      params.checkOut
    );

    if (!availability.available) {
      return {
        available: false,
        quote: null,
        unavailableDates: availability.unavailableDates,
        listing: {
          id: listing._id,
          title: listing.title,
          maxGuests: listing.accommodates,
        },
      };
    }

    // Create quote via BEAPI
    const quoteResponse = await createQuote({
      listingId: params.listingId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guestsCount: params.guestsCount,
    });

    const ratePlan = quoteResponse.ratePlans?.[0];
    if (!ratePlan) {
      return {
        available: false,
        quote: null,
        unavailableDates: [],
        listing: {
          id: listing._id,
          title: listing.title,
          maxGuests: listing.accommodates,
        },
      };
    }

    const nightsCount = availability.nightsCount;
    const accommodation = ratePlan.money.fareAccommodation;
    const pricePerNight = nightsCount > 0 ? Math.round(accommodation / nightsCount) : 0;
    const cleaningFee = ratePlan.money.fareCleaning;
    // No service fee for direct bookings - that's the whole point of booking direct!
    const serviceFee = 0;
    // Recalculate total without Guesty's service fees (accommodation + cleaning + taxes only)
    const total = accommodation + cleaningFee + ratePlan.money.totalTaxes;

    // Save rates to disk for persistence
    await saveRatesToDisk(
      params.listingId,
      params.checkIn,
      params.checkOut,
      pricePerNight,
      total,
      ratePlan.money.currency
    );

    return {
      available: true,
      quote: {
        quoteId: quoteResponse._id,
        ratePlanId: ratePlan._id,
        nightsCount,
        pricePerNight,
        accommodation,
        cleaningFee,
        serviceFee,
        taxes: ratePlan.money.totalTaxes,
        total,
        currency: ratePlan.money.currency,
      },
      unavailableDates: [],
      listing: {
        id: listing._id,
        title: listing.title,
        maxGuests: listing.accommodates,
      },
    };
  } catch (error) {
    console.error('Error getting quote:', error);

    // Try to load rates from disk as fallback
    const diskRates = await loadRatesFromDisk(params.listingId, params.checkIn, params.checkOut);
    if (diskRates) {
      console.log('📂 Using rates from disk cache as fallback');
      // Return a partial quote from disk data
      // Note: This won't have a valid quoteId for booking, but shows pricing
      return {
        available: true,
        quote: {
          quoteId: 'disk-cache', // Indicates this needs refresh for actual booking
          ratePlanId: 'disk-cache',
          nightsCount: Math.ceil((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
          pricePerNight: diskRates.pricePerNight,
          accommodation: diskRates.total * 0.85, // Estimate
          cleaningFee: diskRates.total * 0.1, // Estimate
          serviceFee: 0,
          taxes: diskRates.total * 0.05, // Estimate
          total: diskRates.total,
          currency: diskRates.currency,
        },
        unavailableDates: [],
        listing: null,
      };
    }

    throw error;
  }
}

/**
 * Create an instant reservation (confirmed booking with payment)
 */
export async function createInstantBooking(params: {
  quoteId: string;
  ratePlanId: string;
  ccToken: string; // Stripe payment token (pm_xxx format)
  guest: GuestyGuest;
}): Promise<CreateReservationResponse> {
  const requestBody = {
    ratePlanId: params.ratePlanId,
    ccToken: params.ccToken,
    guest: {
      firstName: params.guest.firstName,
      lastName: params.guest.lastName,
      email: params.guest.email,
      phone: params.guest.phone,
    },
  };

  return beapiFetch<CreateReservationResponse>(
    `/reservations/quotes/${params.quoteId}/instant`,
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }
  );
}

/**
 * Create a booking inquiry (request to book, payment optional)
 */
export async function createInquiry(params: {
  quoteId: string;
  ratePlanId: string;
  guest: GuestyGuest;
  message?: string;
  ccToken?: string;
}): Promise<CreateReservationResponse> {
  const requestBody: Record<string, unknown> = {
    ratePlanId: params.ratePlanId,
    guest: {
      firstName: params.guest.firstName,
      lastName: params.guest.lastName,
      email: params.guest.email,
      phone: params.guest.phone,
    },
  };

  if (params.message) {
    requestBody.message = params.message;
  }

  if (params.ccToken) {
    requestBody.ccToken = params.ccToken;
  }

  return beapiFetch<CreateReservationResponse>(
    `/reservations/quotes/${params.quoteId}/inquiry`,
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }
  );
}

/**
 * Legacy function for backward compatibility - creates inquiry
 */
export async function createReservation(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guest: GuestyGuest;
  guestsCount: number;
  status?: 'inquiry' | 'reserved' | 'confirmed';
  notes?: string;
}): Promise<CreateReservationResponse> {
  // Create quote first
  const quote = await createQuote({
    listingId: params.listingId,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guestsCount: params.guestsCount,
  });

  const ratePlan = quote.ratePlans?.[0];
  if (!ratePlan) {
    throw new Error('No rate plan available for this booking');
  }

  // Create inquiry (default for BEAPI without payment token)
  return createInquiry({
    quoteId: quote._id,
    ratePlanId: ratePlan._id,
    guest: params.guest,
    message: params.notes,
  });
}

/**
 * Get reservations - Note: BEAPI doesn't support listing reservations directly
 * This is kept for backward compatibility but may need Open API for full functionality
 */
export async function getReservations(
  listingId: string,
  params?: {
    status?: 'inquiry' | 'reserved' | 'confirmed' | 'canceled';
    fromDate?: string;
    toDate?: string;
  }
): Promise<GuestyReservation[]> {
  // BEAPI doesn't have a list reservations endpoint
  // Return empty array - use Open API if you need this functionality
  console.warn('getReservations is not fully supported in BEAPI. Use Open API for reservation management.');
  return [];
}

/**
 * Get reviews for a listing
 */
export interface GuestyReview {
  _id: string;
  listingId: string;
  channelId: string;
  reviewerName: string;
  reviewDate: string;
  publicReview?: string;
  privateReview?: string;
  rating?: number;
  reviewResponse?: string;
  reviewResponseDate?: string;
}

// Reviews cache
const reviewsCache = new Map<string, { data: GuestyReview[]; expiresAt: number }>();
const REVIEWS_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours (reviews don't change often)

export async function getReviews(listingId: string): Promise<GuestyReview[]> {
  // Check cache
  const cached = reviewsCache.get(listingId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const data = await beapiFetch<{ results: GuestyReview[] }>(
      `/reviews?listingId=${listingId}&limit=10`
    );

    const reviews = data.results || [];

    // Cache the result
    reviewsCache.set(listingId, {
      data: reviews,
      expiresAt: Date.now() + REVIEWS_CACHE_DURATION,
    });

    return reviews;
  } catch (error) {
    // Return stale cache if available when rate-limited
    if (cached && cached.data.length > 0) {
      console.warn('BEAPI reviews error, returning stale cache:', error);
      return cached.data;
    }
    console.error('Error fetching reviews:', error);
    return [];
  }
}

// Cities cache
let cachedCities: { data: string[]; expiresAt: number } | null = null;
const CITIES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (cities almost never change)

/**
 * Get cities from listings
 */
export async function getCities(): Promise<string[]> {
  // Check cache first
  if (cachedCities && cachedCities.expiresAt > Date.now()) {
    return cachedCities.data;
  }

  // If fallback mode, return hardcoded cities
  if (USE_FALLBACK_ONLY) {
    return ['Bal Harbour', 'Kissimmee', 'Miami', 'Miami Beach', 'Puerto Iguazú'];
  }

  try {
    // BEAPI has a cities endpoint
    const data = await beapiFetch<{
      results: Array<{ city: string; country: string; state?: string }>;
    }>('/listings/cities?limit=100');

    const cities = data.results.map(item => item.city).filter(Boolean);

    // Cache the result
    cachedCities = {
      data: cities,
      expiresAt: Date.now() + CITIES_CACHE_DURATION,
    };

    return cities;
  } catch (error) {
    console.error('Error fetching cities:', error);

    // Return stale cache if available
    if (cachedCities && cachedCities.data.length > 0) {
      console.warn('BEAPI cities error, returning stale cache');
      return cachedCities.data;
    }

    // Fallback to extracting from listings (which will also use stale cache if rate-limited)
    try {
      const listings = await getListings({ useCache: true });
      const citiesSet = new Set<string>();
      listings.forEach(listing => {
        if (listing.address?.city) {
          citiesSet.add(listing.address.city);
        }
      });
      const cities = Array.from(citiesSet).sort();

      // Cache extracted cities
      cachedCities = {
        data: cities,
        expiresAt: Date.now() + CITIES_CACHE_DURATION,
      };

      return cities;
    } catch {
      return ['Bal Harbour', 'Kissimmee', 'Miami', 'Miami Beach', 'Puerto Iguazú'];
    }
  }
}

// Beach-related amenities
const BEACH_AMENITIES = [
  'beach', 'beachfront', 'beach access', 'beach view',
  'ocean view', 'oceanfront', 'sea view', 'waterfront',
  'beach chairs', 'beach towels',
];

export const AMENITY_CATEGORIES = {
  popular: ['wifi', 'pool', 'air conditioning', 'kitchen', 'washer', 'dryer', 'parking', 'hot tub'],
  outdoor: ['pool', 'hot tub', 'bbq', 'grill', 'patio', 'balcony', 'garden', 'outdoor furniture', 'beach access', 'beach chairs'],
  kitchen: ['kitchen', 'refrigerator', 'microwave', 'oven', 'stove', 'dishwasher', 'coffee maker', 'toaster', 'cooking basics'],
  entertainment: ['tv', 'cable tv', 'streaming', 'netflix', 'wifi', 'game room', 'books', 'board games', 'game console'],
  safety: ['smoke detector', 'carbon monoxide detector', 'fire extinguisher', 'first aid kit', 'security cameras'],
  accessibility: ['elevator', 'wheelchair accessible', 'step-free entry'],
  family: ['crib', 'high chair', 'kids toys', 'baby monitor', 'childproofing'],
};

function isBeachfrontProperty(listing: GuestyListing): boolean {
  const amenitiesLower = (listing.amenities || []).map(a => a.toLowerCase());
  const hasBeachAmenity = amenitiesLower.some(a =>
    BEACH_AMENITIES.some(beach => a.includes(beach))
  );

  const description = (listing.publicDescription?.summary || '').toLowerCase();
  const hasBeachInDescription = BEACH_AMENITIES.some(beach => description.includes(beach));

  return hasBeachAmenity || hasBeachInDescription;
}

function estimateBeachDistance(listing: GuestyListing): number {
  if (isBeachfrontProperty(listing)) return 0;

  const amenitiesLower = (listing.amenities || []).map(a => a.toLowerCase());
  if (amenitiesLower.some(a => a.includes('beach view') || a.includes('ocean view') || a.includes('sea view'))) {
    return 200;
  }

  const city = (listing.address?.city || '').toLowerCase();
  if (city.includes('miami beach') || city.includes('sunny isles') || city.includes('bal harbour')) {
    return 500;
  }

  return 2000;
}

// Miami Art Deco Historic District boundaries (approximate)
// Ocean Drive: 5th St to 15th St (roughly 100-1500 block)
// Collins Ave: 5th St to 23rd St
// Washington Ave: 5th St to 23rd St
const ART_DECO_STREETS = ['ocean dr', 'ocean drive', 'collins ave', 'collins avenue', 'washington ave', 'washington avenue'];
const ART_DECO_CROSS_STREETS_MIN = 5;
const ART_DECO_CROSS_STREETS_MAX = 23;

// Famous/iconic streets in Miami Beach
const ICONIC_STREETS: Record<string, string> = {
  'ocean dr': 'Ocean Drive',
  'ocean drive': 'Ocean Drive',
  'collins ave': 'Collins Avenue',
  'collins avenue': 'Collins Avenue',
  'lincoln rd': 'Lincoln Road',
  'lincoln road': 'Lincoln Road',
  'espanola way': 'Española Way',
  'española way': 'Española Way',
  'indian creek': 'Indian Creek',
  'collins canal': 'Collins Canal',
  'bay rd': 'Bay Road',
  'bay road': 'Bay Road',
  'alton rd': 'Alton Road',
  'alton road': 'Alton Road',
};

// Neighborhood mapping based on location
const NEIGHBORHOODS: Record<string, { minStreet?: number; maxStreet?: number; cities: string[] }> = {
  'South Beach': { minStreet: 1, maxStreet: 23, cities: ['miami beach'] },
  'Mid-Beach': { minStreet: 24, maxStreet: 63, cities: ['miami beach'] },
  'North Beach': { minStreet: 64, maxStreet: 87, cities: ['miami beach'] },
  'Surfside': { cities: ['surfside'] },
  'Bal Harbour': { cities: ['bal harbour', 'bal harbor'] },
  'Sunny Isles': { cities: ['sunny isles', 'sunny isles beach'] },
  'Downtown Miami': { cities: ['miami'] },
};

/**
 * Parse street number from address
 */
function parseStreetNumber(address: string): number | null {
  const match = address.match(/^(\d+)\s/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Generate a location-based display name from address
 * Uses street intersection / approximate location instead of property title
 * Examples:
 *   "1200 Collins Ave, Miami Beach" -> "Collins Ave & 12th St"
 *   "760 Ocean Drive, Miami Beach" -> "Ocean Dr & 8th St"
 *   "123 Main Street, Kissimmee" -> "Main St, Kissimmee"
 */
function generateLocationTitle(address: string, city: string): string {
  if (!address) return city || 'Property';

  // Parse address parts
  const parts = address.split(',').map(p => p.trim());
  const streetPart = parts[0] || '';

  // Extract street number and name
  const streetMatch = streetPart.match(/^(\d+)\s+(.+)$/);
  let streetNumber = 0;
  let streetName = streetPart;

  if (streetMatch) {
    streetNumber = parseInt(streetMatch[1], 10);
    streetName = streetMatch[2];
  }

  // Abbreviate common street types
  const abbreviateStreet = (name: string): string => {
    return name
      .replace(/\bStreet\b/gi, 'St')
      .replace(/\bAvenue\b/gi, 'Ave')
      .replace(/\bDrive\b/gi, 'Dr')
      .replace(/\bBoulevard\b/gi, 'Blvd')
      .replace(/\bRoad\b/gi, 'Rd')
      .replace(/\bLane\b/gi, 'Ln')
      .replace(/\bCourt\b/gi, 'Ct')
      .replace(/\bPlace\b/gi, 'Pl')
      .replace(/\bTerrace\b/gi, 'Ter')
      .replace(/\bCircle\b/gi, 'Cir');
  };

  streetName = abbreviateStreet(streetName);

  // For Miami Beach addresses, calculate approximate cross street
  const cityLower = city.toLowerCase();
  if (cityLower.includes('miami beach') || cityLower.includes('bal harbour') || cityLower.includes('sunny isles')) {
    // Miami Beach uses a grid system - address numbers roughly = street * 100
    // e.g., 1200 Collins Ave is near 12th Street
    if (streetNumber > 0) {
      const crossStreet = Math.round(streetNumber / 100);
      if (crossStreet > 0 && crossStreet <= 200) {
        // Format cross street with ordinal suffix
        const getOrdinal = (n: number): string => {
          const s = ['th', 'st', 'nd', 'rd'];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };

        return `${streetName} & ${getOrdinal(crossStreet)} St`;
      }
    }
  }

  // For other cities, just use street name and city
  if (streetName.length > 25) {
    streetName = streetName.substring(0, 22) + '...';
  }

  return `${streetName}, ${city}`;
}

/**
 * Determine if address is in the Art Deco Historic District
 */
function isInArtDecoDistrict(address: string, city: string): boolean {
  const addressLower = address.toLowerCase();
  const cityLower = city.toLowerCase();

  // Must be in Miami Beach
  if (!cityLower.includes('miami beach')) return false;

  // Check if on one of the Art Deco district streets
  const isOnArtDecoStreet = ART_DECO_STREETS.some(street => addressLower.includes(street));
  if (!isOnArtDecoStreet) return false;

  // Check street number range (5th to 23rd street area)
  const streetNum = parseStreetNumber(address);
  if (streetNum === null) return true; // Assume yes if we can't parse

  // Ocean Drive Art Deco is roughly 100-1500 block (5th to 15th St)
  if (addressLower.includes('ocean dr') || addressLower.includes('ocean drive')) {
    return streetNum >= 100 && streetNum <= 1500;
  }

  // Collins and Washington: roughly up to 2300 block
  return streetNum >= 100 && streetNum <= 2300;
}

/**
 * Get the iconic street name if on one
 */
function getIconicStreet(address: string): string | null {
  const addressLower = address.toLowerCase();
  for (const [pattern, name] of Object.entries(ICONIC_STREETS)) {
    if (addressLower.includes(pattern)) {
      return name;
    }
  }
  return null;
}

/**
 * Determine neighborhood based on address and city
 */
function determineNeighborhood(address: string, city: string): string | undefined {
  const cityLower = city.toLowerCase();
  const streetNum = parseStreetNumber(address);

  for (const [neighborhood, config] of Object.entries(NEIGHBORHOODS)) {
    // Check if city matches
    if (config.cities.some(c => cityLower.includes(c))) {
      // If no street range specified, it's a city-level match
      if (config.minStreet === undefined || config.maxStreet === undefined) {
        return neighborhood;
      }

      // For Miami Beach, determine by street number
      if (cityLower.includes('miami beach') && streetNum !== null) {
        // Convert address number to approximate street
        // Ocean Drive: ~100 per block, Collins: similar
        const approxStreet = Math.floor(streetNum / 100);
        if (approxStreet >= config.minStreet && approxStreet <= config.maxStreet) {
          return neighborhood;
        }
      }
    }
  }

  return undefined;
}

/**
 * Determine location-based perks for a property
 */
function getLocationPerks(listing: GuestyListing): string[] {
  const perks: string[] = [];
  const address = listing.address?.full || '';
  const city = listing.address?.city || '';

  // Check for Art Deco District
  if (isInArtDecoDistrict(address, city)) {
    perks.push('Art Deco District');
  }

  // Check for iconic street
  const iconicStreet = getIconicStreet(address);
  if (iconicStreet) {
    perks.push(iconicStreet);
  }

  // Check for waterfront/bay views from amenities or description
  const amenitiesLower = (listing.amenities || []).map(a => a.toLowerCase());
  const description = (listing.publicDescription?.summary || '').toLowerCase();

  if (amenitiesLower.some(a => a.includes('bay view')) || description.includes('bay view')) {
    perks.push('Bay View');
  }

  if (amenitiesLower.some(a => a.includes('city view') || a.includes('skyline')) || description.includes('skyline')) {
    perks.push('City Skyline');
  }

  if (amenitiesLower.some(a => a.includes('pool')) || description.includes('rooftop pool')) {
    if (description.includes('rooftop')) {
      perks.push('Rooftop Pool');
    }
  }

  // Historic building indicator
  if (description.includes('historic') || description.includes('1920s') || description.includes('1930s') || description.includes('1940s')) {
    perks.push('Historic Building');
  }

  // Walk to beach
  if (description.includes('steps from the beach') || description.includes('walk to beach') || description.includes('steps to beach')) {
    perks.push('Steps to Beach');
  }

  return perks;
}

/**
 * Determine property type based on location and listing data
 * Properties on Ocean Drive in Miami Beach are typically Boutique Hotels, not apartments
 */
function determinePropertyType(listing: GuestyListing): 'boutique-hotel' | 'luxury-villa' | 'beach-house' | 'mountain-retreat' | 'city-apartment' | 'historic-estate' {
  const address = (listing.address?.full || '').toLowerCase();
  const city = (listing.address?.city || '').toLowerCase();
  const guestyType = (listing.propertyType || '').toLowerCase();
  const title = (listing.title || '').toLowerCase();

  // Ocean Drive properties in Miami Beach are typically boutique hotels
  if (city.includes('miami beach') && (address.includes('ocean dr') || address.includes('ocean drive'))) {
    return 'boutique-hotel';
  }

  // Collins Avenue in Art Deco district - likely boutique hotels
  if (city.includes('miami beach') && isInArtDecoDistrict(listing.address?.full || '', listing.address?.city || '')) {
    // Check if it's a hotel-style property
    if (listing.type === 'MTL' || (listing.listingRooms && listing.listingRooms.length > 0)) {
      return 'boutique-hotel';
    }
  }

  // Check title for hotel indicators
  if (title.includes('hotel') || title.includes('suite') || title.includes('boutique')) {
    return 'boutique-hotel';
  }

  // Bal Harbour/Sunny Isles high-rises are typically luxury apartments
  if (city.includes('bal harbour') || city.includes('sunny isles')) {
    if (guestyType === 'apartment' || address.includes('collins ave') || address.includes('collins avenue')) {
      return 'luxury-villa'; // Treat as luxury
    }
  }

  // Fall back to the standard mapping
  const typeMap: Record<string, 'boutique-hotel' | 'luxury-villa' | 'beach-house' | 'mountain-retreat' | 'city-apartment' | 'historic-estate'> = {
    apartment: 'city-apartment',
    house: 'luxury-villa',
    villa: 'luxury-villa',
    hotel: 'boutique-hotel',
    'boutique hotel': 'boutique-hotel',
    cottage: 'mountain-retreat',
    cabin: 'mountain-retreat',
    castle: 'historic-estate',
    estate: 'historic-estate',
    beach: 'beach-house',
    beachfront: 'beach-house',
  };

  return typeMap[guestyType] || 'boutique-hotel';
}

export function normalizeAmenity(amenity: string): string {
  return amenity
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function convertGuestyToProperty(listing: GuestyListing) {
  const isBeachfront = isBeachfrontProperty(listing);
  const distanceToBeach = estimateBeachDistance(listing);
  const roomsAvailable = listing.listingRooms?.length || (listing.type === 'MTL' ? 1 : undefined);
  const childListings = listing.listingRooms?.map(room => room._id);

  // Check if property is pet-friendly from amenities
  const amenitiesLower = (listing.amenities || []).map(a => a.toLowerCase());
  const petFriendly = amenitiesLower.some(a =>
    a.includes('pet') || a.includes('dog') || a.includes('cat') || a === 'pets allowed'
  );

  // Get price - prefer dynamic price from date search, fallback to base price
  // When searching with checkIn/checkOut, Guesty returns calculated pricing in listing.price
  // or listing.accommodationFare / listing.nightsCount
  let pricePerNight = listing.prices?.basePrice || 0;

  // If dynamic pricing is available from date search, calculate per-night rate
  if (listing.price?.value && listing.nightsCount && listing.nightsCount > 0) {
    pricePerNight = Math.round(listing.price.value / listing.nightsCount);
  } else if (listing.accommodationFare && listing.nightsCount && listing.nightsCount > 0) {
    pricePerNight = Math.round(listing.accommodationFare / listing.nightsCount);
  }

  // Determine location-based data
  const address = listing.address?.full || '';
  const city = listing.address?.city || '';
  const neighborhood = determineNeighborhood(address, city);
  const locationPerks = getLocationPerks(listing);

  // Use location-based title (street intersection) instead of property name
  const locationTitle = generateLocationTitle(address, city);

  return {
    id: listing._id,
    name: locationTitle,
    slug: listing._id,
    description: listing.publicDescription?.summary || '',
    shortDescription: listing.publicDescription?.space || listing.publicDescription?.summary?.slice(0, 150) || '',
    type: determinePropertyType(listing),
    images: (listing.pictures?.map((p) => p.original || p.large).filter((img): img is string => !!img)) || [],
    price: {
      perNight: pricePerNight,
      cleaningFee: listing.prices?.cleaningFee, // Cache real cleaning fee from Guesty
      currency: listing.price?.currency || listing.prices?.currency || 'USD',
    },
    location: {
      address,
      city,
      country: listing.address?.country || '',
      neighborhood,
      coordinates: {
        lat: listing.address?.lat || 0,
        lng: listing.address?.lng || 0,
      },
    },
    amenities: listing.amenities || [],
    rating: listing.reviews?.avg || 4.5,
    reviewCount: listing.reviews?.count || 0,
    maxGuests: listing.accommodates || 2,
    bedrooms: listing.bedrooms || 1,
    bathrooms: listing.bathrooms || 1,
    isFeatured: false,
    isBeachfront,
    petFriendly,
    distanceToBeach,
    roomsAvailable,
    childListings,
    locationPerks,
    reviews: undefined, // Will be populated from fallback data if available
    policies: {
      checkIn: listing.terms?.checkIn?.from || '3:00 PM',
      checkOut: listing.terms?.checkOut?.from || '11:00 AM',
      cancellation: listing.terms?.cancellationPolicy || 'Flexible',
    },
  };
}

function mapPropertyType(guestyType: string): 'boutique-hotel' | 'luxury-villa' | 'beach-house' | 'mountain-retreat' | 'city-apartment' | 'historic-estate' {
  const typeMap: Record<string, 'boutique-hotel' | 'luxury-villa' | 'beach-house' | 'mountain-retreat' | 'city-apartment' | 'historic-estate'> = {
    apartment: 'city-apartment',
    house: 'luxury-villa',
    villa: 'luxury-villa',
    hotel: 'boutique-hotel',
    'boutique hotel': 'boutique-hotel',
    cottage: 'mountain-retreat',
    cabin: 'mountain-retreat',
    castle: 'historic-estate',
    estate: 'historic-estate',
    beach: 'beach-house',
    beachfront: 'beach-house',
  };

  return typeMap[guestyType?.toLowerCase()] || 'boutique-hotel';
}

// ============================================================================
// OPEN API RESERVATION MANAGEMENT FUNCTIONS
// Used by AI chatbot for guest reservation lookup, modification, and cancellation
// ============================================================================

/**
 * Make a request to Guesty Open API with support for different methods
 */
async function openApiFetchWithMethod<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const token = await getOpenApiAccessToken();
  const { method = 'GET', body } = options;

  const response = await fetch(`${GUESTY_OPEN_API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Open API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Search for a reservation by confirmation code
 * Returns the reservation if found and email matches
 */
export async function lookupReservation(
  confirmationCode: string,
  email: string
): Promise<GuestyReservation | null> {
  if (!hasOpenApi()) {
    console.warn('Open API not configured for reservation lookup');
    return null;
  }

  try {
    // Search by confirmation code using filters
    const filters = JSON.stringify([
      { operator: '$eq', field: 'confirmationCode', value: confirmationCode }
    ]);

    const fields = '_id confirmationCode status checkInDateLocalized checkOutDateLocalized guestsCount guest listing money nightsCount source';

    const data = await openApiFetchWithMethod<{
      results: GuestyReservation[];
      count: number;
    }>(`/reservations?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(fields)}&limit=1`);

    if (!data.results || data.results.length === 0) {
      console.log(`No reservation found with confirmation code: ${confirmationCode}`);
      return null;
    }

    const reservation = data.results[0];

    // Verify email matches for security
    const guestEmail = reservation.guest?.email?.toLowerCase();
    if (guestEmail !== email.toLowerCase()) {
      console.log(`Email mismatch for reservation ${confirmationCode}`);
      return null;
    }

    console.log(`✅ Found reservation ${confirmationCode} for ${email}`);
    return reservation;
  } catch (error) {
    console.error('Error looking up reservation:', error);
    return null;
  }
}

/**
 * Get reservations for a guest by email address
 */
export async function getReservationsByEmail(
  email: string
): Promise<GuestyReservation[]> {
  if (!hasOpenApi()) {
    console.warn('Open API not configured for reservation lookup');
    return [];
  }

  try {
    const filters = JSON.stringify([
      { operator: '$eq', field: 'guest.email', value: email.toLowerCase() }
    ]);

    const fields = '_id confirmationCode status checkInDateLocalized checkOutDateLocalized guestsCount guest listing money nightsCount source';

    const data = await openApiFetchWithMethod<{
      results: GuestyReservation[];
      count: number;
    }>(`/reservations?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(fields)}&limit=50&sort=-checkInDateLocalized`);

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results;
  } catch (error) {
    console.error('Error fetching reservations by email:', error);
    return [];
  }
}

/**
 * Get full reservation details by ID
 */
export async function getReservationById(
  reservationId: string
): Promise<GuestyReservation | null> {
  if (!hasOpenApi()) {
    console.warn('Open API not configured');
    return null;
  }

  try {
    const data = await openApiFetchWithMethod<GuestyReservation>(
      `/reservations/${reservationId}`
    );
    return data;
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return null;
  }
}

/**
 * Cancel a reservation
 * Sets the status to 'canceled'
 */
export async function cancelReservation(
  reservationId: string
): Promise<{ success: boolean; message: string }> {
  if (!hasOpenApi()) {
    return { success: false, message: 'Open API not configured' };
  }

  try {
    await openApiFetchWithMethod<{ status: string; _id: string }>(
      `/reservations/${reservationId}`,
      {
        method: 'PUT',
        body: { status: 'canceled' }
      }
    );

    console.log(`✅ Reservation ${reservationId} canceled`);
    return {
      success: true,
      message: 'Your reservation has been successfully canceled. You will receive a confirmation email shortly.'
    };
  } catch (error) {
    console.error('Error canceling reservation:', error);
    return {
      success: false,
      message: 'Unable to cancel reservation. Please contact support at 786-694-7577.'
    };
  }
}

/**
 * Modify reservation dates
 * Uses checkInDateLocalized and checkOutDateLocalized to avoid timezone issues
 */
export async function modifyReservationDates(
  reservationId: string,
  newCheckIn: string,
  newCheckOut: string
): Promise<{ success: boolean; reservation?: GuestyReservation; message: string }> {
  if (!hasOpenApi()) {
    return { success: false, message: 'Open API not configured' };
  }

  try {
    const data = await openApiFetchWithMethod<GuestyReservation>(
      `/reservations/${reservationId}`,
      {
        method: 'PUT',
        body: {
          checkInDateLocalized: newCheckIn,
          checkOutDateLocalized: newCheckOut
        }
      }
    );

    console.log(`✅ Reservation ${reservationId} dates modified to ${newCheckIn} - ${newCheckOut}`);
    return {
      success: true,
      reservation: data,
      message: `Your reservation has been updated. New dates: ${newCheckIn} to ${newCheckOut}. You will receive a confirmation email.`
    };
  } catch (error) {
    console.error('Error modifying reservation dates:', error);
    return {
      success: false,
      message: 'Unable to modify reservation dates. The new dates may not be available. Please contact support at 786-694-7577.'
    };
  }
}

/**
 * Get property details by listing ID (for chatbot context)
 */
export async function getListingDetails(
  listingId: string
): Promise<{ name: string; address: string; checkIn: string; checkOut: string } | null> {
  try {
    const listing = await getListing(listingId);
    if (!listing) return null;

    const property = convertGuestyToProperty(listing);
    return {
      name: property.name,
      address: property.location.address,
      checkIn: property.policies.checkIn,
      checkOut: property.policies.checkOut
    };
  } catch (error) {
    console.error('Error getting listing details:', error);
    return null;
  }
}

export type { GuestyListing, GuestyReservation, GuestyGuest, CreateReservationResponse, CalendarDay, ReservationQuote };
