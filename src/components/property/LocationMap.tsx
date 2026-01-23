'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

interface LocationMapProps {
  lat: number;
  lng: number;
  title?: string;
  radiusMeters?: number; // Default half mile = ~805 meters
  city?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// Subtle, modern map style
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry.fill',
    stylers: [{ saturation: -20 }, { lightness: 10 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c8e0e8' }],
  },
];

// Fallback component when Google Maps fails to load
function MapFallback({ lat, lng, city }: { lat: number; lng: number; title?: string; city?: string }) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="w-full">
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--casita-cream)] to-[var(--casita-gray-100)]">
        {/* Beautiful gradient background with location info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center max-w-sm mx-4">
            <div className="w-16 h-16 bg-[var(--casita-orange)] rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[var(--casita-gray-900)] mb-2">
              {city || 'Property Location'}
            </h3>
            <p className="text-sm text-[var(--casita-gray-500)] mb-4">
              Approximate location shown. Exact address provided after booking.
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--casita-orange)] text-white rounded-lg font-medium hover:bg-[var(--casita-orange-dark)] transition-colors"
            >
              <Navigation className="w-4 h-4" />
              View on Google Maps
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--casita-gray-500)] mt-2 text-center">
        Exact location provided after booking
      </p>
    </div>
  );
}

export default function LocationMap({
  lat,
  lng,
  title = 'Property Location',
  radiusMeters = 805, // Half mile in meters
  city,
}: LocationMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [offsetCenter, setOffsetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-script',
  });

  useEffect(() => {
    setIsMounted(true);
    // Slightly offset the center to protect exact location (random offset within ~200m)
    setOffsetCenter({
      lat: lat + (Math.random() - 0.5) * 0.002,
      lng: lng + (Math.random() - 0.5) * 0.002,
    });
  }, [lat, lng]);

  const onLoad = useCallback((map: google.maps.Map) => {
    // Map loaded successfully
  }, []);

  const onError = useCallback(() => {
    setMapError(true);
  }, []);

  // Don't render on server side
  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-[var(--casita-gray-100)] rounded-2xl flex items-center justify-center">
        <p className="text-[var(--casita-gray-500)]">Loading map...</p>
      </div>
    );
  }

  // Show fallback if there's an error or no API key
  if (loadError || mapError || !apiKey) {
    return <MapFallback lat={lat} lng={lng} title={title} city={city} />;
  }

  if (!isLoaded || !offsetCenter) {
    return (
      <div className="w-full h-[400px] bg-[var(--casita-gray-100)] rounded-2xl flex items-center justify-center animate-pulse">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-[var(--casita-orange)] mx-auto mb-2" />
          <p className="text-[var(--casita-gray-500)]">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={offsetCenter}
          zoom={14}
          onLoad={onLoad}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            scrollwheel: false,
          }}
        >
          <Circle
            center={offsetCenter}
            radius={radiusMeters}
            options={{
              strokeColor: '#e07a5f',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#e07a5f',
              fillOpacity: 0.15,
            }}
          />
        </GoogleMap>
      </div>
      <p className="text-sm text-[var(--casita-gray-500)] mt-2 text-center">
        Exact location provided after booking
      </p>
    </div>
  );
}
