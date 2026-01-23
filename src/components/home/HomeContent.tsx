'use client';

import { useMemo, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import SearchBar from '@/components/search/SearchBar';
import Button from '@/components/ui/Button';
import {
  Shield,
  Headphones,
  DollarSign,
  ArrowRight,
  Star,
  Calendar,
  MapPin,
  Waves,
  Flame,
  BedDouble,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { Property } from '@/types';

interface HomeContentProps {
  properties: Property[];
}

// Gradient options for property cards
const GRADIENTS = [
  'from-[var(--casita-orange)]/20 to-[var(--casita-coral)]/20',
  'from-[var(--casita-turquoise)]/20 to-blue-200/30',
  'from-purple-100/30 to-pink-100/30',
  'from-green-100/30 to-[var(--casita-turquoise)]/20',
  'from-blue-100/30 to-[var(--casita-turquoise)]/20',
  'from-amber-100/30 to-[var(--casita-coral)]/20',
];

// Generate deal dates based on property index
function generateDealDates(index: number): { dates: string; nights: number } {
  const today = new Date();
  const startOffset = 14 + (index * 7); // Stagger start dates
  const nights = [3, 4, 5, 7][index % 4]; // Vary nights

  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + startOffset);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + nights);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return {
    dates: `${formatDate(checkIn)} - ${formatDate(checkOut)}`,
    nights
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

function LowestPricesSection({ properties, formatPrice }: { properties: Property[]; formatPrice: (price: number) => string }) {
  // Get unique cities from budget properties (under $100/night)
  const citiesFromBudgetProperties = useMemo(() => {
    const budgetProps = properties.filter(p => p.price.perNight < 100);
    const cities = new Set<string>();
    budgetProps.forEach(property => {
      if (property.location.city) {
        cities.add(property.location.city);
      }
    });
    return Array.from(cities);
  }, [properties]);

  const [selectedCity, setSelectedCity] = useState(citiesFromBudgetProperties[0] || 'Miami Beach');

  // Filter properties under $100/night for the selected city, multi-night stays
  const budgetDeals = useMemo(() => {
    // Filter properties that are less than $100 per night and in selected city
    const budgetProperties = properties
      .filter(p => p.price.perNight < 100 && p.location.city === selectedCity)
      .sort((a, b) => {
        // Sort by price first (lowest), then by review count (highest)
        if (a.price.perNight !== b.price.perNight) {
          return a.price.perNight - b.price.perNight;
        }
        return b.reviewCount - a.reviewCount;
      });

    // Take up to 4 properties for display
    return budgetProperties.slice(0, 4).map((property, index) => {
      // Generate multi-night stay deals (2+ nights)
      const nights = [2, 3, 4, 5][index % 4]; // Always more than 1 night
      const { dates } = generateDealDates(index);
      const discount = [10, 15, 20, 25][index % 4]; // Promotional discounts
      const originalPrice = property.price.perNight * nights;
      const finalPrice = Math.round(originalPrice * (1 - discount / 100));

      return {
        property,
        roomCount: property.roomsAvailable || 1,
        dates,
        nights,
        discount,
        originalPrice,
        finalPrice,
        gradient: GRADIENTS[index % GRADIENTS.length],
        icon: getIconType(property),
      };
    });
  }, [properties, selectedCity]);

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

  // Don't render if no properties
  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with City Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-full">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--casita-gray-900)]">
                Deals
              </h2>
              <p className="text-[var(--casita-gray-500)] text-sm mt-1">
                Less than $100 per night
              </p>
            </div>
          </div>

          {/* City Tabs */}
          <div className="flex flex-wrap gap-2">
            {citiesFromBudgetProperties.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCity === city
                    ? 'bg-[var(--casita-orange)] text-white shadow-md'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="flex justify-end mb-4">
          <Link
            href={`/properties?city=${encodeURIComponent(selectedCity)}`}
            className="text-[var(--casita-orange)] font-medium text-sm hover:underline flex items-center gap-1"
          >
            View all {selectedCity}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {budgetDeals.map((deal, index) => (
            <Link
              key={deal.property.id}
              href={`/property/${deal.property.slug}`}
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
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-1 line-clamp-1">
                  {deal.property.name}
                </h3>
                <div className="flex items-center gap-2 text-[var(--casita-gray-500)] text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{deal.dates}</span>
                  </div>
                  <span className="text-[var(--casita-gray-300)]">•</span>
                  <span>Sleeps {deal.property.maxGuests}</span>
                  {deal.roomCount > 1 && (
                    <>
                      <span className="text-[var(--casita-gray-300)]">•</span>
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" />
                        <span>{deal.roomCount} rooms available</span>
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
                {deal.roomCount > 1 && (
                  <p className="text-xs text-[var(--casita-gray-500)] mt-2">
                    From {formatPrice(deal.property.price.perNight)}/night
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeContent({ properties }: HomeContentProps) {
  const { t, formatPrice } = useLocale();

  return (
    <>
      {/* Hero Section - Clean solid orange background */}
      <section className="relative flex items-center justify-center bg-[var(--casita-orange)] overflow-visible z-20">
        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-10 md:pb-12 text-center overflow-visible">
          <div className="animate-fade-in">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-base md:text-lg text-white/90 font-medium mb-8">
              {t.hero.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div className="animate-slide-up overflow-visible relative z-[100]">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Lowest Prices of the Year - City Deals */}
      <LowestPricesSection properties={properties} formatPrice={formatPrice} />

      {/* Casual Benefits Strip */}
      <section className="py-12 bg-white border-y border-[var(--casita-gray-100)] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Budget Search */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-orange)]/10 flex items-center justify-center group-hover:bg-[var(--casita-orange)]/20 transition-colors">
                <SlidersHorizontal className="w-8 h-8 text-[var(--casita-orange)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">Budget Search</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Find your price range</p>
            </div>

            {/* No Fees */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-turquoise)]/10 flex items-center justify-center group-hover:bg-[var(--casita-turquoise)]/20 transition-colors">
                <DollarSign className="w-8 h-8 text-[var(--casita-turquoise)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">No Fees</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">No platform fees when you book direct</p>
            </div>

            {/* Pay Over Time with Klarna & Affirm */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-coral)]/10 flex items-center justify-center group-hover:bg-[var(--casita-coral)]/20 transition-colors relative">
                <Calendar className="w-8 h-8 text-[var(--casita-coral)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">Pay Over Time</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Flexible payments</p>
              <div className="flex items-center gap-2 mt-2">
                {/* Klarna Logo */}
                <svg className="h-4" viewBox="0 0 63 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.73 0H2.84v13.1h2.89V0zm4.85 0H7.7v13.1h2.88V0zm6.5 0c0 2.25-.95 4.38-2.6 5.87l-.27.24 3.73 6.99h-3.36l-3.11-5.9-.01 5.9h-2.88V0h2.88v5.65C12.87 4.29 14 2.2 14.2 0h2.88z" fill="#FFB3C7"/>
                  <path d="M19.8 13.1h2.88V0H19.8v13.1zm10.6-9.64a3.54 3.54 0 00-2.86 1.4V3.61h-2.76v9.49h2.8V8.17c0-1.5.99-2.23 2.1-2.23 1.2 0 1.9.8 1.9 2.18v5h2.8V7.58c0-2.52-1.63-4.12-3.98-4.12zm14.8 4.18c0-.67-.12-1.28-.36-1.82a4.15 4.15 0 00-1.02-1.4 4.6 4.6 0 00-1.54-.9 5.64 5.64 0 00-1.94-.33c-.72 0-1.38.11-2 .33-.6.22-1.13.54-1.57.95-.45.42-.8.92-1.04 1.52-.25.6-.37 1.27-.37 2.02v.47c0 .73.13 1.39.39 1.98.26.6.61 1.1 1.07 1.52.45.42.99.74 1.6.96.62.23 1.29.34 2 .34.64 0 1.25-.08 1.82-.24a5.1 5.1 0 001.52-.69 4.8 4.8 0 001.15-1.07l-1.72-1.35a2.8 2.8 0 01-1.04.87c-.4.2-.87.3-1.4.3-.7 0-1.27-.18-1.7-.53-.42-.35-.68-.84-.78-1.48h6.93v-.45zm-6.93-.89c.1-.57.33-1.03.72-1.37.38-.35.9-.52 1.55-.52.63 0 1.12.17 1.48.52.37.34.59.8.67 1.37h-4.42zm14.38-3.29a3.72 3.72 0 00-2.72 1.1v-.95h-2.76v9.49h2.8V8.17c0-1.5.9-2.23 2-2.23.33 0 .66.05.99.16l.37-2.68c-.23-.05-.45-.07-.68-.07zm7.98 0c-.7 0-1.35.12-1.94.35-.6.24-1.11.57-1.54.99-.43.43-.77.94-1.02 1.53-.24.6-.36 1.25-.36 1.96 0 .72.12 1.38.36 1.98.25.6.59 1.11 1.02 1.53.44.43.95.76 1.54 1 .6.23 1.24.35 1.94.35s1.35-.12 1.94-.35c.6-.24 1.1-.57 1.54-1 .43-.42.77-.93 1.02-1.53.24-.6.36-1.26.36-1.98 0-.71-.12-1.36-.36-1.96-.25-.6-.59-1.1-1.02-1.53a4.58 4.58 0 00-1.54-.99 4.96 4.96 0 00-1.94-.35zm0 2.23c.67 0 1.2.22 1.58.65.39.44.58 1.04.58 1.8 0 .77-.2 1.38-.58 1.81-.39.44-.91.66-1.58.66-.66 0-1.19-.22-1.57-.66-.39-.43-.58-1.04-.58-1.8 0-.77.2-1.37.58-1.81.38-.43.91-.65 1.57-.65z" fill="#0A0B09"/>
                </svg>
                {/* Affirm Logo */}
                <svg className="h-4" viewBox="0 0 55 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.08 4.7c-1.56 0-2.94.53-3.9 1.49-.96.96-1.44 2.25-1.44 3.87v9.74h3.42v-9.35c0-1.8.9-2.72 2.34-2.72.54 0 1.05.12 1.5.36l.9-3.03c-.75-.24-1.77-.36-2.82-.36zM0 5.05v14.75h3.42V5.05H0zm3.84-2.58a2.13 2.13 0 10-4.26 0 2.13 2.13 0 004.26 0zm14.46 7.07c0-2.86 1.26-4.58 3.36-4.58 1.68 0 2.82 1.23 2.82 3.18v11.66h3.42V7.91c0-1.95 1.14-3.18 2.82-3.18 2.1 0 3.36 1.72 3.36 4.58v10.49h3.42V8.5c0-4.5-2.58-6.63-5.58-6.63-2.04 0-3.78.93-4.74 2.67-.78-1.71-2.34-2.67-4.32-2.67-1.74 0-3.3.78-4.2 2.25V2.23h-3.42v17.57h3.42v-9.26h-.36zm27.54-4.49v14.75h3.42V5.05h-3.42zm3.84-2.58a2.13 2.13 0 10-4.26 0 2.13 2.13 0 004.26 0z" fill="#4A4AF4"/>
                  <path d="M18.24 5.05v2.16c-.9-1.47-2.46-2.25-4.2-2.25-3.84 0-6.66 3.18-6.66 7.62s2.82 7.62 6.66 7.62c1.74 0 3.3-.78 4.2-2.25v1.85h3.42V5.05h-3.42zm-3.48 12c-2.46 0-4.02-1.86-4.02-4.47s1.56-4.47 4.02-4.47 4.02 1.86 4.02 4.47-1.56 4.47-4.02 4.47z" fill="#4A4AF4"/>
                </svg>
              </div>
            </div>

            {/* Instant Confirmation */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-orange)]/10 flex items-center justify-center group-hover:bg-[var(--casita-orange)]/20 transition-colors">
                <Shield className="w-8 h-8 text-[var(--casita-orange)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">Instant Confirmation</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Confirmed in seconds</p>
            </div>

            {/* 24/7 Customer Service */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-turquoise)]/10 flex items-center justify-center group-hover:bg-[var(--casita-turquoise)]/20 transition-colors">
                <Headphones className="w-8 h-8 text-[var(--casita-turquoise)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">24/7 Support</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">We're always here</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/ready-to-book-bg.png"
            alt=""
            className="w-full h-full object-cover object-[center_70%]"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            {t.cta.title}
          </h2>
          <p className="text-white text-xl mb-10 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties">
              <Button variant="primary" size="lg">
                {t.cta.exploreAll}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
