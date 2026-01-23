'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight, MapPin, Waves, Building2, Sparkles, Loader2 } from 'lucide-react';
import { Property } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface PropertyCardProps {
  property: Property;
  showMap?: boolean;
  onPreviewClick?: () => void; // If provided, opens preview modal instead of navigating
  checkIn?: Date | null; // Search dates for dynamic pricing
  checkOut?: Date | null;
}

// Extract detailed location from address (e.g., "1200 Collins Ave, South Beach")
function getDetailedLocation(address: string, city: string): string {
  if (!address) return city;

  // Parse the full address to extract meaningful parts
  const parts = address.split(',').map(p => p.trim());

  if (parts.length === 0) return city;

  // Get the street part (first segment)
  let street = parts[0];

  // Extract street number and name
  const streetMatch = street.match(/^(\d+)\s+(.+)$/);
  let streetNumber = '';
  let streetName = street;

  if (streetMatch) {
    streetNumber = streetMatch[1];
    streetName = streetMatch[2];
  }

  // Abbreviate common street types
  streetName = streetName
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

  // Build the display string with number if available
  let display = streetNumber ? `${streetNumber} ${streetName}` : streetName;

  // Try to get neighborhood/area from second part of address if it's not just the city
  if (parts.length > 1) {
    const secondPart = parts[1];
    // Check if it's a neighborhood (not a state abbreviation or zip code)
    if (secondPart &&
        !secondPart.match(/^[A-Z]{2}$/) &&
        !secondPart.match(/^\d{5}/) &&
        secondPart.toLowerCase() !== city.toLowerCase()) {
      display += `, ${secondPart}`;
    }
  }

  // If still just have street name and it's short, add city
  if (!display.includes(',') && display.length < 20) {
    display += `, ${city}`;
  }

  // Truncate if too long
  if (display.length > 40) {
    display = display.substring(0, 37) + '...';
  }

  return display || city;
}

// Get property type display name
function getPropertyTypeDisplay(type: string): string {
  const typeMap: Record<string, string> = {
    'boutique-hotel': 'Boutique Hotel',
    'luxury-villa': 'Villa',
    'beach-house': 'Beach House',
    'mountain-retreat': 'Retreat',
    'city-apartment': 'Apartment',
    'historic-estate': 'Estate',
    'apartment': 'Apartment',
    'hotel': 'Hotel',
    'apart-hotel': 'Apart Hotel',
  };
  return typeMap[type?.toLowerCase()] || 'Apartment';
}

// Check for key amenities
function getKeyAmenities(amenities: string[]): { hasKitchen: boolean; hasKitchenette: boolean; hasDailyCleaning: boolean } {
  const amenitiesLower = amenities.map(a => a.toLowerCase());

  const hasKitchen = amenitiesLower.some(a =>
    a === 'kitchen' || a.includes('full kitchen') || a.includes('equipped kitchen')
  );

  const hasKitchenette = !hasKitchen && amenitiesLower.some(a =>
    a.includes('kitchenette') || a.includes('mini kitchen')
  );

  const hasDailyCleaning = amenitiesLower.some(a =>
    a.includes('daily cleaning') || a.includes('housekeeping') || a.includes('maid service') || a.includes('daily maid')
  );

  return { hasKitchen, hasKitchenette, hasDailyCleaning };
}

// Get tourist-relevant location perks (up to 2)
function getTouristLocationPerks(property: Property): string[] {
  const perks: string[] = [];
  const city = property.location.city?.toLowerCase() || '';
  const neighborhood = property.location.neighborhood?.toLowerCase() || '';

  // Miami Beach area perks
  if (city.includes('miami beach') || city.includes('bal harbour')) {
    if (property.isBeachfront || property.locationPerks?.includes('Beachfront')) {
      perks.push('Steps to Beach');
    } else if (property.distanceToBeach && property.distanceToBeach < 500) {
      perks.push('Near Ocean');
    } else {
      perks.push('Near Ocean');
    }

    if (neighborhood.includes('south of fifth') || property.locationPerks?.includes('South of Fifth')) {
      perks.push('South of Fifth');
    } else if (property.locationPerks?.includes('Ocean Drive')) {
      perks.push('On Ocean Drive');
    } else if (property.locationPerks?.includes('Entertainment District')) {
      perks.push('Entertainment District');
    }
  }

  // Add other destination-specific perks here (e.g., Iguazu)
  if (city.includes('iguazu') || city.includes('foz')) {
    perks.push('10 min to Falls');
  }

  // Fallback to locationPerks if we don't have enough
  if (perks.length < 2 && property.locationPerks) {
    const additionalPerks = property.locationPerks.filter(
      p => !perks.includes(p) && !['Art Deco District', 'Ocean Drive', 'Collins Avenue'].includes(p)
    );
    perks.push(...additionalPerks.slice(0, 2 - perks.length));
  }

  return perks.slice(0, 2);
}

