'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import Button from '@/components/ui/Button';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Grid,
  Map,
  Star,
  Loader2,
} from 'lucide-react';
import { Property, SortOption } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

function PropertiesContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();

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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('destination') || '');

  // Fetch properties from API
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/listings');
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
  }, []);

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
  };

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 2000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  if (loading) {
    return (
      <div className="pt-24 pb-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin mb-4" />
        <p className="text-[var(--casita-gray-600)]">{t.properties.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 pb-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>{t.common.tryAgain}</Button>
      </div>
    );
  }

  return (
    <>
      {/* Search Header */}
      <div className="pt-24 pb-6 bg-white border-b border-[var(--casita-gray-200)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)]" />
                <input
                  type="text"
                  placeholder="Search by destination, property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--casita-gray-50)] border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-2 focus:ring-[var(--casita-orange-light)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-[var(--casita-orange)] text-white border-[var(--casita-orange)]'
                    : 'bg-white text-[var(--casita-gray-700)] border-[var(--casita-gray-200)] hover:border-[var(--casita-gray-400)]'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>{t.properties.filters}</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 bg-white text-[var(--casita-orange)] text-xs font-bold rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none px-4 py-3 pr-10 bg-white border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)] pointer-events-none" />
              </div>

              <div className="hidden md:flex items-center bg-[var(--casita-gray-100)] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white shadow text-[var(--casita-gray-900)]'
                      : 'text-[var(--casita-gray-500)] hover:text-[var(--casita-gray-700)]'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white shadow text-[var(--casita-gray-900)]'
                      : 'text-[var(--casita-gray-500)] hover:text-[var(--casita-gray-700)]'
                  }`}
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {showFilters && (
            <div className="w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] p-6 sticky top-28">
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
            <div className="mb-6">
              <p className="text-[var(--casita-gray-600)]">
                <span className="font-semibold text-[var(--casita-gray-900)]">
                  {sortedProperties.length}
                </span>{' '}
                {t.properties.found}
                {searchQuery && (
                  <>
                    {' '}for &ldquo;<span className="font-medium">{searchQuery}</span>&rdquo;
                  </>
                )}
              </p>
            </div>

            {viewMode === 'grid' ? (
              <div className={`grid gap-6 ${showFilters ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {sortedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="bg-[var(--casita-gray-200)] rounded-2xl h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-[var(--casita-gray-400)] mx-auto mb-4" />
                  <p className="text-[var(--casita-gray-600)]">Map view coming soon</p>
                  <p className="text-sm text-[var(--casita-gray-500)]">
                    Interactive map with property locations
                  </p>
                </div>
              </div>
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
