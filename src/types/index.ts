// Property Types
export interface Property {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  type: PropertyType;
  images: string[];
  price: {
    perNight: number;
    cleaningFee?: number; // Cached from Guesty API
    currency: string;
  };
  location: {
    address: string;
    city: string;
    country: string;
    neighborhood?: string; // e.g., "South Beach", "Art Deco District"
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isBeachfront?: boolean;
  distanceToBeach?: number; // in meters
  roomsAvailable?: number; // Number of rooms/units available at this property
  childListings?: string[]; // IDs of child listings (rooms) for multi-unit properties
  parentId?: string | null; // Parent listing ID if this is a child room
  locationPerks?: string[]; // Location-based perks like "Ocean Drive", "Art Deco District", "Waterfront"
  reviews?: PropertyReview[]; // Positive reviews to display on property page (up to 10)
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
}

// Simplified review for display on property pages
export interface PropertyReview {
  id: string;
  reviewerName: string;
  date: string; // ISO date string
  rating: number;
  content: string;
  source?: string; // e.g., "Airbnb", "VRBO", "Direct"
}

export type PropertyType =
  | 'boutique-hotel'
  | 'luxury-villa'
  | 'beach-house'
  | 'mountain-retreat'
  | 'city-apartment'
  | 'historic-estate';

export type Amenity =
  | 'wifi'
  | 'pool'
  | 'spa'
  | 'gym'
  | 'restaurant'
  | 'bar'
  | 'room-service'
  | 'parking'
  | 'airport-transfer'
  | 'concierge'
  | 'air-conditioning'
  | 'kitchen'
  | 'washer'
  | 'dryer'
  | 'balcony'
  | 'ocean-view'
  | 'mountain-view'
  | 'garden'
  | 'fireplace'
  | 'hot-tub'
  | 'pet-friendly'
  | 'wheelchair-accessible';

// Search Types
export interface SearchParams {
  destination: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  rooms: number;
}

export interface SearchFilters {
  priceRange: [number, number];
  propertyTypes: PropertyType[];
  amenities: Amenity[];
  rating: number;
  sortBy: SortOption;
}

export type SortOption =
  | 'recommended'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'newest'
  | 'beach-proximity';

// Booking Types
export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
  specialRequests?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  preferences: UserPreferences;
  wishlist: string[]; // Property IDs
  bookings: string[]; // Booking IDs
  createdAt: Date;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    deals: boolean;
  };
}

// Review Types
export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  date: Date;
  helpful: number;
  categories: {
    cleanliness: number;
    location: number;
    service: number;
    value: number;
  };
}

// Destination Types
export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  propertyCount: number;
  description: string;
  slug: string;
}
