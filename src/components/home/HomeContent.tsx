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
  // Get unique cities from actual properties
  // The Guesty API already returns only parent listings (parentsOnly defaults to true)
  const citiesFromProperties = useMemo(() => {
    const cities = new Set<string>();
    properties.forEach(property => {
      if (property.location.city) {
        cities.add(property.location.city);
      }
    });
    return Array.from(cities);
  }, [properties]);

  const [selectedCity, setSelectedCity] = useState(citiesFromProperties[0] || 'Miami Beach');

  // Generate deals from properties for the selected city, sorted by review count
  const currentDeals = useMemo(() => {
    const cityProperties = properties
      .filter(p => p.location.city === selectedCity)
      .sort((a, b) => b.reviewCount - a.reviewCount); // Sort by most reviews first

    return cityProperties.slice(0, 4).map((property, index) => {
      const { dates, nights } = generateDealDates(index);
      const discount = [15, 20, 25, 30][index % 4]; // Promotional discounts
      const originalPrice = property.price.perNight * nights;
      const finalPrice = Math.round(originalPrice * (1 - discount / 100));

      return {
        property,
        roomCount: property.roomsAvailable || 1, // Use roomsAvailable from API if present
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
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with City Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-full">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--casita-gray-900)]">
                Lowest Prices of the Year
              </h2>
              <p className="text-[var(--casita-gray-500)] text-sm mt-1">
                Limited time offers • Select a city
              </p>
            </div>
          </div>

          {/* City Tabs */}
          <div className="flex flex-wrap gap-2">
            {citiesFromProperties.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCity === city
                    ? 'bg-[var(--casita-orange)] text-white shadow-md'
                    : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] hover:bg-[var(--casita-gray-200)]'
                }`}
              >
                {city} Deals
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
          {currentDeals.map((deal, index) => (
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
      {/* Hero Section - Caribbean warm illustrated style (20% smaller) */}
      <section className="relative min-h-[68vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FFF9F0] via-white to-[#FFF5EB]">
        {/* Hand-drawn Caribbean decorative illustrations - slightly off center, 10% smaller */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">

          {/* Subtle sun rays in background - top right */}
          <svg className="absolute -right-20 -top-20 w-64 h-64 opacity-[0.08]" viewBox="0 0 200 200" fill="none" stroke="var(--casita-orange)" strokeWidth="3" strokeLinecap="round">
            <circle cx="100" cy="100" r="30" />
            <line x1="100" y1="40" x2="100" y2="55" />
            <line x1="100" y1="145" x2="100" y2="160" />
            <line x1="40" y1="100" x2="55" y2="100" />
            <line x1="145" y1="100" x2="160" y2="100" />
            <line x1="55" y1="55" x2="67" y2="67" />
            <line x1="133" y1="133" x2="145" y2="145" />
            <line x1="55" y1="145" x2="67" y2="133" />
            <line x1="133" y1="67" x2="145" y2="55" />
          </svg>

          {/* Island with palm and sun - slightly off center top left (10% smaller) */}
          <img
            src="/island-palm.png"
            alt=""
            className="absolute left-[8%] md:left-[12%] lg:left-[15%] top-20 md:top-24 w-28 md:w-36 lg:w-44 h-auto opacity-25"
          />

          {/* Orange waves SVG - left of parrot, slightly down (10% smaller) */}
          <svg className="absolute right-[15%] md:right-[19%] lg:right-[22%] top-32 md:top-36 w-14 md:w-18 lg:w-22 h-auto opacity-45 hidden sm:block" viewBox="0 0 80 50" fill="none" stroke="var(--casita-orange)" strokeWidth="2" strokeLinecap="round">
            <path d="M5,15 Q20,5 35,15 Q50,25 65,15 Q72,11 80,15" />
            <path d="M0,28 Q15,18 30,28 Q45,38 60,28 Q70,22 80,28" />
            <path d="M5,41 Q20,31 35,41 Q50,51 65,41 Q72,37 75,41" />
          </svg>

          {/* Parrot - top right area, slightly off center (10% smaller) */}
          <img
            src="/parrot-transparent.png"
            alt=""
            className="absolute right-6 md:right-16 lg:right-24 top-24 md:top-28 w-14 md:w-18 lg:w-22 h-auto opacity-45"
          />

          {/* Wave - slightly off center from bottom left (10% smaller) */}
          <img
            src="/wave.webp"
            alt=""
            className="absolute bottom-14 md:bottom-18 left-[10%] md:left-[14%] lg:left-[18%] w-18 md:w-25 lg:w-28 h-auto opacity-25"
          />

          {/* Seashell SVG - bottom center-left for beachy feel */}
          <svg className="absolute bottom-16 left-[35%] w-10 md:w-12 h-auto opacity-20 hidden md:block" viewBox="0 0 40 40" fill="none" stroke="var(--casita-orange)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M20,5 Q35,15 30,30 Q25,38 20,35 Q15,38 10,30 Q5,15 20,5" />
            <path d="M20,10 Q28,18 25,28" />
            <path d="M20,10 Q12,18 15,28" />
            <path d="M20,15 Q24,20 22,26" />
            <path d="M20,15 Q16,20 18,26" />
          </svg>

          {/* Palm tree - bottom right, slightly off center (10% smaller) */}
          <img
            src="/palm.webp"
            alt=""
            className="absolute right-4 md:right-10 lg:right-16 bottom-10 w-22 md:w-32 lg:w-40 h-auto opacity-35"
          />

          {/* Small starfish SVG - bottom right area for extra beachy touch */}
          <svg className="absolute bottom-24 right-[25%] w-8 md:w-10 h-auto opacity-15 hidden lg:block" viewBox="0 0 40 40" fill="var(--casita-orange)" fillOpacity="0.3" stroke="var(--casita-orange)" strokeWidth="1">
            <path d="M20,2 L23,15 L38,15 L26,23 L30,38 L20,28 L10,38 L14,23 L2,15 L17,15 Z" />
          </svg>

        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
          <div className="animate-fade-in">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--casita-black)] mb-5 leading-tight">
              {t.hero.title}
            </h1>
            <p className="text-base md:text-lg text-[var(--casita-gray-600)] font-medium mb-10">
              {t.hero.subtitle}
            </p>
          </div>

          {/* Search Bar with decorative elements */}
          <div className="animate-slide-up relative">
            {/* Parrot drawing - left of search bar (10% smaller) */}
            <svg className="absolute -left-4 md:-left-20 lg:-left-24 top-1/2 -translate-y-1/2 w-14 md:w-20 lg:w-24 h-auto opacity-60 hidden sm:block" viewBox="0 0 60 80" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="30" cy="40" rx="14" ry="18" stroke="var(--casita-orange)" />
              <circle cx="30" cy="20" r="10" stroke="var(--casita-orange)" />
              <circle cx="33" cy="18" r="2.5" stroke="var(--casita-orange)" />
              <circle cx="34" cy="17" r="1" fill="var(--casita-black)" />
              <path d="M38,22 Q46,24 44,29 Q41,27 38,25" stroke="var(--casita-orange)" fill="var(--casita-orange)" fillOpacity="0.3" />
              <path d="M19,35 Q25,44 21,52" stroke="var(--casita-orange)" />
              <path d="M23,38 Q28,45 25,51" stroke="var(--casita-orange)" />
              <path d="M26,56 L22,70" stroke="var(--casita-orange)" />
              <path d="M30,58 L29,72" stroke="var(--casita-orange)" />
              <path d="M34,56 L37,70" stroke="var(--casita-orange)" />
            </svg>

            <SearchBar variant="hero" />

            {/* Wave line drawings underneath search bar - bigger, attached with no spaces */}
            <div className="flex justify-center -space-x-1 mt-4 opacity-30">
              <img src="/wave-line.png" alt="" className="w-20 md:w-28 lg:w-32 h-auto" />
              <img src="/wave-line.png" alt="" className="w-20 md:w-28 lg:w-32 h-auto" />
              <img src="/wave-line.png" alt="" className="w-20 md:w-28 lg:w-32 h-auto hidden sm:block" />
              <img src="/wave-line.png" alt="" className="w-20 md:w-28 lg:w-32 h-auto hidden md:block" />
              <img src="/wave-line.png" alt="" className="w-20 md:w-28 lg:w-32 h-auto hidden lg:block" />
              <img src="/wave-line.png" alt="" className="w-20 md:w-28 lg:w-32 h-auto hidden xl:block" />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="w-5 h-8 border-2 border-[var(--casita-orange)]/50 rounded-full flex justify-center">
            <div className="w-1 h-2.5 bg-[var(--casita-orange)] rounded-full mt-1.5 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Lowest Prices of the Year - City Deals */}
      <LowestPricesSection properties={properties} formatPrice={formatPrice} />

      {/* Casual Benefits Strip */}
      <section className="py-12 bg-white border-y border-[var(--casita-gray-100)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            {/* No Fees */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-orange)]/10 flex items-center justify-center group-hover:bg-[var(--casita-orange)]/20 transition-colors">
                <DollarSign className="w-8 h-8 text-[var(--casita-orange)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">No Fees</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Book direct & save</p>
            </div>

            {/* Pay Over Time */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-turquoise)]/10 flex items-center justify-center group-hover:bg-[var(--casita-turquoise)]/20 transition-colors">
                <Calendar className="w-8 h-8 text-[var(--casita-turquoise)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">Pay Over Time</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Flexible payments</p>
            </div>

            {/* Guaranteed Booking */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-coral)]/10 flex items-center justify-center group-hover:bg-[var(--casita-coral)]/20 transition-colors">
                <Shield className="w-8 h-8 text-[var(--casita-coral)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">Guaranteed Booking</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Secure & confirmed</p>
            </div>

            {/* 24/7 Customer Service */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-orange)]/10 flex items-center justify-center group-hover:bg-[var(--casita-orange)]/20 transition-colors">
                <Headphones className="w-8 h-8 text-[var(--casita-orange)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">24/7 Support</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">We're always here</p>
            </div>

            {/* Daily Housekeeping */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 mb-3 rounded-2xl bg-[var(--casita-turquoise)]/10 flex items-center justify-center group-hover:bg-[var(--casita-turquoise)]/20 transition-colors">
                <Star className="w-8 h-8 text-[var(--casita-turquoise)]" />
              </div>
              <h3 className="font-semibold text-[var(--casita-gray-900)]">Daily Housekeeping</h3>
              <p className="text-sm text-[var(--casita-gray-500)] mt-1">Fresh & spotless</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--casita-black)] relative overflow-hidden">
        {/* Decorative Caribbean illustrations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Palm tree silhouette - left */}
          <svg className="absolute -left-8 bottom-0 w-48 h-auto opacity-10" viewBox="0 0 100 180" fill="none" stroke="var(--casita-orange)" strokeWidth="2" strokeLinecap="round">
            <path d="M50,180 Q48,140 52,100 Q55,70 50,40" />
            <path d="M50,40 Q20,30 0,40" />
            <path d="M50,40 Q25,10 10,0" />
            <path d="M50,40 Q50,5 45,-10" />
            <path d="M50,40 Q75,10 90,0" />
            <path d="M50,40 Q80,30 100,40" />
          </svg>
          {/* Flamingo silhouette - right */}
          <svg className="absolute right-8 top-10 w-32 h-auto opacity-10" viewBox="0 0 80 120" fill="none" stroke="var(--casita-orange)" strokeWidth="2" strokeLinecap="round">
            <ellipse cx="45" cy="55" rx="18" ry="22" />
            <path d="M38,35 Q25,25 30,10 Q35,5 40,8" />
            <circle cx="38" cy="8" r="6" />
            <path d="M32,8 L26,10 L32,11" />
            <path d="M40,77 L38,110" />
            <path d="M50,75 Q52,95 48,110" />
          </svg>
          {/* Sun rays - top right */}
          <svg className="absolute -right-16 -top-16 w-64 h-64 opacity-10" viewBox="0 0 200 200" fill="none" stroke="var(--casita-orange)" strokeWidth="4" strokeLinecap="round">
            <circle cx="100" cy="100" r="40" />
            <line x1="100" y1="30" x2="100" y2="50" />
            <line x1="100" y1="150" x2="100" y2="170" />
            <line x1="30" y1="100" x2="50" y2="100" />
            <line x1="150" y1="100" x2="170" y2="100" />
            <line x1="50" y1="50" x2="65" y2="65" />
            <line x1="135" y1="135" x2="150" y2="150" />
            <line x1="50" y1="150" x2="65" y2="135" />
            <line x1="135" y1="65" x2="150" y2="50" />
          </svg>
          {/* Island silhouette - bottom */}
          <svg className="absolute bottom-0 left-1/4 w-1/2 h-20 opacity-5" viewBox="0 0 400 50" fill="var(--casita-orange)">
            <path d="M0,50 Q100,20 200,30 Q300,20 400,50 Z" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            {t.cta.title}
          </h2>
          <p className="text-[var(--casita-gray-400)] text-xl mb-10 max-w-2xl mx-auto">
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
