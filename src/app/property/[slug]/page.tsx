'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { Property, PropertyReview } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';
import { useCart } from '@/contexts/CartContext';
import { useCapacitor } from '@/hooks/useCapacitor';
import {
  ShoppingCart,
  Share2,
  Star,
  MapPin,
  Users,
  Bed,
  Bath,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Wind,
  Flame,
  Coffee,
  Shield,
  Loader2,
  ArrowLeft,
  Tv,
  Snowflake,
  WashingMachine,
  Refrigerator,
  Microwave,
  UtensilsCrossed,
  Sofa,
  Sun,
  Umbrella,
  Mountain,
  Trees,
  Dog,
  Baby,
  Accessibility,
  Lock,
  ShieldCheck,
  Sparkles,
  Droplets,
  Bath as BathIcon,
  Building,
  Shirt,
  Thermometer,
  Armchair,
  Music,
  Gamepad2,
  BookOpen,
  Quote,
} from 'lucide-react';
import BookingWidget from '@/components/booking/BookingWidget';
import dynamic from 'next/dynamic';
import PointsOfInterest from '@/components/property/PointsOfInterest';

// Dynamic import for map to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import('@/components/property/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[var(--casita-gray-100)] rounded-2xl flex items-center justify-center">
      <p className="text-[var(--casita-gray-500)]">Loading map...</p>
    </div>
  ),
});

// Icon mapping for amenities - comprehensive Guesty amenity support
const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  // Essentials
  wifi: Wifi,
  'wi-fi': Wifi,
  internet: Wifi,
  'wireless internet': Wifi,

  // Kitchen
  kitchen: Utensils,
  'full kitchen': Utensils,
  refrigerator: Refrigerator,
  fridge: Refrigerator,
  microwave: Microwave,
  oven: Flame,
  stove: Flame,
  dishwasher: Sparkles,
  'coffee maker': Coffee,
  'coffee machine': Coffee,
  toaster: UtensilsCrossed,
  'cooking basics': UtensilsCrossed,

  // Climate
  'air conditioning': Wind,
  'air-conditioning': Wind,
  ac: Wind,
  heating: Flame,
  fireplace: Flame,
  'indoor fireplace': Flame,
  fan: Wind,

  // Parking & Transport
  parking: Car,
  'free parking': Car,
  'street parking': Car,
  garage: Car,

  // Entertainment
  tv: Tv,
  television: Tv,
  'cable tv': Tv,
  netflix: Tv,
  streaming: Tv,
  'smart tv': Tv,
  'game room': Gamepad2,
  games: Gamepad2,
  books: BookOpen,
  'board games': Gamepad2,
  'sound system': Music,

  // Outdoor
  pool: Waves,
  'swimming pool': Waves,
  'private pool': Waves,
  'hot tub': Droplets,
  jacuzzi: Droplets,
  'outdoor shower': Droplets,
  bbq: Flame,
  grill: Flame,
  'bbq grill': Flame,
  patio: Sun,
  balcony: Sun,
  terrace: Sun,
  deck: Sun,
  garden: Trees,
  yard: Trees,
  'outdoor furniture': Armchair,
  'beach access': Umbrella,
  'beach chairs': Umbrella,
  beachfront: Umbrella,
  'ocean view': Waves,
  'sea view': Waves,
  'beach view': Umbrella,
  'mountain view': Mountain,

  // Laundry
  washer: WashingMachine,
  dryer: WashingMachine,
  'washer/dryer': WashingMachine,
  laundry: WashingMachine,
  iron: Thermometer,
  'ironing board': Thermometer,

  // Bathroom
  'hair dryer': Wind,
  hairdryer: Wind,
  'hot water': Droplets,
  bathtub: BathIcon,
  shower: Droplets,
  'rain shower': Droplets,
  toiletries: Sparkles,
  towels: Shirt,

  // Fitness & Wellness
  gym: Dumbbell,
  'fitness center': Dumbbell,
  'fitness room': Dumbbell,
  spa: Sparkles,
  sauna: Droplets,

  // Services
  restaurant: Utensils,
  bar: Coffee,
  'room service': Coffee,
  'room-service': Coffee,
  concierge: Building,
  'front desk': Building,
  '24-hour front desk': Building,
  housekeeping: Sparkles,
  cleaning: Sparkles,

  // Family
  crib: Baby,
  'baby crib': Baby,
  'high chair': Baby,
  'baby monitor': Baby,
  'kids toys': Baby,
  childproofing: Baby,

  // Pets
  'pet friendly': Dog,
  'pets allowed': Dog,
  'dog friendly': Dog,

  // Accessibility
  elevator: Building,
  'wheelchair accessible': Accessibility,
  'step-free entry': Accessibility,
  accessible: Accessibility,

  // Safety
  'smoke detector': ShieldCheck,
  'carbon monoxide detector': ShieldCheck,
  'fire extinguisher': ShieldCheck,
  'first aid kit': ShieldCheck,
  'security cameras': Lock,
  safe: Lock,
  'security system': Lock,
  doorman: Shield,

  // Comfort
  'living room': Sofa,
  workspace: Building,
  'dedicated workspace': Building,
  desk: Building,
  'work desk': Building,
};

