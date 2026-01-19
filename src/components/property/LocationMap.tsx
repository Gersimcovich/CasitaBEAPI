'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  lat: number;
  lng: number;
  title?: string;
  radiusMeters?: number; // Default half mile = ~805 meters
}

// Component to handle map center updates
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);

  return null;
}

export default function LocationMap({
  lat,
  lng,
  title = 'Property Location',
  radiusMeters = 805 // Half mile in meters
}: LocationMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server side
  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-[var(--casita-gray-100)] rounded-2xl flex items-center justify-center">
        <p className="text-[var(--casita-gray-500)]">Loading map...</p>
      </div>
    );
  }

  // Slightly offset the center to protect exact location (random offset within ~200m)
  const offsetLat = lat + (Math.random() - 0.5) * 0.002;
  const offsetLng = lng + (Math.random() - 0.5) * 0.002;

  return (
    <div className="w-full">
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
        <MapContainer
          center={[offsetLat, offsetLng]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <Circle
            center={[offsetLat, offsetLng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#e07a5f',
              fillColor: '#e07a5f',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
          <MapUpdater lat={offsetLat} lng={offsetLng} />
        </MapContainer>
      </div>
      <p className="text-sm text-[var(--casita-gray-500)] mt-2 text-center">
        Exact location provided after booking
      </p>
    </div>
  );
}