export default function PropertyCard({ property, showMap = false, onPreviewClick, checkIn, checkOut }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [nightsCount, setNightsCount] = useState<number>(0);
  const { formatPrice, t } = useLocale();

  // Fetch dynamic pricing when dates are selected
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setDynamicPrice(null);
      setNightsCount(0);
      return;
    }

    const fetchQuote = async () => {
      setIsLoadingPrice(true);
      try {
        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];

        const response = await fetch('/api/booking/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: property.id,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            guestsCount: 2,
          }),
        });

        const data = await response.json();

        if (data.success && data.quote) {
          setDynamicPrice(data.quote.pricePerNight);
          setNightsCount(data.quote.nightsCount || 0);
        } else {
          // On failure, keep showing static price
          setDynamicPrice(null);
        }
      } catch (error) {
        console.error('Error fetching quote for card:', error);
        setDynamicPrice(null);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    // Debounce the fetch to avoid too many API calls
    const timeoutId = setTimeout(fetchQuote, 300);
    return () => clearTimeout(timeoutId);
  }, [checkIn, checkOut, property.id]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onPreviewClick) {
      e.preventDefault();
      onPreviewClick();
    }
  };

  const cardContent = (
      <div className="card-hover rounded-xl overflow-hidden bg-white">
        {/* Image Carousel */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={property.images[currentImageIndex]}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-md z-10"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--casita-gray-700)]'
              }`}
            />
          </button>

          {/* Navigation Arrows */}
          {isHovered && property.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white transition-all shadow-md opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--casita-gray-700)]" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white transition-all shadow-md opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4 text-[var(--casita-gray-700)]" />
              </button>
            </>
          )}

          {/* Image Indicators */}
          {property.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
              {property.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-1.5 max-w-[70%]">
            {property.isBeachfront && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                <Waves className="w-3 h-3" />
                Beachfront
              </span>
            )}
            {property.locationPerks?.includes('Art Deco District') && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold rounded-full">
                <Building2 className="w-3 h-3" />
                Art Deco District
              </span>
            )}
            {property.locationPerks?.includes('Ocean Drive') && !property.locationPerks?.includes('Art Deco District') && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-full">
                <Sparkles className="w-3 h-3" />
                Ocean Drive
              </span>
            )}
            {property.isNew && (
              <span className="px-3 py-1 bg-[var(--casita-orange)] text-white text-xs font-semibold rounded-full">
                New
              </span>
            )}
            {property.isFeatured && (
              <span className="px-3 py-1 bg-white text-[var(--casita-gray-900)] text-xs font-semibold rounded-full">
                Featured
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Main Title - Property Name (same as preview and full page) */}
          <h3 className="font-serif text-lg font-semibold text-[var(--casita-gray-900)] mb-1 group-hover:text-[var(--casita-orange)] transition-colors line-clamp-1">
            {property.name}
          </h3>

          {/* Location & Reviews Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-[var(--casita-gray-500)] text-sm">
              <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{property.location.city}, {property.location.country === 'United States' ? 'FL' : property.location.country}</span>
            </div>
            {property.reviewCount > 0 && (
              <div className="flex items-center flex-shrink-0 ml-2 text-sm text-[var(--casita-gray-500)]">
                <span>{property.reviewCount} {property.reviewCount === 1 ? 'review' : 'reviews'}</span>
              </div>
            )}
          </div>

          {/* Property Type, Kitchen & Location Perks */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2 text-xs">
            {/* Property Type */}
            <span className="px-2 py-0.5 bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] rounded-full">
              {getPropertyTypeDisplay(property.type)}
            </span>

            {/* Kitchen/Kitchenette */}
            {(() => {
              const { hasKitchen, hasKitchenette } = getKeyAmenities(property.amenities);
              if (hasKitchen) {
                return (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                    Kitchen
                  </span>
                );
              }
              if (hasKitchenette) {
                return (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                    Kitchenette
                  </span>
                );
              }
              return null;
            })()}

            {/* Location Perks (up to 2) */}
            {getTouristLocationPerks(property).map((perk) => (
              <span key={perk} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                {perk}
              </span>
            ))}
          </div>

          {/* Details */}
          <div className="flex items-center text-sm text-[var(--casita-gray-500)] mb-3">
            <span>{property.bedrooms} {property.bedrooms !== 1 ? t.properties.bedrooms : t.properties.bedroom}</span>
            <span className="mx-2">•</span>
            <span>{property.bathrooms} {property.bathrooms !== 1 ? t.properties.bathrooms : t.properties.bathroom}</span>
            <span className="mx-2">•</span>
            <span>{property.maxGuests} {t.properties.guests}</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline">
            {isLoadingPrice ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--casita-orange)]" />
                <span className="text-sm text-[var(--casita-gray-500)]">Getting price...</span>
              </div>
            ) : (
              <>
                <span className="text-2xl font-semibold text-[var(--casita-gray-900)]">
                  {formatPrice(dynamicPrice ?? property.price.perNight)}
                </span>
                <span className="text-[var(--casita-gray-500)] ml-1">/ {t.properties.perNight}</span>
                {dynamicPrice && nightsCount > 1 && (
                  <span className="text-xs text-[var(--casita-gray-400)] ml-2">(avg)</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );

  // If onPreviewClick is provided, wrap in button, otherwise wrap in Link
  if (onPreviewClick) {
    return (
      <button
        type="button"
        onClick={handleCardClick}
        className="group block text-left w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <Link
      href={`/property/${property.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {cardContent}
    </Link>
  );
}
