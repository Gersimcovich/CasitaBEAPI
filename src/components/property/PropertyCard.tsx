'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, ChevronLeft, ChevronRight, MapPin, Waves } from 'lucide-react';
import { Property } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface PropertyCardProps {
  property: Property;
  showMap?: boolean;
}

export default function PropertyCard({ property, showMap = false }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { formatPrice, t } = useLocale();

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

  return (
    <Link
      href={`/property/${property.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {property.isBeachfront && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                <Waves className="w-3 h-3" />
                Beachfront
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
          {/* Location & Rating */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-[var(--casita-gray-500)] text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{property.location.city}, {property.location.country}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-[var(--casita-orange)] fill-[var(--casita-orange)] mr-1" />
              <span className="font-semibold text-[var(--casita-gray-900)]">{property.rating}</span>
              <span className="text-[var(--casita-gray-500)] text-sm ml-1">({property.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif text-xl font-semibold text-[var(--casita-gray-900)] mb-1 group-hover:text-[var(--casita-orange)] transition-colors line-clamp-1">
            {property.name}
          </h3>

          {/* Description */}
          <p className="text-[var(--casita-gray-500)] text-sm mb-3 line-clamp-2">
            {property.shortDescription}
          </p>

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
            <span className="text-2xl font-semibold text-[var(--casita-gray-900)]">
              {formatPrice(property.price.perNight)}
            </span>
            <span className="text-[var(--casita-gray-500)] ml-1">/ {t.properties.perNight}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
