'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Property, PropertyReview } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import BookingWidget from '@/components/booking/BookingWidget';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Users,
  Bed,
  Bath,
  Maximize2,
  ShoppingCart,
  Check,
  Wifi,
  Utensils,
  Wind,
  Car,
  Waves,
  Loader2,
  Quote,
  Minimize2,
} from 'lucide-react';

interface PropertyPreviewModalProps {
  propertyId: string | null;
  onClose: () => void;
  initialCheckIn?: Date | null; // Pre-selected dates from search
  initialCheckOut?: Date | null;
}

export default function PropertyPreviewModal({ propertyId, onClose, initialCheckIn, initialCheckOut }: PropertyPreviewModalProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { formatPrice, t } = useLocale();
  const { cartItem, hasCartItem } = useCart();

  // Fetch property when propertyId changes
  useEffect(() => {
    if (!propertyId) {
      setProperty(null);
      return;
    }

    async function fetchProperty() {
      setLoading(true);
      setError(null);
      setCurrentImageIndex(0);

      try {
        const response = await fetch(`/api/listings/${propertyId}`);
        const data = await response.json();

        if (data.success) {
          setProperty(data.data);
        } else {
          setError(data.error || 'We couldn\'t load this property. Please try again!');
        }
      } catch (err) {
        setError('We couldn\'t load this property. Please try again!');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [propertyId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (propertyId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [propertyId]);

  if (!propertyId) return null;

  const nextImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  // Get key amenities for display
  const getDisplayAmenities = (amenities: string[] = []) => {
    const amenityList = amenities.map(a => a.toLowerCase());
    const display: string[] = [];

    if (amenityList.some(a => a.includes('wifi') || a.includes('wi-fi'))) display.push('WiFi');
    if (amenityList.some(a => a === 'kitchen' || a.includes('full kitchen'))) display.push('Kitchen');
    if (amenityList.some(a => a.includes('kitchenette'))) display.push('Kitchenette');
    if (amenityList.some(a => a.includes('air') && a.includes('condition'))) display.push('A/C');
    if (amenityList.some(a => a.includes('parking'))) display.push('Parking');
    if (amenityList.some(a => a.includes('pool'))) display.push('Pool');
    if (amenityList.some(a => a.includes('washer') || a.includes('laundry'))) display.push('Washer');
    if (amenityList.some(a => a.includes('dryer'))) display.push('Dryer');
    if (amenityList.some(a => a.includes('pet'))) display.push('Pet Friendly');
    if (amenityList.some(a => a.includes('beach'))) display.push('Beach Access');

    return display.slice(0, 8);
  };

  // Extract detailed location from address (matches PropertyCard)
  const getDetailedLocation = (address: string, city: string): string => {
    if (!address) return city;

    const parts = address.split(',').map(p => p.trim());
    if (parts.length === 0) return city;

    let street = parts[0];
    const streetMatch = street.match(/^(\d+)\s+(.+)$/);
    let streetNumber = '';
    let streetName = street;

    if (streetMatch) {
      streetNumber = streetMatch[1];
      streetName = streetMatch[2];
    }

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

    let display = streetNumber ? `${streetNumber} ${streetName}` : streetName;

    if (parts.length > 1) {
      const secondPart = parts[1];
      if (secondPart &&
          !secondPart.match(/^[A-Z]{2}$/) &&
          !secondPart.match(/^\d{5}/) &&
          secondPart.toLowerCase() !== city.toLowerCase()) {
        display += `, ${secondPart}`;
      }
    }

    if (!display.includes(',') && display.length < 20) {
      display += `, ${city}`;
    }

    return display || city;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Window - Looks like a mini full-page */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 z-50 flex items-center justify-center">
        <div className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-modal-in">
          {/* Top Bar with Close and Expand */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--casita-gray-200)] bg-white">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)] hover:bg-[var(--casita-gray-100)] rounded-lg transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="text-sm font-medium">Close Preview</span>
            </button>
            <Link
              href={propertyId ? `/property/${propertyId}` : '#'}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--casita-orange)] text-white rounded-lg font-medium hover:bg-[var(--casita-orange-dark)] transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              <span>View Full Page</span>
            </Link>
          </div>

          {/* Content - Scrollable area that looks like the full page */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {property && !loading && (
              <div className="max-w-6xl mx-auto">
                {/* Image Gallery */}
                <div className="p-4 md:p-6">
                  {property.images.length > 0 && (
                    <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[250px] md:h-[350px] lg:h-[400px] rounded-xl overflow-hidden">
                      {/* Main Image */}
                      <div
                        className="col-span-2 row-span-2 relative cursor-pointer"
                        onClick={() => setCurrentImageIndex(0)}
                      >
                        <Image
                          src={property.images[0]}
                          alt={property.name}
                          fill
                          className="object-cover hover:opacity-90 transition-opacity"
                        />
                        {/* Cart Indicator */}
                        {hasCartItem && cartItem?.propertyId === property.id && (
                          <div className="absolute top-3 right-3 p-2 bg-[var(--casita-orange)] rounded-full shadow-md">
                            <ShoppingCart className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Secondary Images */}
                      {property.images.slice(1, 5).map((image, index) => (
                        <div
                          key={index}
                          className="relative cursor-pointer hidden md:block"
                          onClick={() => setCurrentImageIndex(index + 1)}
                        >
                          <Image
                            src={image}
                            alt={`${property.name} ${index + 2}`}
                            fill
                            className="object-cover hover:opacity-90 transition-opacity"
                          />
                          {index === 3 && property.images.length > 5 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-lg font-medium">
                                +{property.images.length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6 px-4 md:px-6 pb-6">
                  {/* Left Column - Details */}
                  <div className="lg:col-span-2">
                    {/* Location */}
                    <div className="flex items-center text-[var(--casita-gray-500)] text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{property.location.city}, {property.location.country === 'United States' ? 'FL' : property.location.country}</span>
                    </div>

                    {/* Title */}
                    <h1 className="font-serif text-2xl md:text-3xl font-bold text-[var(--casita-gray-900)] mb-3">
                      {property.name}
                    </h1>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--casita-gray-600)] mb-4 pb-4 border-b border-[var(--casita-gray-200)]">
                      {property.reviewCount > 0 && (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-[var(--casita-orange)] fill-[var(--casita-orange)]" />
                            <span className="font-semibold text-[var(--casita-gray-900)]">{property.rating}</span>
                            <span>({property.reviewCount} reviews)</span>
                          </div>
                          <span className="text-[var(--casita-gray-300)]">•</span>
                        </>
                      )}
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        <span>{property.bedrooms} {property.bedrooms !== 1 ? 'bedrooms' : 'bedroom'}</span>
                      </div>
                      <span className="text-[var(--casita-gray-300)]">•</span>
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        <span>{property.bathrooms} {property.bathrooms !== 1 ? 'baths' : 'bath'}</span>
                      </div>
                      <span className="text-[var(--casita-gray-300)]">•</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{property.maxGuests} guests</span>
                      </div>
                    </div>

                    {/* Description */}
                    {property.description && (
                      <div className="mb-6">
                        <h2 className="font-serif text-lg font-semibold text-[var(--casita-gray-900)] mb-2">
                          About this place
                        </h2>
                        <p className="text-[var(--casita-gray-600)] text-sm leading-relaxed line-clamp-4">
                          {property.description}
                        </p>
                      </div>
                    )}

                    {/* Amenities */}
                    <div className="mb-6">
                      <h2 className="font-serif text-lg font-semibold text-[var(--casita-gray-900)] mb-3">
                        What this place offers
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {getDisplayAmenities(property.amenities).map((amenity) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-2 px-3 py-2 bg-[var(--casita-gray-50)] rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4 text-[var(--casita-orange)]" />
                            <span className="text-[var(--casita-gray-700)]">{amenity}</span>
                          </div>
                        ))}
                        {property.amenities.length > 8 && (
                          <div className="flex items-center px-3 py-2 text-[var(--casita-gray-500)] text-sm">
                            +{property.amenities.length - 8} more
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Review */}
                    {property.reviews && property.reviews.length > 0 && (
                      <div>
                        <h2 className="font-serif text-lg font-semibold text-[var(--casita-gray-900)] mb-3">
                          Guest Reviews
                        </h2>
                        <div className="bg-[var(--casita-cream)] rounded-xl p-4 relative">
                          <Quote className="w-6 h-6 text-[var(--casita-orange)] opacity-20 absolute top-3 right-3" />
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-[var(--casita-orange)] rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {property.reviews[0].reviewerName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-[var(--casita-gray-900)]">
                                {property.reviews[0].reviewerName}
                              </p>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < property.reviews![0].rating
                                        ? 'text-[var(--casita-orange)] fill-[var(--casita-orange)]'
                                        : 'text-[var(--casita-gray-300)]'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-[var(--casita-gray-600)] text-sm line-clamp-2">
                            "{property.reviews[0].content}"
                          </p>
                          {property.reviews.length > 1 && (
                            <p className="text-[var(--casita-gray-500)] text-xs mt-2">
                              +{property.reviews.length - 1} more reviews
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Full Booking Widget */}
                  <div className="lg:col-span-1">
                    <BookingWidget
                      listingId={property.id}
                      pricePerNight={property.price.perNight}
                      currency={property.price.currency}
                      maxGuests={property.maxGuests}
                      rating={property.rating}
                      reviewCount={property.reviewCount}
                      propertyName={property.name}
                      propertyImage={property.images[0] || ''}
                      propertySlug={property.slug || property.id}
                      propertyLocation={`${property.location.city}, ${property.location.country === 'United States' ? 'FL' : property.location.country}`}
                      initialCheckIn={initialCheckIn}
                      initialCheckOut={initialCheckOut}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
