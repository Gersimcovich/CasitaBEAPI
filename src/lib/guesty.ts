// Guesty Open API Integration
// Documentation: https://docs.guesty.com/
// Using aggressive caching to handle rate limits

const GUESTY_CLIENT_ID = process.env.GUESTY_CLIENT_ID || '';
const GUESTY_CLIENT_SECRET = process.env.GUESTY_CLIENT_SECRET || '';
const GUESTY_API_URL = 'https://open-api.guesty.com/v1';
const GUESTY_AUTH_URL = 'https://open-api.guesty.com/oauth2/token';

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
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  address: {
    full: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  prices: {
    basePrice: number;
    currency: string;
    cleaningFee?: number;
  };
  pictures: Array<{
    original: string;
    thumbnail: string;
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
}

interface GuestyGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

// Listings cache - longer duration to reduce API calls
let cachedListings: { data: GuestyListing[]; expiresAt: number } | null = null;
const LISTINGS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Individual listing cache
const listingCache = new Map<string, { data: GuestyListing; expiresAt: number }>();
const LISTING_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Calendar cache
const calendarCache = new Map<string, { data: CalendarDay[]; expiresAt: number }>();
const CALENDAR_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request queue to prevent concurrent requests
let requestQueue: Promise<unknown> = Promise.resolve();
const REQUEST_DELAY = 500; // 500ms between requests

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Queue a request to prevent rate limiting
 */
async function queueRequest<T>(fn: () => Promise<T>): Promise<T> {
  const execute = async (): Promise<T> => {
    await sleep(REQUEST_DELAY);
    return fn();
  };

  requestQueue = requestQueue.then(execute, execute);
  return requestQueue as Promise<T>;
}

/**
 * Get OAuth2 access token from Guesty
 */
async function getAccessToken(retryCount = 0): Promise<string> {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 5000;

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!GUESTY_CLIENT_ID || !GUESTY_CLIENT_SECRET) {
    throw new Error('GUESTY_CLIENT_ID and GUESTY_CLIENT_SECRET must be configured in .env.local');
  }

  try {
    const response = await fetch(GUESTY_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: GUESTY_CLIENT_ID,
        client_secret: GUESTY_CLIENT_SECRET,
        scope: 'open-api',
      }),
    });

    if (!response.ok) {
      const error = await response.text();

      if (error.includes('TOO_MANY_REQUESTS') && retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        console.warn(`Rate limited on auth, retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return getAccessToken(retryCount + 1);
      }

      throw new Error(`Failed to get Guesty access token: ${error}`);
    }

    const data: GuestyToken = await response.json();

    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };

    return data.access_token;
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof Error && !error.message.includes('Failed to get Guesty')) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.warn(`Network error on auth, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return getAccessToken(retryCount + 1);
    }
    throw error;
  }
}

/**
 * Make an authenticated request to Guesty API with rate limit handling
 */
