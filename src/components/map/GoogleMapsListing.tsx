'use client';

import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow } from '@react-google-maps/api';
import { Property } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ExternalLink } from 'lucide-react';

interface GoogleMapsListingProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
  formatPrice: (price: number) => string;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
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

// Price marker component
function PriceMarker({
  price,
  isSelected,
  onClick
}: {
  price: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full shadow-lg font-semibold text-sm whitespace-nowrap cursor-pointer transition-all transform hover:scale-110 ${
        isSelected
          ? 'bg-[var(--casita-orange)] text-white scale-110'
          : 'bg-white text-[var(--casita-gray-900)] border border-gray-200 hover:bg-[var(--casita-orange)] hover:text-white hover:border-transparent'
      }`}
    >
      {price}
    </div>
  );
}

export default function GoogleMapsListing({
  properties,
  onPropertySelect,
  formatPrice
}: GoogleMapsListingProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script',
  });

  // Calculate center from all properties or default to Miami
  const validProperties = properties.filter(
    (p) => p.location.coordinates.lat !== 0 && p.location.coordinates.lng !== 0
  );

  const center = validProperties.length > 0
    ? {
        lat: validProperties.reduce((sum, p) => sum + p.location.coordinates.lat, 0) / validProperties.length,
        lng: validProperties.reduce((sum, p) => sum + p.location.coordinates.lng, 0) / validProperties.length,
      }
    : { lat: 25.7617, lng: -80.1918 }; // Default to Miami

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Fit bounds to show all markers if we have properties
    if (validProperties.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      validProperties.forEach((property) => {
        bounds.extend({
          lat: property.location.coordinates.lat,
          lng: property.location.coordinates.lng,
        });
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [validProperties]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = (property: Property) => {
    setSelectedProperty(property);
    onPropertySelect?.(property);
  };

  // Fallback component when map fails to load
  const MapFallback = () => {
    // Get approximate center for static map
    const centerLat = center.lat.toFixed(4);
    const centerLng = center.lng.toFixed(4);
    const googleMapsUrl = `https://www.google.com/maps/search/vacation+rentals/@${centerLat},${centerLng},12z`;

    return (
      <div className="h-[600px] rounded-2xl bg-gradient-to-br from-[var(--casita-gray-50)] to-[var(--casita-gray-100)] flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-[var(--casita-orange)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-[var(--casita-orange)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-2">
            {validProperties.length} Properties Available
          </h3>
          <p className="text-[var(--casita-gray-500)] mb-6">
            Browse properties in the list below or view them on Google Maps
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--casita-orange)] text-white rounded-full font-medium hover:bg-opacity-90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Maps
          </a>

          {/* Show property locations as a simple list */}
          {validProperties.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--casita-gray-100)]">
              <p className="text-sm text-[var(--casita-gray-500)] mb-3">Property locations:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[...new Set(validProperties.map(p => p.location.city))].slice(0, 5).map((city, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[var(--casita-gray-100)] text-[var(--casita-gray-600)] rounded-full text-sm"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loadError) {
    return <MapFallback />;
  }

  if (!isLoaded) {
    return (
      <div className="h-[600px] rounded-2xl bg-[var(--casita-gray-100)] flex items-center justify-center animate-pulse">
        <p className="text-[var(--casita-gray-500)]">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-2xl overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {validProperties.map((property) => (
          <OverlayView
            key={property.id}
            position={{
              lat: property.location.coordinates.lat,
              lng: property.location.coordinates.lng,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <PriceMarker
              price={formatPrice(property.price.perNight)}
              isSelected={selectedProperty?.id === property.id}
              onClick={() => handleMarkerClick(property)}
            />
          </OverlayView>
        ))}

        {selectedProperty && (
          <InfoWindow
            position={{
              lat: selectedProperty.location.coordinates.lat,
              lng: selectedProperty.location.coordinates.lng,
            }}
            onCloseClick={() => setSelectedProperty(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -30),
            }}
          >
            <Link
              href={`/property/${selectedProperty.slug}`}
              className="block w-64 p-1"
            >
              {selectedProperty.images[0] && (
                <div className="relative h-32 mb-2 rounded-lg overflow-hidden">
                  <Image
                    src={selectedProperty.images[0]}
                    alt={selectedProperty.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                {selectedProperty.location.address?.split(',')[0] || selectedProperty.location.city}
              </h3>
              <p className="text-sm text-gray-500 mb-1">{selectedProperty.location.city}</p>
              <p className="font-semibold text-[var(--casita-orange)]">
                {formatPrice(selectedProperty.price.perNight)} / night
              </p>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
