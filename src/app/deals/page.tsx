'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Loader2,
  Calendar,
  Star,
  MapPin,
  ArrowRight,
  Flame,
  BedDouble,
  Waves,
} from 'lucide-react';
import { Property } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

// Gradient options for property cards
const GRADIENTS = [
  'from-[var(--casita-orange)]/20 to-[var(--casita-coral)]/20',
  'from-[var(--casita-turquoise)]/20 to-blue-200/30',
  'from-purple-100/30 to-pink-100/30',
  'from-green-100/30 to-[var(--casita-turquoise)]/20',
  'from-blue-100/30 to-[var(--casita-turquoise)]/20',
  'from-amber-100/30 to-[var(--casita-coral)]/20',
];

// Generate deal dates based on property index and nights count
function generateDealDates(index: number, nights: number): { dates: string; checkIn: string; checkOut: string } {
  const today = new Date();
  const startOffset = 14 + (index * 3); // Stagger start dates

  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + startOffset);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + nights);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return {
    dates: `${formatDate(checkIn)} - ${formatDate(checkOut)}`,
    checkIn: checkIn.toISOString().split('T')[0],
    checkOut: checkOut.toISOString().split('T')[0],
  };
}

// Get icon type based on property characteristics
function getIconType(property: Property): 'city' | 'beach' | 'arts' | 'nature' {
  const name = property.name.toLowerCase();
  const desc = property.description.toLowerCase();

  if (name.includes('beach') || name.includes('ocean') || desc.includes('beachfront') || property.isBeachfront) {
    return 'beach';
  }
  if (name.includes('art deco') || name.includes('historic') || desc.includes('art deco')) {
    return 'arts';
  }
  if (name.includes('villa') || name.includes('pool') || desc.includes('garden') || desc.includes('zen')) {
    return 'nature';
  }
  return 'city';
}