async function guestyFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 5000;

  const token = await getAccessToken();

  try {
    const response = await fetch(`${GUESTY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.text();

      // Handle rate limiting
      if ((response.status === 429 || error.includes('TOO_MANY_REQUESTS')) && retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        console.warn(`Rate limited, retrying in ${delay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return guestyFetch<T>(endpoint, options, retryCount + 1);
      }

      throw new Error(`Guesty API error: ${response.status} - ${error}`);
    }

    return response.json();
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof Error && !error.message.includes('Guesty API error')) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.warn(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return guestyFetch<T>(endpoint, options, retryCount + 1);
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
 * Get all listings with aggressive caching
 */
export async function getListings(params?: {
  limit?: number;
  skip?: number;
  active?: boolean;
  useCache?: boolean;
  parentsOnly?: boolean;
}): Promise<GuestyListing[]> {
  const useCache = params?.useCache !== false;
  const parentsOnly = params?.parentsOnly !== false;

  // Check cache first
  if (useCache && cachedListings && cachedListings.expiresAt > Date.now() && !params?.skip) {
    let results = cachedListings.data;
    if (params?.active !== undefined) {
      results = results.filter(l => l.active === params.active);
    }
    if (parentsOnly) {
      results = filterParentListings(results);
    }
    if (params?.limit) {
      results = results.slice(0, params.limit);
    }
    return results;
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', '100');
    if (params?.skip) searchParams.set('skip', params.skip.toString());
    if (params?.active !== undefined) searchParams.set('active', params.active.toString());

    const queryString = searchParams.toString();
    const endpoint = `/listings${queryString ? `?${queryString}` : ''}`;

    const data = await queueRequest(() =>
      guestyFetch<{ results: GuestyListing[] }>(endpoint)
    );

    // Cache results
    if (!params?.skip) {
      cachedListings = {
        data: data.results,
        expiresAt: Date.now() + LISTINGS_CACHE_DURATION,
      };
    }

    let results = data.results;

    if (parentsOnly) {
      results = filterParentListings(results);
    }

    if (params?.limit && params.limit < results.length) {
      results = results.slice(0, params.limit);
    }

    return results;
  } catch (error) {
    // Return cached data even if expired
    if (cachedListings && cachedListings.data.length > 0) {
      console.warn('Guesty API error, returning cached data:', error);
      let results = cachedListings.data;
      if (params?.active !== undefined) {
        results = results.filter(l => l.active === params.active);
      }
      if (parentsOnly) {
        results = filterParentListings(results);
      }
      if (params?.limit) {
        results = results.slice(0, params.limit);
      }
      return results;
    }
    throw error;
  }
}

/**
 * Get a single listing by ID with caching
 */
export async function getListing(listingId: string): Promise<GuestyListing> {
  // Check cache
  const cached = listingCache.get(listingId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // Check if it's in the listings cache
  if (cachedListings && cachedListings.expiresAt > Date.now()) {
    const found = cachedListings.data.find(l => l._id === listingId);
    if (found) {
      listingCache.set(listingId, {
        data: found,
        expiresAt: Date.now() + LISTING_CACHE_DURATION,
      });
      return found;
    }
  }

  const listing = await queueRequest(() =>
    guestyFetch<GuestyListing>(`/listings/${listingId}`)
  );

  listingCache.set(listingId, {
    data: listing,
    expiresAt: Date.now() + LISTING_CACHE_DURATION,
  });

  return listing;
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
  // Use cached listings and filter locally to reduce API calls
  const listings = await getListings({ parentsOnly: params.parentsOnly });

  return listings.filter(listing => {
    if (params.city && listing.address?.city?.toLowerCase() !== params.city.toLowerCase()) {
      return false;
    }
    if (params.country && listing.address?.country?.toLowerCase() !== params.country.toLowerCase()) {
      return false;
    }
    if (params.guests && listing.accommodates < params.guests) {
      return false;
    }
    if (params.minPrice && listing.prices?.basePrice < params.minPrice) {
      return false;
    }
    if (params.maxPrice && listing.prices?.basePrice > params.maxPrice) {
      return false;
    }
    return true;
  });
}

/**
 * Get calendar availability for a listing with caching
 */
export async function getCalendar(
  listingId: string,
  from: string,
  to: string
): Promise<CalendarDay[]> {
  const cacheKey = `${listingId}-${from}-${to}`;

  // Check cache
  const cached = calendarCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await queueRequest(() =>
    guestyFetch<{
      results: Array<{
        date: string;
        status: string;
        price: number;
        minNights?: number;
        currency: string;
      }>;
    }>(`/availability-pricing/api/calendar/listings/${listingId}?startDate=${from}&endDate=${to}`)
  );

  const calendar = data.results.map(day => ({
    date: day.date,
    status: day.status as 'available' | 'booked' | 'blocked',
    price: day.price,
    minNights: day.minNights,
    currency: day.currency,
  }));

  // Cache the result
  calendarCache.set(cacheKey, {
    data: calendar,
    expiresAt: Date.now() + CALENDAR_CACHE_DURATION,
  });

  return calendar;
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
 * Get a price quote for a reservation
 */
export async function getQuote(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
}): Promise<{
  available: boolean;
  quote: {
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

    const serviceFee = 0;
    const total = availability.totalAccommodation +
                  availability.cleaningFee +
                  serviceFee +
                  availability.taxes;

    return {
      available: true,
      quote: {
        nightsCount: availability.nightsCount,
        pricePerNight: availability.pricePerNight,
        accommodation: availability.totalAccommodation,
        cleaningFee: availability.cleaningFee,
        serviceFee,
        taxes: availability.taxes,
        total,
        currency: availability.currency,
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
    throw error;
  }
}

/**
 * Create a reservation
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
  const status = params.status || 'inquiry';

  const requestBody = {
    listingId: params.listingId,
    checkInDateLocalized: params.checkIn,
    checkOutDateLocalized: params.checkOut,
    guest: {
      firstName: params.guest.firstName,
      lastName: params.guest.lastName,
      email: params.guest.email,
      phone: params.guest.phone,
    },
    guestsCount: params.guestsCount,
    status,
    source: 'Direct - Casita Website',
    notes: params.notes,
  };

  return queueRequest(() =>
    guestyFetch<CreateReservationResponse>('/reservations', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })
  );
}

/**
 * Create an instant booking (confirmed reservation)
 */
export async function createInstantBooking(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guest: GuestyGuest;
  guestsCount: number;
  notes?: string;
}): Promise<CreateReservationResponse> {
  return createReservation({
    ...params,
    status: 'confirmed',
  });
}

/**
 * Create a booking inquiry (request to book)
 */
export async function createInquiry(params: {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guest: GuestyGuest;
  guestsCount: number;
  notes?: string;
}): Promise<CreateReservationResponse> {
  return createReservation({
    ...params,
    status: 'inquiry',
  });
}

/**
 * Get reservations for a listing
 */
export async function getReservations(
  listingId: string,
  params?: {
    status?: 'inquiry' | 'reserved' | 'confirmed' | 'canceled';
    fromDate?: string;
    toDate?: string;
  }
): Promise<GuestyReservation[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('listingId', listingId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.fromDate) searchParams.set('checkIn[gte]', params.fromDate);
  if (params?.toDate) searchParams.set('checkIn[lte]', params.toDate);

  const endpoint = `/reservations?${searchParams.toString()}`;
  const data = await queueRequest(() =>
    guestyFetch<{ results: GuestyReservation[] }>(endpoint)
  );
  return data.results;
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
  entertainment: ['tv', 'cable tv', 'streaming', 'netflix', 'wifi', 'game room', 'books', 'board games'],
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

  return {
    id: listing._id,
    name: listing.title || listing.nickname || '',
    slug: listing._id,
    description: listing.publicDescription?.summary || '',
    shortDescription: listing.publicDescription?.space || listing.publicDescription?.summary?.slice(0, 150) || '',
    type: mapPropertyType(listing.propertyType),
    images: listing.pictures?.map((p) => p.original) || [],
    price: {
      perNight: listing.prices?.basePrice || 0,
      currency: listing.prices?.currency || 'USD',
    },
    location: {
      address: listing.address?.full || '',
      city: listing.address?.city || '',
      country: listing.address?.country || '',
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
    distanceToBeach,
    roomsAvailable,
    childListings,
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

/**
 * Get unique cities from listings (uses cached listings)
 */
export async function getCities(): Promise<string[]> {
  try {
    const listings = await getListings({ active: true });
    const citiesSet = new Set<string>();
    listings.forEach((listing) => {
      if (listing.address?.city) {
        citiesSet.add(listing.address.city);
      }
    });
    return Array.from(citiesSet).sort();
  } catch (error) {
    console.error('Error fetching cities:', error);
    return ['Miami Beach', 'Bal Harbour', 'Sunny Isles', 'Miami', 'Fort Lauderdale'];
  }
}

export type { GuestyListing, GuestyReservation, GuestyGuest, CreateReservationResponse, CalendarDay };
