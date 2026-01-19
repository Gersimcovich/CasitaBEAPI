'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Destination } from '@/types';

interface DestinationCardProps {
  destination: Destination;
  size?: 'small' | 'medium' | 'large';
}

export default function DestinationCard({ destination, size = 'medium' }: DestinationCardProps) {
  const sizeClasses = {
    small: 'aspect-square',
    medium: 'aspect-[4/5]',
    large: 'aspect-[3/4]',
  };

  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group block relative rounded-2xl overflow-hidden img-zoom card-hover"
    >
      <div className={`relative ${sizeClasses[size]}`}>
        <Image
          src={destination.image}
          alt={destination.name}
          fill
          className="object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-white mb-1">
                {destination.name}
              </h3>
              <p className="text-white/80 text-sm mb-2">
                {destination.country}
              </p>
              <p className="text-[var(--casita-orange-light)] text-sm font-medium">
                {destination.propertyCount} boutique hotels
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-[var(--casita-orange)] transition-colors">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