export default function DealsPage() {
  const { formatPrice } = useLocale();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const response = await fetch('/api/listings');
        const data = await response.json();

        if (data.success && data.data) {
          setProperties(data.data);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  // Get unique cities from budget properties (starting from $99/night base price)
  const MAX_BASE_PRICE_FOR_DEALS = 100;

  const citiesFromBudgetProperties = useMemo(() => {
    const budgetProps = properties.filter(p => p.price.perNight <= MAX_BASE_PRICE_FOR_DEALS);
    const cityCount = new Map<string, number>();
    budgetProps.forEach(property => {
      if (property.location.city) {
        cityCount.set(property.location.city, (cityCount.get(property.location.city) || 0) + 1);
      }
    });
    // Sort by count descending
    return Array.from(cityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city);
  }, [properties]);

  // Set default city when cities are loaded
  useEffect(() => {
    if (citiesFromBudgetProperties.length > 0 && selectedCity === null) {
      setSelectedCity(citiesFromBudgetProperties[0]);
    }
  }, [citiesFromBudgetProperties, selectedCity]);

  // Generate deals for all budget properties
  const allDeals = useMemo(() => {
    // Filter properties with affordable base prices (starting from $99/night)
    const budgetProperties = properties
      .filter(p => p.price.perNight <= MAX_BASE_PRICE_FOR_DEALS)
      .sort((a, b) => {
        // Sort by price first (lowest), then by review count (highest)
        if (a.price.perNight !== b.price.perNight) {
          return a.price.perNight - b.price.perNight;
        }
        return b.reviewCount - a.reviewCount;
      });

    return budgetProperties.map((property, index) => {
      // Generate multi-night stay deals
      const nights = [2, 3, 4, 5][index % 4];
      const { dates, checkIn, checkOut } = generateDealDates(index, nights);
      const discount = [10, 15, 20, 25][index % 4];
      const originalPrice = property.price.perNight * nights;
      const finalPrice = Math.round(originalPrice * (1 - discount / 100));

      return {
        property,
        dates,
        checkIn,
        checkOut,
        nights,
        discount,
        originalPrice,
        finalPrice,
        gradient: GRADIENTS[index % GRADIENTS.length],
        icon: getIconType(property),
      };
    });
  }, [properties]);

  // Filter deals by selected city
  const filteredDeals = useMemo(() => {
    if (!selectedCity) return allDeals;
    return allDeals.filter(deal => deal.property.location.city === selectedCity);
  }, [allDeals, selectedCity]);

  const getIconForType = (type: 'city' | 'beach' | 'arts' | 'nature') => {
    switch (type) {
      case 'city':
        return <MapPin className="w-12 h-12 text-[var(--casita-orange)]/40" />;
      case 'beach':
        return <Waves className="w-12 h-12 text-[var(--casita-turquoise)]/40" />;
      case 'arts':
        return <Star className="w-12 h-12 text-purple-400/40" />;
      case 'nature':
        return (
          <svg className="w-12 h-12 text-green-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3c-4 4-7 8-7 12a7 7 0 1014 0c0-4-3-8-7-12z" />
          </svg>
        );
    }
  };

  return (
    <main className="min-h-screen bg-[var(--casita-gray-50)]">
      <Header />

      {/* Hero Section */}
      <div className="pt-20 md:pt-24 bg-gradient-to-b from-[var(--casita-orange)]/10 to-[var(--casita-gray-50)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--casita-orange)] text-white rounded-full text-sm font-medium mb-4">
              <Flame className="w-4 h-4" />
              Hot Deals
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--casita-gray-900)] mb-4">
              Budget-Friendly Stays
            </h1>
            <p className="text-lg text-[var(--casita-gray-600)] max-w-2xl mx-auto">
              Discover amazing deals starting from <span className="font-semibold text-[var(--casita-orange)]">$99/night</span>.
              Save up to 25% on multi-night stays.
            </p>
          </div>
        </div>
      </div>

      {/* City Filter Tabs */}
      <div className="sticky top-16 lg:top-20 bg-white/95 backdrop-blur-sm border-b border-[var(--casita-gray-100)] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCity(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedCity === null
                  ? 'bg-[var(--casita-orange)] text-white shadow-md'
                  : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
              }`}
            >
              All Cities ({allDeals.length})
            </button>
            {citiesFromBudgetProperties.map((city) => {
              const count = allDeals.filter(d => d.property.location.city === city).length;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedCity === city
                      ? 'bg-[var(--casita-orange)] text-white shadow-md'
                      : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                  }`}
                >
                  {city} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin mb-4" />
            <p className="text-[var(--casita-gray-600)]">Finding the best deals for you...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-16">
            <Flame className="w-16 h-16 text-[var(--casita-gray-300)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-2">
              No deals found
            </h3>
            <p className="text-[var(--casita-gray-600)] mb-6">
              Check back soon for new budget-friendly deals!
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--casita-orange)] text-white rounded-full font-medium hover:bg-opacity-90 transition-colors"
            >
              Browse All Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-[var(--casita-gray-600)]">
                <span className="font-semibold text-[var(--casita-gray-900)]">{filteredDeals.length}</span> deals
                {selectedCity && ` in ${selectedCity}`}
              </p>
              {selectedCity && (
                <Link
                  href={`/properties?city=${encodeURIComponent(selectedCity)}`}
                  className="text-[var(--casita-orange)] font-medium text-sm hover:underline flex items-center gap-1"
                >
                  View all {selectedCity} properties
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDeals.map((deal, index) => (
                <Link
                  key={deal.property.id}
                  href={`/property/${deal.property.slug}?checkIn=${deal.checkIn}&checkOut=${deal.checkOut}`}
                  className="group bg-white border border-[var(--casita-gray-200)] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Property Image or Gradient Fallback */}
                  <div className="relative h-40 overflow-hidden">
                    {deal.property.images[0] ? (
                      <img
                        src={deal.property.images[0]}
                        alt={deal.property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${deal.gradient} flex items-center justify-center`}>
                        {getIconForType(deal.icon)}
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{deal.discount}% OFF
                      </span>
                    </div>
                    {/* Rating badge */}
                    {deal.property.reviewCount > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[var(--casita-gray-900)] text-xs font-semibold px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 text-[var(--casita-orange)] fill-[var(--casita-orange)]" />
                          {deal.property.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1 line-clamp-1 group-hover:text-[var(--casita-orange)] transition-colors">
                      {deal.property.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[var(--casita-gray-500)] text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{deal.dates}</span>
                      </div>
                      <span className="text-[var(--casita-gray-300)]">|</span>
                      <span>Sleeps {deal.property.maxGuests}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--casita-gray-500)] text-xs mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{deal.property.location.city}</span>
                      </div>
                      {deal.property.bedrooms && (
                        <>
                          <span className="text-[var(--casita-gray-300)]">|</span>
                          <div className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            <span>{deal.property.bedrooms} bed{deal.property.bedrooms > 1 ? 's' : ''}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[var(--casita-gray-400)] text-sm line-through mr-2">
                          {formatPrice(deal.originalPrice)}
                        </span>
                        <span className="text-2xl font-bold text-[var(--casita-orange)]">
                          {formatPrice(deal.finalPrice)}
                        </span>
                      </div>
                      <span className="text-[var(--casita-gray-500)] text-xs">{deal.nights} nights</span>
                    </div>
                    <p className="text-xs text-[var(--casita-gray-500)] mt-2">
                      From {formatPrice(deal.property.price.perNight)}/night
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl p-8 border border-[var(--casita-gray-100)]">
          <h2 className="text-2xl font-serif font-bold text-[var(--casita-gray-900)] mb-4">
            How Our Deals Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--casita-orange)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-[var(--casita-orange)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Starting from $99/Night</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">
                  Our most affordable properties. Book directly and save on fees!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--casita-turquoise)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[var(--casita-turquoise)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Multi-Night Savings</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">
                  Save up to 25% on stays of 2-5 nights. The longer you stay, the more you save!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--casita-coral)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-[var(--casita-coral)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1">Top-Rated Properties</h3>
                <p className="text-sm text-[var(--casita-gray-600)]">
                  All our properties are from verified Superhosts with excellent reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
