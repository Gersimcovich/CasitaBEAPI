'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { Property } from '@/types';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
  formatPrice: (price: number) => string;
}

// Create a custom price marker
function createPriceMarker(price: string): DivIcon {
  return new DivIcon({
    className: 'custom-price-marker',
    html: `<div class="bg-white px-2 py-1 rounded-full shadow-lg border border-gray-200 font-semibold text-sm whitespace-nowrap hover:bg-[var(--casita-orange)] hover:text-white transition-colors cursor-pointer">${price}</div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
}

export default function LeafletMap({ properties, onPropertySelect, formatPrice }: LeafletMapProps) {
  // Calculate center from all properties or default to Miami
  const validProperties = properties.filter(
    p => p.location.coordinates.lat !== 0 && p.location.coordinates.lng !== 0
  );

  const center = validProperties.length > 0
    ? {
        lat: validProperties.reduce((sum, p) => sum + p.location.coordinates.lat, 0) / validProperties.length,
        lng: validProperties.reduce((sum, p) => sum + p.location.coordinates.lng, 0) / validProperties.length,
      }
    : { lat: 25.7617, lng: -80.1918 }; // Default to Miami

  return (
    <div className="h-[600px] rounded-2xl overflow-hidden">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.location.coordinates.lat, property.location.coordinates.lng]}
            icon={createPriceMarker(formatPrice(property.price.perNight))}
            eventHandlers={{
              click: () => onPropertySelect?.(property),
            }}
          >
            <Popup>
              <Link href={`/property/${property.slug}`} className="block w-64">
                {property.images[0] && (
                  <div className="relative h-32 mb-2 rounded-lg overflow-hidden">
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {property.location.address?.split(',')[0] || property.location.city}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{property.location.city}</p>
                <p className="font-semibold text-[var(--casita-orange)]">
                  {formatPrice(property.price.perNight)} / night
                </p>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
