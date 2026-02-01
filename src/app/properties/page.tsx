'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyPreviewModal from '@/components/property/PropertyPreviewModal';
import Button from '@/components/ui/Button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Grid,
  Map,
  Star,
  Loader2,
  MapPin,
  X,
  Calendar,
  Users,
  Minus,
  Plus,
  Bed,
  Bath,
  Dog,
  Waves,
  Home,
  Building,
  Wifi,
  Car,
  Snowflake,
  Tv,
  UtensilsCrossed,
  Dumbbell,
} from 'lucide-react';
import { Property, SortOption } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';
import { useCapacitor } from '@/hooks/useCapacitor';
import dynamic from 'next/dynamic';

// Dynamically import map component (client-side only, no SSR)
const PropertyMap = dynamic(() => import('@/components/map/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-[var(--casita-gray-200)] rounded-2xl h-[600px] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin" />
    </div>
  ),
});

function PropertiesContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { isCapacitor, isIOS } = useCapacitor();

  // Parse URL search parameters
  const urlDestination = searchParams.get('destination') || '';
  const urlCheckIn = searchParams.get('checkIn') || '';
  const urlCheckOut = searchParams.get('checkOut') || '';
  const urlGuests = searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : null;
  const urlMinPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null;
  const urlMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null;
  const urlPetFriendly = searchParams.get('petFriendly') === 'true';

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recommended', label: t.properties.recommended },
    { value: 'price-low', label: t.properties.priceLow },
    { value: 'price-high', label: t.properties.priceHigh },
    { value: 'rating', label: t.properties.highestRated },
    { value: 'beach-proximity', label: t.properties.beachProximity },
  ];
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'recommended');
  const [priceRange, setPriceRange] = useState<[number, number]>([urlMinPrice || 0, urlMaxPrice || 2000]);
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState(urlDestination);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(urlDestination || null);
  const [guestFilter, setGuestFilter] = useState<number | null>(urlGuests);
  const [checkInDate, setCheckInDate] = useState<Date | null>(urlCheckIn ? new Date(urlCheckIn) : null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(urlCheckOut ? new Date(urlCheckOut) : null);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [previewPropertyId, setPreviewPropertyId] = useState<string | null>(null);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [guests, setGuests] = useState(urlGuests || 2);
  const [rooms, setRooms] = useState(1);
  const [petFriendlyFilter, setPetFriendlyFilter] = useState(urlPetFriendly);

  // Advanced filters
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [minBathrooms, setMinBathrooms] = useState(0);
  const [beachfrontOnly, setBeachfrontOnly] = useState(false);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Fetch all available cities on mount
  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        const data = await response.json();
        if (data.success && data.data) {
          setAllCities(data.data);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        // Fallback cities
        setAllCities(['Miami Beach', 'Bal Harbour', 'Sunny Isles', 'Miami']);
      }
    }
    fetchCities();
  }, []);

  // Fetch properties from API with search filters
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      setError(null);
      try {
        // Build query string with search parameters
        const params = new URLSearchParams();
        if (urlDestination) params.set('city', urlDestination);
        if (urlCheckIn) params.set('checkIn', urlCheckIn);
        if (urlCheckOut) params.set('checkOut', urlCheckOut);
        if (urlGuests) params.set('guests', urlGuests.toString());
        if (urlMinPrice) params.set('minPrice', urlMinPrice.toString());
        if (urlMaxPrice) params.set('maxPrice', urlMaxPrice.toString());

        const queryString = params.toString();
        const url = `/api/listings${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setProperties(data.data);
        } else {
          setError(data.error || 'Failed to load properties');
        }
      } catch (err) {
        setError('Failed to connect to server');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [urlDestination, urlCheckIn, urlCheckOut, urlGuests, urlMinPrice, urlMaxPrice]);

  // Filter and sort properties
  const filteredProperties = properties.filter((property) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        property.name.toLowerCase().includes(query) ||
        property.location.city.toLowerCase().includes(query) ||
        property.location.country.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Location filter
    if (selectedLocation && property.location.city !== selectedLocation) {
      return false;
    }

    // Guest capacity filter
    if (guestFilter && property.maxGuests < guestFilter) {
      return false;
    }

    // Pet friendly filter
    if (petFriendlyFilter && !property.petFriendly) {
      return false;
    }

    // Bedrooms filter
    if (minBedrooms > 0 && property.bedrooms < minBedrooms) {
      return false;
    }

    // Bathrooms filter
    if (minBathrooms > 0 && property.bathrooms < minBathrooms) {
      return false;
    }

    // Beachfront filter
    if (beachfrontOnly && (property.distanceToBeach === undefined || property.distanceToBeach > 100)) {
      return false;
    }

    // Property type filter
    if (propertyType && property.type !== propertyType) {
      return false;
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      const propertyAmenities = property.amenities?.map(a => a.toLowerCase()) || [];
      const hasAllAmenities = selectedAmenities.every(amenity =>
        propertyAmenities.some(pa => pa.includes(amenity.toLowerCase()))
      );
      if (!hasAllAmenities) return false;
    }

    if (property.price.perNight < priceRange[0] || property.price.perNight > priceRange[1]) {
      return false;
    }

    if (property.rating < minRating) {
      return false;
    }

    return true;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price.perNight - b.price.perNight;
      case 'price-high':
        return b.price.perNight - a.price.perNight;
      case 'rating':
        // Sort by rating, then by review count for ties
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      case 'beach-proximity':
        // Sort by distance to beach (closest first), beachfront properties first
        const distA = a.distanceToBeach ?? 9999;
        const distB = b.distanceToBeach ?? 9999;
        return distA - distB;
      case 'recommended':
      default:
        // Recommended: combine rating, reviews, and beach proximity
        const scoreA = (a.rating * Math.log(a.reviewCount + 1)) - (a.distanceToBeach || 2000) / 1000;
        const scoreB = (b.rating * Math.log(b.reviewCount + 1)) - (b.distanceToBeach || 2000) / 1000;
        return scoreB - scoreA;
    }
  });

  const clearFilters = () => {
    setPriceRange([0, 2000]);
    setMinRating(0);
    setSearchQuery('');
    setSelectedLocation(null);
    setMinBedrooms(0);
    setMinBathrooms(0);
    setPetFriendlyFilter(false);
    setBeachfrontOnly(false);
    setPropertyType(null);
    setSelectedAmenities([]);
  };

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedLocation ? 1 : 0) +
    (minBedrooms > 0 ? 1 : 0) +
    (minBathrooms > 0 ? 1 : 0) +
    (petFriendlyFilter ? 1 : 0) +
    (beachfrontOnly ? 1 : 0) +
    (propertyType ? 1 : 0) +
    selectedAmenities.length;

  // Amenity options
  const amenityOptions = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'ac', label: 'A/C', icon: Snowflake },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
  ];

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(a => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Handle search with all parameters
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedLocation) params.set('destination', selectedLocation);
    if (checkInDate) params.set('checkIn', checkInDate.toISOString().split('T')[0]);
    if (checkOutDate) params.set('checkOut', checkOutDate.toISOString().split('T')[0]);
    params.set('guests', guests.toString());
    params.set('rooms', rooms.toString());
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 2000) params.set('maxPrice', priceRange[1].toString());
    window.location.href = `/properties?${params.toString()}`;
  };

  // Clear location and update URL
  const clearLocation = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    // Update URL to remove destination param
    const params = new URLSearchParams(window.location.search);
    params.delete('destination');
    const newUrl = params.toString() ? `/properties?${params.toString()}` : '/properties';
    window.history.replaceState({}, '', newUrl);
  };

  // App-specific search header - clean filter chips UI with integrated header
  const AppSearchHeader = () => (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[var(--casita-gray-100)]"
      style={isIOS ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
    >
      {/* Top bar with back button and title */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--casita-gray-100)]">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full bg-[var(--casita-gray-100)] flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5 text-[var(--casita-gray-700)] rotate-90" />
        </button>
        <h1 className="text-base font-semibold text-[var(--casita-gray-900)]">{t.nav.properties}</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      <div className="px-4 py-3">
        {/* Horizontal scrollable filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Location filter */}
          {selectedLocation ? (
            <button
              onClick={clearLocation}
              className="flex shrink-0 items-center gap-1.5 px-3 py-2 bg-[var(--casita-orange)] text-white rounded-full text-sm font-medium whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              {selectedLocation}
              <X className="w-3.5 h-3.5 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => setShowFilters(true)}
              className="flex shrink-0 items-center gap-1.5 px-3 py-2 bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] rounded-full text-sm font-medium whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              Location
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {/* Dates filter */}
          <button
            onClick={() => setShowFilters(true)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              checkInDate && checkOutDate
                ? 'bg-[var(--casita-orange)] text-white'
                : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {checkInDate && checkOutDate
              ? `${checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : 'Dates'}
          </button>

          {/* Guests filter */}
          <button
            onClick={() => {
              setShowGuestPicker(!showGuestPicker);
              setShowSortDropdown(false);
            }}
            className="flex shrink-0 items-center gap-1.5 px-3 py-2 bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] rounded-full text-sm font-medium whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            {guests} guests
          </button>

          {/* Bedrooms */}
          <button
            className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              minBedrooms > 0
                ? 'bg-[var(--casita-orange)] text-white'
                : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)]'
            }`}
            onClick={() => setMinBedrooms(minBedrooms > 0 ? 0 : 1)}
          >
            <Bed className="w-4 h-4" />
            {minBedrooms > 0 ? `${minBedrooms}+` : 'Beds'}
          </button>

          {/* Pet Friendly */}
          <button
            onClick={() => setPetFriendlyFilter(!petFriendlyFilter)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              petFriendlyFilter
                ? 'bg-[var(--casita-orange)] text-white'
                : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)]'
            }`}
          >
            <Dog className="w-4 h-4" />
            Pets
          </button>

          {/* Beachfront */}
          <button
            onClick={() => setBeachfrontOnly(!beachfrontOnly)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              beachfrontOnly
                ? 'bg-[var(--casita-orange)] text-white'
                : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)]'
            }`}
          >
            <Waves className="w-4 h-4" />
            Beach
          </button>

          {/* More Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeFiltersCount > 0
                ? 'bg-[var(--casita-gray-900)] text-white'
                : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : 'Filters'}
          </button>
        </div>

        {/* Results count + Sort row */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--casita-gray-600)]">
            <span className="font-semibold text-[var(--casita-gray-900)]">{sortedProperties.length}</span> {t.properties.found}
          </p>
          <div className="relative">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowGuestPicker(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] rounded-lg text-sm font-medium"
            >
              {sortOptions.find(o => o.value === sortBy)?.label || 'Recommended'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-[var(--casita-gray-200)] py-2 z-50">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--casita-gray-50)] transition-colors ${
                      sortBy === option.value ? 'text-[var(--casita-orange)] font-medium bg-[var(--casita-orange)]/5' : 'text-[var(--casita-gray-700)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guest Picker Dropdown (for app) */}
        {showGuestPicker && (
          <div className="absolute left-4 right-4 mt-2 bg-white rounded-xl shadow-lg border border-[var(--casita-gray-200)] p-4 z-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--casita-gray-900)]">Guests</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] flex items-center justify-center"
                    disabled={guests <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-semibold">{guests}</span>
                  <button
                    onClick={() => setGuests(guests + 1)}
                    className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowGuestPicker(false)}
              className="w-full mt-4 py-2.5 bg-[var(--casita-orange)] text-white rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Website search header - compact inline style for properties page
  const WebSearchHeader = () => (
    <div className="pt-20 md:pt-24 bg-[var(--casita-gray-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Selected Location Pill */}
        {selectedLocation && (
          <div className="mb-3 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--casita-orange)] text-white rounded-full font-medium">
              <MapPin className="w-4 h-4" />
              <span>{selectedLocation}</span>
              <button
                onClick={clearLocation}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label="Clear location"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-[var(--casita-gray-500)]">
              Showing stays in {selectedLocation}
            </span>
          </div>
        )}

        {/* Compact inline search bar */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--casita-gray-200)] p-3 mb-4">
          {/* Row 1: Search fields */}
          <div className="flex flex-col lg:flex-row gap-3 mb-3">
            {/* Location dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setShowCityDropdown(!showCityDropdown);
                  setShowGuestPicker(false);
                }}
                className="w-full lg:w-auto flex items-center gap-2 pl-10 pr-4 py-2.5 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none hover:border-[var(--casita-gray-300)]"
              >
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--casita-gray-400)]" />
                <span className={selectedLocation ? 'text-[var(--casita-gray-900)] font-medium' : 'text-[var(--casita-gray-500)]'}>
                  {selectedLocation || 'All Locations'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--casita-gray-400)] transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-[var(--casita-gray-200)] py-2 z-50 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--casita-gray-50)] transition-colors ${
                      !selectedLocation ? 'text-[var(--casita-orange)] font-medium bg-[var(--casita-orange)]/5' : 'text-[var(--casita-gray-700)]'
                    }`}
                  >
                    All Locations
                  </button>
                  {allCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedLocation(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--casita-gray-50)] transition-colors ${
                        selectedLocation === city ? 'text-[var(--casita-orange)] font-medium bg-[var(--casita-orange)]/5' : 'text-[var(--casita-gray-700)]'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--casita-gray-400)]" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--casita-orange)] focus:ring-1 focus:ring-[var(--casita-orange)]"
              />
            </div>

            {/* Check-in */}
            <div className="relative flex-shrink-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--casita-gray-400)] z-10" />
              <DatePicker
                selected={checkInDate}
                onChange={(date: Date | null) => {
                  setCheckInDate(date);
                  if (date && checkOutDate && checkOutDate <= date) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOutDate(nextDay);
                  }
                  if (date && !checkOutDate) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOutDate(nextDay);
                  }
                }}
                selectsStart
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={new Date()}
                placeholderText="Check-in"
                className="w-full lg:w-32 pl-10 pr-3 py-2.5 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--casita-orange)] cursor-pointer"
                dateFormat="MMM d"
              />
            </div>

            {/* Check-out */}
            <div className="relative flex-shrink-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--casita-gray-400)] z-10" />
              <DatePicker
                selected={checkOutDate}
                onChange={(date: Date | null) => setCheckOutDate(date)}
                selectsEnd
                startDate={checkInDate}
                endDate={checkOutDate}
                minDate={checkInDate || new Date()}
                placeholderText="Check-out"
                className="w-full lg:w-32 pl-10 pr-3 py-2.5 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--casita-orange)] cursor-pointer"
                dateFormat="MMM d"
              />
            </div>

            {/* Guests */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setShowGuestPicker(!showGuestPicker);
                  setShowCityDropdown(false);
                }}
                className="w-full lg:w-auto flex items-center gap-2 pl-10 pr-4 py-2.5 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none hover:border-[var(--casita-gray-300)]"
              >
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--casita-gray-400)]" />
                <span className="text-[var(--casita-gray-700)]">{guests} guests</span>
              </button>

              {showGuestPicker && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-[var(--casita-gray-200)] p-4 z-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--casita-gray-900)]">Guests</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] flex items-center justify-center hover:border-[var(--casita-orange)] disabled:opacity-40"
                          disabled={guests <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-semibold">{guests}</span>
                        <button
                          onClick={() => setGuests(guests + 1)}
                          className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] flex items-center justify-center hover:border-[var(--casita-orange)]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--casita-gray-900)]">Rooms</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setRooms(Math.max(1, rooms - 1))}
                          className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] flex items-center justify-center hover:border-[var(--casita-orange)] disabled:opacity-40"
                          disabled={rooms <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-semibold">{rooms}</span>
                        <button
                          onClick={() => setRooms(rooms + 1)}
                          className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] flex items-center justify-center hover:border-[var(--casita-orange)]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGuestPicker(false)}
                    className="w-full mt-4 py-2 bg-[var(--casita-orange)] text-white rounded-lg font-medium hover:bg-opacity-90"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--casita-orange)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Row 2: Quick filters and controls */}
          <div className="flex flex-col lg:flex-row gap-3 pt-3 border-t border-[var(--casita-gray-100)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide flex-1">
              <div className="relative flex-shrink-0">
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    minBedrooms > 0
                      ? 'bg-[var(--casita-orange)] text-white'
                      : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                  }`}
                  onClick={() => setMinBedrooms(minBedrooms > 0 ? 0 : 1)}
                >
                  <Bed className="w-3.5 h-3.5" />
                  {minBedrooms > 0 ? `${minBedrooms}+ Beds` : 'Beds'}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="relative flex-shrink-0">
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    minBathrooms > 0
                      ? 'bg-[var(--casita-orange)] text-white'
                      : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                  }`}
                  onClick={() => setMinBathrooms(minBathrooms > 0 ? 0 : 1)}
                >
                  <Bath className="w-3.5 h-3.5" />
                  {minBathrooms > 0 ? `${minBathrooms}+ Baths` : 'Baths'}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => setPetFriendlyFilter(!petFriendlyFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  petFriendlyFilter
                    ? 'bg-[var(--casita-orange)] text-white'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                Pet Friendly
              </button>

              <button
                onClick={() => setBeachfrontOnly(!beachfrontOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  beachfrontOnly
                    ? 'bg-[var(--casita-orange)] text-white'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                Beachfront
              </button>

              <div className="relative flex-shrink-0">
                <select
                  value={propertyType || ''}
                  onChange={(e) => setPropertyType(e.target.value || null)}
                  className={`appearance-none px-3 py-1.5 pr-7 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    propertyType
                      ? 'bg-[var(--casita-orange)] text-white'
                      : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                  }`}
                >
                  <option value="">Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="villa">Villa</option>
                  <option value="townhouse">Townhouse</option>
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${propertyType ? 'text-white' : 'text-[var(--casita-gray-400)]'}`} />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-[var(--casita-gray-900)] text-white'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                All Filters
                {activeFiltersCount > 0 && (
                  <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                    showFilters ? 'bg-white text-[var(--casita-gray-900)]' : 'bg-[var(--casita-orange)] text-white'
                  }`}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none px-3 py-1.5 pr-7 bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] rounded-lg text-sm font-medium focus:outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="hidden md:flex items-center bg-[var(--casita-gray-100)] rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-[var(--casita-gray-900)]'
                      : 'text-[var(--casita-gray-500)]'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white shadow-sm text-[var(--casita-gray-900)]'
                      : 'text-[var(--casita-gray-500)]'
                  }`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Use appropriate header based on platform
  const SearchHeader = isCapacitor ? AppSearchHeader : WebSearchHeader;

  // Results count shown below header when loaded (website only)
  const ResultsCount = () => {
    if (isCapacitor) return null; // App shows count in header
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <p className="text-sm text-[var(--casita-gray-600)]">
          <span className="font-semibold text-[var(--casita-gray-900)]">{sortedProperties.length}</span> {t.properties.found}
          {selectedLocation && <span> in <span className="font-medium">{selectedLocation}</span></span>}
          {searchQuery && <span> matching &ldquo;<span className="font-medium">{searchQuery}</span>&rdquo;</span>}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <SearchHeader />
        <div
          className="py-16 flex flex-col items-center justify-center min-h-[40vh]"
          style={isCapacitor ? { paddingTop: isIOS ? 'calc(env(safe-area-inset-top, 0px) + 160px)' : '160px' } : undefined}
        >
          <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin mb-4" />
          <p className="text-[var(--casita-gray-600)]">{t.properties.loading}</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SearchHeader />
        <div
          className="py-16 flex flex-col items-center justify-center min-h-[40vh]"
          style={isCapacitor ? { paddingTop: isIOS ? 'calc(env(safe-area-inset-top, 0px) + 160px)' : '160px' } : undefined}
        >
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>{t.common.tryAgain}</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SearchHeader />
      <ResultsCount />

      {/* Add padding for fixed app header */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"
        style={isCapacitor ? { paddingTop: isIOS ? 'calc(env(safe-area-inset-top, 0px) + 140px)' : '140px' } : undefined}
      >
        <div className="flex gap-8">
          {showFilters && (
            <div className="w-80 flex-shrink-0 hidden md:block">
              <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">{t.properties.filters}</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[var(--casita-orange)] hover:underline"
                    >
                      {t.properties.clearAll}
                    </button>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-6 pb-6 border-b border-[var(--casita-gray-100)]">
                  <h4 className="font-medium mb-3">{t.properties.pricePerNight}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) =>
                          setPriceRange([Number(e.target.value), priceRange[1]])
                        }
                        className="w-full px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm"
                        placeholder="Min"
                      />
                    </div>
                    <span className="text-[var(--casita-gray-400)]">-</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([priceRange[0], Number(e.target.value)])
                        }
                        className="w-full px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="mb-6 pb-6 border-b border-[var(--casita-gray-100)]">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bed className="w-4 h-4 text-[var(--casita-gray-500)]" />
                    Bedrooms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMinBedrooms(num)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          minBedrooms === num
                            ? 'bg-[var(--casita-orange)] text-white'
                            : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                        }`}
                      >
                        {num === 0 ? 'Any' : num === 5 ? '5+' : num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="mb-6 pb-6 border-b border-[var(--casita-gray-100)]">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bath className="w-4 h-4 text-[var(--casita-gray-500)]" />
                    Bathrooms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMinBathrooms(num)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          minBathrooms === num
                            ? 'bg-[var(--casita-orange)] text-white'
                            : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                        }`}
                      >
                        {num === 0 ? 'Any' : num === 4 ? '4+' : num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type */}
                <div className="mb-6 pb-6 border-b border-[var(--casita-gray-100)]">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-[var(--casita-gray-500)]" />
                    Property Type
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: null, label: 'Any' },
                      { value: 'apartment', label: 'Apartment' },
                      { value: 'house', label: 'House' },
                      { value: 'condo', label: 'Condo' },
                      { value: 'villa', label: 'Villa' },
                    ].map((type) => (
                      <button
                        key={type.value || 'any'}
                        onClick={() => setPropertyType(type.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          propertyType === type.value
                            ? 'bg-[var(--casita-orange)] text-white'
                            : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Features */}
                <div className="mb-6 pb-6 border-b border-[var(--casita-gray-100)]">
                  <h4 className="font-medium mb-3">Special Features</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--casita-gray-50)]">
                      <input
                        type="checkbox"
                        checked={petFriendlyFilter}
                        onChange={() => setPetFriendlyFilter(!petFriendlyFilter)}
                        className="w-5 h-5 rounded border-[var(--casita-gray-300)] text-[var(--casita-orange)] focus:ring-[var(--casita-orange)]"
                      />
                      <Dog className="w-4 h-4 text-[var(--casita-gray-500)]" />
                      <span className="text-sm">Pet Friendly</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--casita-gray-50)]">
                      <input
                        type="checkbox"
                        checked={beachfrontOnly}
                        onChange={() => setBeachfrontOnly(!beachfrontOnly)}
                        className="w-5 h-5 rounded border-[var(--casita-gray-300)] text-[var(--casita-orange)] focus:ring-[var(--casita-orange)]"
                      />
                      <Waves className="w-4 h-4 text-[var(--casita-gray-500)]" />
                      <span className="text-sm">Beachfront</span>
                    </label>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6 pb-6 border-b border-[var(--casita-gray-100)]">
                  <h4 className="font-medium mb-3">Amenities</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {amenityOptions.map((amenity) => {
                      const Icon = amenity.icon;
                      const isSelected = selectedAmenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-[var(--casita-orange)] text-white'
                              : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[var(--casita-gray-500)]" />
                    {t.properties.minRating}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          minRating === rating
                            ? 'bg-[var(--casita-orange)] text-white'
                            : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                        }`}
                      >
                        {rating === 0 ? t.properties.any : (
                          <>
                            <Star className="w-3 h-3 fill-current" />
                            {rating}+
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            {viewMode === 'grid' ? (
              <div className={`grid gap-6 ${showFilters ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {sortedProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onPreviewClick={() => setPreviewPropertyId(property.id)}
                    checkIn={checkInDate}
                    checkOut={checkOutDate}
                  />
                ))}
              </div>
            ) : (
              <PropertyMap properties={sortedProperties} />
            )}

            {sortedProperties.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-[var(--casita-gray-300)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-2">
                  {t.properties.noResults}
                </h3>
                <p className="text-[var(--casita-gray-600)] mb-6">
                  {t.properties.tryAdjusting}
                </p>
                <Button onClick={clearFilters}>{t.properties.clearFilters}</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Preview Modal */}
      <PropertyPreviewModal
        propertyId={previewPropertyId}
        onClose={() => setPreviewPropertyId(null)}
        initialCheckIn={checkInDate}
        initialCheckOut={checkOutDate}
      />
    </>
  );
}

function PropertiesPageWrapper() {
  const { isCapacitor, isReady } = useCapacitor();

  // Show loading state until we know the platform
  if (!isReady) {
    return (
      <main className="min-h-screen bg-[var(--casita-gray-50)]">
        <div className="pt-24 pb-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--casita-gray-50)]">
      {/* Only show Header on web - app has filter header built-in */}
      {!isCapacitor && <Header />}
      <Suspense fallback={
        <div className="pt-24 pb-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin" />
        </div>
      }>
        <PropertiesContent />
      </Suspense>
      {!isCapacitor && <Footer />}
    </main>
  );
}

export default function PropertiesPage() {
  return <PropertiesPageWrapper />;
}