export default function PropertyPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t, formatPrice } = useLocale();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const { cartItem, hasCartItem } = useCart();
  const { isCapacitor, isIOS } = useCapacitor();

  // Fetch property from API
  useEffect(() => {
    async function fetchProperty() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/listings/${slug}`);
        const data = await response.json();

        if (data.success) {
          setProperty(data.data);
        } else {
          setError(data.error || 'Property not found');
        }
      } catch (err) {
        setError('Failed to load property');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProperty();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        {!isCapacitor && <Header />}
        <div className={`${isCapacitor ? 'pt-16' : 'pt-24'} flex flex-col items-center justify-center min-h-[60vh]`}>
          <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin mb-4" />
          <p className="text-[var(--casita-gray-600)]">{t.common.loading}</p>
        </div>
        {!isCapacitor && <Footer />}
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="min-h-screen bg-white">
        {!isCapacitor && <Header />}
        <div className={`${isCapacitor ? 'pt-16' : 'pt-24'} flex flex-col items-center justify-center min-h-[60vh]`}>
          <p className="text-red-500 mb-4">{error || t.common.error}</p>
          <Link href="/properties">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.property.backToAll}
            </Button>
          </Link>
        </div>
        {!isCapacitor && <Footer />}
      </main>
    );
  }

  const nextImage = () => {
    if (property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  return (
    <main className={`min-h-screen bg-white ${isCapacitor ? 'pb-20' : ''}`}>
      {!isCapacitor && <Header />}

      {/* App-style compact header with back button */}
      {isCapacitor && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--casita-gray-100)]"
          style={isIOS ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 rounded-full bg-[var(--casita-gray-100)] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--casita-gray-700)]" />
            </button>
            <h1 className="text-sm font-semibold text-[var(--casita-gray-900)] truncate max-w-[60%]">
              {property.name}
            </h1>
            <button className="w-9 h-9 rounded-full bg-[var(--casita-gray-100)] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[var(--casita-gray-700)]" />
            </button>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <section className={isCapacitor ? 'pt-0' : 'pt-20'} style={isCapacitor && isIOS ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 52px)' } : isCapacitor ? { paddingTop: '52px' } : undefined}>
        <div className={`max-w-7xl mx-auto ${isCapacitor ? 'px-0' : 'px-4 sm:px-6 lg:px-8 py-6'}`}>
          {/* Back Link - web only */}
          {!isCapacitor && (
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)] mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.property.backToAll}
            </Link>
          )}

          {/* Desktop Gallery Grid */}
          {property.images.length > 0 ? (
            <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-2xl overflow-hidden">
              <div
                className="col-span-2 row-span-2 relative cursor-pointer img-zoom"
                onClick={() => setShowGallery(true)}
              >
                <Image
                  src={property.images[0]}
                  alt={property.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {property.images.slice(1, 5).map((image, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer img-zoom"
                  onClick={() => {
                    setCurrentImageIndex(index + 1);
                    setShowGallery(true);
                  }}
                >
                  <Image
                    src={image}
                    alt={`${property.name} ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                  {index === 3 && property.images.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        +{property.images.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="hidden md:flex h-[500px] bg-[var(--casita-gray-100)] rounded-2xl items-center justify-center">
              <p className="text-[var(--casita-gray-500)]">{t.property.noImages}</p>
            </div>
          )}

          {/* Mobile Carousel */}
          {property.images.length > 0 ? (
            <div className={`md:hidden relative ${isCapacitor ? 'h-[280px]' : 'h-[300px] rounded-2xl'} overflow-hidden`}>
              <Image
                src={property.images[currentImageIndex]}
                alt={property.name}
                fill
                className="object-cover"
                priority
              />
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {property.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="md:hidden h-[300px] bg-[var(--casita-gray-100)] rounded-2xl flex items-center justify-center">
              <p className="text-[var(--casita-gray-500)]">{t.property.noImages}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-4">
            <button className="flex items-center gap-2 text-[var(--casita-gray-700)] hover:text-[var(--casita-gray-900)]">
              <Share2 className="w-5 h-5" />
              <span>{t.property.share}</span>
            </button>
            {hasCartItem && cartItem?.propertyId === property.id && (
              <div className="flex items-center gap-2 text-[var(--casita-orange)]">
                <ShoppingCart className="w-5 h-5" />
                <span>In Your Cart</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isCapacitor ? 'py-4' : 'py-8'}`}>
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className={isCapacitor ? 'mb-4' : 'mb-8'}>
              <div className="flex items-center gap-2 text-[var(--casita-gray-500)] mb-2">
                <MapPin className="w-4 h-4" />
                <span className={isCapacitor ? 'text-sm' : ''}>{property.location.city}, {property.location.country}</span>
              </div>
              <h1 className={`font-serif font-bold text-[var(--casita-gray-900)] mb-3 ${isCapacitor ? 'text-2xl' : 'text-4xl md:text-5xl mb-4'}`}>
                {property.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[var(--casita-gray-600)]">
                {property.reviewCount > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-[var(--casita-orange)] fill-[var(--casita-orange)]" />
                      <span className="font-semibold text-[var(--casita-gray-900)]">{property.rating}</span>
                      <span>({property.reviewCount} {t.property.reviews})</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Bed className="w-5 h-5" />
                  <span>{property.bedrooms} {property.bedrooms !== 1 ? t.properties.bedrooms : t.properties.bedroom}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Bath className="w-5 h-5" />
                  <span>{property.bathrooms} {property.bathrooms !== 1 ? t.properties.bathrooms : t.properties.bathroom}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>{property.maxGuests} {t.properties.guests}</span>
                </div>
              </div>
            </div>

            {/* Booking Widget - Mobile/App: inline above content */}
            <div className="lg:hidden mb-6">
              <BookingWidget
                listingId={property.id}
                pricePerNight={property.price.perNight}
                currency={property.price.currency || 'USD'}
                maxGuests={property.maxGuests}
                rating={property.rating}
                reviewCount={property.reviewCount}
                propertyName={property.name}
                propertyImage={property.images[0] || ''}
                propertySlug={property.slug || property.id}
                propertyLocation={`${property.location.city}, ${property.location.country}`}
              />
            </div>

            {/* Cute House Divider */}
            <div className={`flex items-center justify-center ${isCapacitor ? 'my-4' : 'my-8'}`}>
              <div className="h-px bg-[var(--casita-gray-200)] flex-1" />
              <Image
                src="/house-icon.png"
                alt="Casita"
                width={40}
                height={40}
                className="mx-4 opacity-50"
              />
              <div className="h-px bg-[var(--casita-gray-200)] flex-1" />
            </div>

            {/* Description */}
            {property.description && (
              <div className={isCapacitor ? 'mb-6' : 'mb-10'}>
                <h2 className={`font-serif font-semibold text-[var(--casita-gray-900)] mb-3 ${isCapacitor ? 'text-xl' : 'text-2xl mb-4'}`}>
                  {t.property.about}
                </h2>
                <p className={`text-[var(--casita-gray-600)] leading-relaxed whitespace-pre-line ${isCapacitor ? 'text-base' : 'text-lg'}`}>
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className={isCapacitor ? 'mb-6' : 'mb-10'}>
                <div className={`flex items-center justify-between ${isCapacitor ? 'mb-4' : 'mb-6'}`}>
                  <h2 className={`font-serif font-semibold text-[var(--casita-gray-900)] ${isCapacitor ? 'text-xl' : 'text-2xl'}`}>
                    {t.property.amenities}
                  </h2>
                  {property.amenities.length > 12 && (
                    <button
                      onClick={() => setShowAllAmenities(true)}
                      className="text-[var(--casita-orange)] hover:underline font-medium"
                    >
                      Show all {property.amenities.length} amenities
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.slice(0, 12).map((amenity) => {
                    const normalizedAmenity = amenity.toLowerCase().replace(/_/g, ' ');
                    const Icon = amenityIcons[normalizedAmenity] || Check;
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 p-4 bg-[var(--casita-gray-50)] rounded-xl"
                      >
                        <Icon className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
                        <span className="text-[var(--casita-gray-700)] capitalize text-sm">
                          {amenity.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {property.amenities.length > 12 && (
                  <button
                    onClick={() => setShowAllAmenities(true)}
                    className="mt-4 px-6 py-3 border border-[var(--casita-gray-900)] rounded-xl font-medium hover:bg-[var(--casita-gray-50)] transition-colors"
                  >
                    Show all {property.amenities.length} amenities
                  </button>
                )}
              </div>
            )}

            {/* House Policies */}
            {property.policies && (
              <div className={isCapacitor ? 'mb-6' : 'mb-10'}>
                <h2 className={`font-serif font-semibold text-[var(--casita-gray-900)] ${isCapacitor ? 'text-xl mb-4' : 'text-2xl mb-6'}`}>
                  {t.property.policies}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-[var(--casita-cream)] rounded-xl">
                    <p className="font-medium text-[var(--casita-gray-900)] mb-1">{t.property.checkIn}</p>
                    <p className="text-[var(--casita-gray-600)]">{property.policies.checkIn}</p>
                  </div>
                  <div className="p-4 bg-[var(--casita-cream)] rounded-xl">
                    <p className="font-medium text-[var(--casita-gray-900)] mb-1">{t.property.checkOut}</p>
                    <p className="text-[var(--casita-gray-600)]">{property.policies.checkOut}</p>
                  </div>
                  <div className="p-4 bg-[var(--casita-cream)] rounded-xl">
                    <p className="font-medium text-[var(--casita-gray-900)] mb-1">{t.property.cancellation}</p>
                    <p className="text-[var(--casita-gray-600)] text-sm">{property.policies.cancellation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Location & Nearby */}
            {property.location.coordinates && (
              <div className={isCapacitor ? 'mb-6' : 'mb-10'}>
                <h2 className={`font-serif font-semibold text-[var(--casita-gray-900)] ${isCapacitor ? 'text-xl mb-4' : 'text-2xl mb-6'}`}>
                  {t.property.location || 'Location'}
                </h2>

                {/* Map */}
                <div className="mb-8">
                  <LocationMap
                    lat={property.location.coordinates.lat}
                    lng={property.location.coordinates.lng}
                    title={property.name}
                    city={property.location.city}
                  />
                </div>

                {/* Points of Interest */}
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[var(--casita-gray-900)] mb-4">
                    {t.property.nearby || "What's Nearby"}
                  </h3>
                  <PointsOfInterest
                    lat={property.location.coordinates.lat}
                    lng={property.location.coordinates.lng}
                    city={property.location.city}
                    maxItems={10}
                  />
                </div>
              </div>
            )}

            {/* Guest Reviews Section */}
            {property.reviews && property.reviews.length > 0 && (
              <div className={isCapacitor ? 'mb-6' : 'mb-10'}>
                <div className={`flex items-center gap-3 ${isCapacitor ? 'mb-4' : 'mb-6'}`}>
                  <h2 className={`font-serif font-semibold text-[var(--casita-gray-900)] ${isCapacitor ? 'text-xl' : 'text-2xl'}`}>
                    Guest Reviews
                  </h2>
                  <div className="flex items-center gap-1 bg-[var(--casita-orange)] text-white px-3 py-1 rounded-full text-sm">
                    <Star className="w-4 h-4 fill-white" />
                    <span className="font-medium">{property.rating}</span>
                    <span className="opacity-80">({property.reviewCount})</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {property.reviews.map((review: PropertyReview) => (
                    <div
                      key={review.id}
                      className="bg-[var(--casita-cream)] rounded-xl p-5 relative"
                    >
                      <Quote className="w-8 h-8 text-[var(--casita-orange)] opacity-20 absolute top-4 right-4" />
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[var(--casita-orange)] rounded-full flex items-center justify-center text-white font-semibold">
                          {review.reviewerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--casita-gray-900)]">
                            {review.reviewerName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-[var(--casita-gray-500)]">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? 'text-[var(--casita-orange)] fill-[var(--casita-orange)]'
                                      : 'text-[var(--casita-gray-300)]'
                                  }`}
                                />
                              ))}
                            </div>
                            <span>•</span>
                            <span>
                              {new Date(review.date).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[var(--casita-gray-600)] text-sm leading-relaxed">
                        "{review.content}"
                      </p>
                    </div>
                  ))}
                </div>

                {property.reviewCount > (property.reviews?.length || 0) && (
                  <p className="text-center text-[var(--casita-gray-500)] text-sm mt-4">
                    Showing {property.reviews.length} of {property.reviewCount} reviews
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Booking Sidebar - Desktop only (mobile version is inline above) */}
          <div className="hidden lg:block lg:col-span-1">
            <BookingWidget
              listingId={property.id}
              pricePerNight={property.price.perNight}
              currency={property.price.currency || 'USD'}
              maxGuests={property.maxGuests}
              rating={property.rating}
              reviewCount={property.reviewCount}
              propertyName={property.name}
              propertyImage={property.images[0] || ''}
              propertySlug={property.slug || property.id}
              propertyLocation={`${property.location.city}, ${property.location.country}`}
            />
          </div>
        </div>
      </section>

      {/* Fullscreen Gallery Modal */}
      {showGallery && property.images.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="relative w-full max-w-5xl h-[80vh]">
            <Image
              src={property.images[currentImageIndex]}
              alt={property.name}
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={nextImage}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentImageIndex + 1} / {property.images.length}
          </div>
        </div>
      )}

      {/* Amenities Modal */}
      {showAllAmenities && property.amenities && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[var(--casita-gray-200)]">
              <h3 className="font-serif text-2xl font-semibold text-[var(--casita-gray-900)]">
                {t.property.amenities}
              </h3>
              <button
                onClick={() => setShowAllAmenities(false)}
                className="p-2 hover:bg-[var(--casita-gray-100)] rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-[var(--casita-gray-600)]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.amenities.map((amenity) => {
                  const normalizedAmenity = amenity.toLowerCase().replace(/_/g, ' ');
                  const Icon = amenityIcons[normalizedAmenity] || Check;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-4 bg-[var(--casita-gray-50)] rounded-xl"
                    >
                      <Icon className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
                      <span className="text-[var(--casita-gray-700)] capitalize">
                        {amenity.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCapacitor && <Footer />}
    </main>
  );
}
