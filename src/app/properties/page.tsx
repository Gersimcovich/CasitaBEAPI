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
} from 'lucide-react';
import { Property, SortOption } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';
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
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [guestFilter, setGuestFilter] = useState<number | null>(urlGuests);
  const [checkInDate, setCheckInDate] = useState<Date | null>(urlCheckIn ? new Date(urlCheckIn) : null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(urlCheckOut ? new Date(urlCheckOut) : null);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [previewPropertyId, setPreviewPropertyId] = useState<string | null>(null);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [guests, setGuests] = useState(urlGuests || 2);
  const [rooms, setRooms] = useState(1);
  const [petFriendlyFilter, setPetFriendlyFilter] = useState(urlPetFriendly);

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
  };

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedLocation ? 1 : 0);

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

  // Shared search header component - compact inline style for properties page
  const SearchHeader = () => (
    <div className="pt-20 md:pt-24 bg-[var(--casita-gray-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact inline search bar */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--casita-gray-200)] p-3 mb-4">
          {/* Row 1: Search fields */}
          <div className="flex flex-col lg:flex-row gap-3 mb-3">
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
                  // Auto-adjust checkout if it's on or before the new check-in
                  if (date && checkOutDate && checkOutDate <= date) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOutDate(nextDay);
                  }
                  // If no checkout is set, auto-set it to the next day
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
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full lg:w-auto flex items-center gap-2 pl-10 pr-4 py-2.5 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none hover:border-[var(--casita-gray-300)]"
              >
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--casita-gray-400)]" />
                <span className="text-[var(--casita-gray-700)]">{guests} guests</span>
              </button>

              {/* Guest Picker Dropdown */}
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

          {/* Row 2: Location chips and controls */}
          <div className="flex flex-col lg:flex-row gap-3 pt-3 border-t border-[var(--casita-gray-100)]">
            {/* Location chips - scrollable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide flex-1">
              {allCities.length > 0 && (
                <>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedLocation === null
                        ? 'bg-[var(--casita-orange)] text-white'
                        : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    All
                  </button>
                  {allCities.map((location) => (
                    <button
                      key={location}
                      onClick={() => setSelectedLocation(selectedLocation === location ? null : location)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedLocation === location
                          ? 'bg-[var(--casita-orange)] text-white'
                          : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-[var(--casita-orange)] text-white'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-[var(--casita-orange)] w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

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

  // Results count shown below header when loaded
  const ResultsCount = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
      <p className="text-sm text-[var(--casita-gray-600)]">
        <span className="font-semibold text-[var(--casita-gray-900)]">{sortedProperties.length}</span> {t.properties.found}
        {selectedLocation && <span> in <span className="font-medium">{selectedLocation}</span></span>}
        {searchQuery && <span> matching &ldquo;<span className="font-medium">{searchQuery}</span>&rdquo;</span>}
      </p>
    </div>
  );

  if (loading) {
    return (
      <>
        <SearchHeader />
        <div className="py-16 flex flex-col items-center justify-center min-h-[40vh]">
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
        <div className="py-16 flex flex-col items-center justify-center min-h-[40vh]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex gap-8">
          {showFilters && (
            <div className="w-72 flex-shrink-0 hidden md:block">
              <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] p-6 sticky top-4">
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

                <div className="mb-6">
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

                <div>
                  <h4 className="font-medium mb-3">{t.properties.minRating}</h4>
                  <div className="flex gap-2">
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

export default function PropertiesPage() {
  return (
    <main className="min-h-screen bg-[var(--casita-gray-50)]">
      <Header />
      <Suspense fallback={
        <div className="pt-24 pb-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin" />
        </div>
      }>
        <PropertiesContent />
      </Suspense>
      <Footer />
    </main>
  );
}
