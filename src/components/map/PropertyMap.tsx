'use client';

import { useEffect, useState } from 'react';
import { Property } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

export default function PropertyMap({ properties, onPropertySelect }: PropertyMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    properties: Property[];
    onPropertySelect?: (property: Property) => void;
    formatPrice: (price: number) => string;
  }> | null>(null);
  const { formatPrice } = useLocale();

  useEffect(() => {
    // Dynamically import Google Maps component on client side only
    import('./GoogleMapsListing').then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="bg-[var(--casita-gray-200)] rounded-2xl h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-[var(--casita-gray-500)]">Loading map...</div>
      </div>
    );
  }

  return <MapComponent properties={properties} onPropertySelect={onPropertySelect} formatPrice={formatPrice} />;
}
