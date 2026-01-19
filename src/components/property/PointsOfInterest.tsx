'use client';

import { useMemo } from 'react';
import {
  Plane,
  Building2,
  Waves,
  ShoppingBag,
  TreePalm,
  LandPlot,
  Ship,
  Palmtree,
  UtensilsCrossed,
  Music,
  GraduationCap,
  Stethoscope,
  Car,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface PointOfInterest {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  icon: LucideIcon;
  category: 'airport' | 'sports' | 'beach' | 'shopping' | 'attraction' | 'area' | 'dining' | 'culture' | 'medical' | 'transport';
}

// Points of interest organized by region/city
const POINTS_OF_INTEREST_BY_REGION: Record<string, PointOfInterest[]> = {
  // South Florida / Miami region
  'miami': [
    { id: 'mia', name: 'Miami International Airport', shortName: 'MIA Airport', lat: 25.7959, lng: -80.2870, icon: Plane, category: 'airport' },
    { id: 'fll', name: 'Fort Lauderdale Airport', shortName: 'FLL Airport', lat: 26.0726, lng: -80.1527, icon: Plane, category: 'airport' },
    { id: 'kaseya', name: 'Kaseya Center (Miami Heat)', shortName: 'Kaseya Center', lat: 25.7814, lng: -80.1870, icon: Building2, category: 'sports' },
    { id: 'hardrock', name: 'Hard Rock Stadium', shortName: 'Hard Rock Stadium', lat: 25.9580, lng: -80.2389, icon: Building2, category: 'sports' },
    { id: 'south-beach', name: 'South Beach', shortName: 'South Beach', lat: 25.7826, lng: -80.1341, icon: Waves, category: 'beach' },
    { id: 'bal-harbour-shops', name: 'Bal Harbour Shops', shortName: 'Bal Harbour Shops', lat: 25.8920, lng: -80.1252, icon: ShoppingBag, category: 'shopping' },
    { id: 'aventura-mall', name: 'Aventura Mall', shortName: 'Aventura Mall', lat: 25.9573, lng: -80.1425, icon: ShoppingBag, category: 'shopping' },
    { id: 'wynwood', name: 'Wynwood Arts District', shortName: 'Wynwood', lat: 25.8009, lng: -80.1991, icon: TreePalm, category: 'attraction' },
    { id: 'downtown-miami', name: 'Downtown Miami', shortName: 'Downtown Miami', lat: 25.7751, lng: -80.1947, icon: Building2, category: 'area' },
    { id: 'bayside', name: 'Bayside Marketplace', shortName: 'Bayside Marketplace', lat: 25.7783, lng: -80.1860, icon: Ship, category: 'shopping' },
    { id: 'vizcaya', name: 'Vizcaya Museum & Gardens', shortName: 'Vizcaya Museum', lat: 25.7443, lng: -80.2104, icon: Palmtree, category: 'attraction' },
    { id: 'lincoln-road', name: 'Lincoln Road Mall', shortName: 'Lincoln Road', lat: 25.7906, lng: -80.1389, icon: ShoppingBag, category: 'shopping' },
    { id: 'perez-art', name: 'Pérez Art Museum Miami', shortName: 'PAMM', lat: 25.7859, lng: -80.1863, icon: LandPlot, category: 'culture' },
    { id: 'brickell', name: 'Brickell City Centre', shortName: 'Brickell', lat: 25.7659, lng: -80.1917, icon: Building2, category: 'area' },
    { id: 'design-district', name: 'Miami Design District', shortName: 'Design District', lat: 25.8127, lng: -80.1926, icon: ShoppingBag, category: 'shopping' },
    { id: 'little-havana', name: 'Little Havana', shortName: 'Little Havana', lat: 25.7654, lng: -80.2193, icon: UtensilsCrossed, category: 'dining' },
    { id: 'port-miami', name: 'Port of Miami', shortName: 'Port Miami', lat: 25.7742, lng: -80.1656, icon: Ship, category: 'transport' },
  ],
  // Fort Lauderdale region
  'fort lauderdale': [
    { id: 'fll', name: 'Fort Lauderdale Airport', shortName: 'FLL Airport', lat: 26.0726, lng: -80.1527, icon: Plane, category: 'airport' },
    { id: 'mia', name: 'Miami International Airport', shortName: 'MIA Airport', lat: 25.7959, lng: -80.2870, icon: Plane, category: 'airport' },
    { id: 'ft-beach', name: 'Fort Lauderdale Beach', shortName: 'Ft. Lauderdale Beach', lat: 26.1180, lng: -80.1055, icon: Waves, category: 'beach' },
    { id: 'las-olas', name: 'Las Olas Boulevard', shortName: 'Las Olas Blvd', lat: 26.1193, lng: -80.1350, icon: ShoppingBag, category: 'shopping' },
    { id: 'galleria', name: 'Galleria Fort Lauderdale', shortName: 'The Galleria', lat: 26.1536, lng: -80.1220, icon: ShoppingBag, category: 'shopping' },
    { id: 'sawgrass', name: 'Sawgrass Mills', shortName: 'Sawgrass Mills', lat: 26.1514, lng: -80.3227, icon: ShoppingBag, category: 'shopping' },
    { id: 'port-everglades', name: 'Port Everglades', shortName: 'Port Everglades', lat: 26.0887, lng: -80.1152, icon: Ship, category: 'transport' },
    { id: 'nsu-art', name: 'NSU Art Museum', shortName: 'NSU Art Museum', lat: 26.1198, lng: -80.1451, icon: LandPlot, category: 'culture' },
    { id: 'riverwalk', name: 'Riverwalk Fort Lauderdale', shortName: 'Riverwalk', lat: 26.1193, lng: -80.1453, icon: TreePalm, category: 'attraction' },
    { id: 'downtown-ftl', name: 'Downtown Fort Lauderdale', shortName: 'Downtown', lat: 26.1224, lng: -80.1373, icon: Building2, category: 'area' },
    { id: 'hardrock', name: 'Hard Rock Stadium', shortName: 'Hard Rock Stadium', lat: 25.9580, lng: -80.2389, icon: Building2, category: 'sports' },
  ],
  // West Palm Beach region
  'west palm beach': [
    { id: 'pbi', name: 'Palm Beach International Airport', shortName: 'PBI Airport', lat: 26.6832, lng: -80.0956, icon: Plane, category: 'airport' },
    { id: 'fll', name: 'Fort Lauderdale Airport', shortName: 'FLL Airport', lat: 26.0726, lng: -80.1527, icon: Plane, category: 'airport' },
    { id: 'worth-ave', name: 'Worth Avenue', shortName: 'Worth Avenue', lat: 26.7040, lng: -80.0369, icon: ShoppingBag, category: 'shopping' },
    { id: 'clematis', name: 'Clematis Street', shortName: 'Clematis Street', lat: 26.7153, lng: -80.0534, icon: UtensilsCrossed, category: 'dining' },
    { id: 'city-place', name: 'Rosemary Square', shortName: 'Rosemary Square', lat: 26.7068, lng: -80.0575, icon: ShoppingBag, category: 'shopping' },
    { id: 'palm-beach', name: 'Palm Beach Island', shortName: 'Palm Beach', lat: 26.7056, lng: -80.0364, icon: Waves, category: 'beach' },
    { id: 'norton', name: 'Norton Museum of Art', shortName: 'Norton Museum', lat: 26.7102, lng: -80.0564, icon: LandPlot, category: 'culture' },
    { id: 'gardens-mall', name: 'The Gardens Mall', shortName: 'Gardens Mall', lat: 26.8405, lng: -80.0875, icon: ShoppingBag, category: 'shopping' },
    { id: 'downtown-wpb', name: 'Downtown West Palm Beach', shortName: 'Downtown', lat: 26.7153, lng: -80.0534, icon: Building2, category: 'area' },
  ],
  // Orlando region
  'orlando': [
    { id: 'mco', name: 'Orlando International Airport', shortName: 'MCO Airport', lat: 28.4312, lng: -81.3081, icon: Plane, category: 'airport' },
    { id: 'disney', name: 'Walt Disney World', shortName: 'Disney World', lat: 28.3852, lng: -81.5639, icon: TreePalm, category: 'attraction' },
    { id: 'universal', name: 'Universal Studios', shortName: 'Universal Studios', lat: 28.4750, lng: -81.4664, icon: Music, category: 'attraction' },
    { id: 'seaworld', name: 'SeaWorld Orlando', shortName: 'SeaWorld', lat: 28.4112, lng: -81.4612, icon: Waves, category: 'attraction' },
    { id: 'icon-park', name: 'ICON Park', shortName: 'ICON Park', lat: 28.4430, lng: -81.4685, icon: Building2, category: 'attraction' },
    { id: 'int-drive', name: 'International Drive', shortName: 'I-Drive', lat: 28.4440, lng: -81.4710, icon: ShoppingBag, category: 'shopping' },
    { id: 'mall-millennia', name: 'Mall at Millennia', shortName: 'Mall at Millennia', lat: 28.4850, lng: -81.4300, icon: ShoppingBag, category: 'shopping' },
    { id: 'amway', name: 'Amway Center', shortName: 'Amway Center', lat: 28.5392, lng: -81.3839, icon: Building2, category: 'sports' },
    { id: 'downtown-orlando', name: 'Downtown Orlando', shortName: 'Downtown', lat: 28.5383, lng: -81.3792, icon: Building2, category: 'area' },
  ],
  // Tampa region
  'tampa': [
    { id: 'tpa', name: 'Tampa International Airport', shortName: 'TPA Airport', lat: 27.9755, lng: -82.5332, icon: Plane, category: 'airport' },
    { id: 'busch-gardens', name: 'Busch Gardens Tampa', shortName: 'Busch Gardens', lat: 28.0373, lng: -82.4214, icon: TreePalm, category: 'attraction' },
    { id: 'raymond-james', name: 'Raymond James Stadium', shortName: 'Raymond James', lat: 27.9759, lng: -82.5033, icon: Building2, category: 'sports' },
    { id: 'amalie', name: 'Amalie Arena', shortName: 'Amalie Arena', lat: 27.9426, lng: -82.4519, icon: Building2, category: 'sports' },
    { id: 'ybor', name: 'Ybor City', shortName: 'Ybor City', lat: 27.9606, lng: -82.4373, icon: UtensilsCrossed, category: 'dining' },
    { id: 'intl-plaza', name: 'International Plaza', shortName: 'International Plaza', lat: 27.9597, lng: -82.5221, icon: ShoppingBag, category: 'shopping' },
    { id: 'riverwalk-tampa', name: 'Tampa Riverwalk', shortName: 'Riverwalk', lat: 27.9448, lng: -82.4593, icon: TreePalm, category: 'attraction' },
    { id: 'downtown-tampa', name: 'Downtown Tampa', shortName: 'Downtown', lat: 27.9506, lng: -82.4572, icon: Building2, category: 'area' },
    { id: 'clearwater', name: 'Clearwater Beach', shortName: 'Clearwater Beach', lat: 27.9778, lng: -82.8276, icon: Waves, category: 'beach' },
  ],
  // Naples / Southwest Florida
  'naples': [
    { id: 'rsw', name: 'Southwest Florida Airport', shortName: 'RSW Airport', lat: 26.5362, lng: -81.7552, icon: Plane, category: 'airport' },
    { id: 'mia', name: 'Miami International Airport', shortName: 'MIA Airport', lat: 25.7959, lng: -80.2870, icon: Plane, category: 'airport' },
    { id: 'fifth-ave', name: 'Fifth Avenue South', shortName: 'Fifth Ave South', lat: 26.1420, lng: -81.7984, icon: ShoppingBag, category: 'shopping' },
    { id: 'naples-pier', name: 'Naples Pier', shortName: 'Naples Pier', lat: 26.1320, lng: -81.8076, icon: Waves, category: 'beach' },
    { id: 'third-street', name: 'Third Street South', shortName: 'Third Street', lat: 26.1362, lng: -81.7961, icon: UtensilsCrossed, category: 'dining' },
    { id: 'waterside', name: 'Waterside Shops', shortName: 'Waterside Shops', lat: 26.2076, lng: -81.8062, icon: ShoppingBag, category: 'shopping' },
    { id: 'downtown-naples', name: 'Downtown Naples', shortName: 'Downtown', lat: 26.1420, lng: -81.7948, icon: Building2, category: 'area' },
    { id: 'marco-island', name: 'Marco Island', shortName: 'Marco Island', lat: 25.9424, lng: -81.7184, icon: Waves, category: 'beach' },
  ],
  // Key West / Florida Keys
  'key west': [
    { id: 'eyw', name: 'Key West International Airport', shortName: 'EYW Airport', lat: 24.5561, lng: -81.7596, icon: Plane, category: 'airport' },
    { id: 'mia', name: 'Miami International Airport', shortName: 'MIA Airport', lat: 25.7959, lng: -80.2870, icon: Plane, category: 'airport' },
    { id: 'duval', name: 'Duval Street', shortName: 'Duval Street', lat: 24.5583, lng: -81.8018, icon: Music, category: 'attraction' },
    { id: 'mallory', name: 'Mallory Square', shortName: 'Mallory Square', lat: 24.5597, lng: -81.8077, icon: TreePalm, category: 'attraction' },
    { id: 'southernmost', name: 'Southernmost Point', shortName: 'Southernmost Point', lat: 24.5466, lng: -81.7982, icon: Palmtree, category: 'attraction' },
    { id: 'fort-zachary', name: 'Fort Zachary Beach', shortName: 'Fort Zachary Beach', lat: 24.5453, lng: -81.8113, icon: Waves, category: 'beach' },
    { id: 'hemingway', name: 'Hemingway Home', shortName: 'Hemingway Home', lat: 24.5511, lng: -81.8004, icon: LandPlot, category: 'culture' },
  ],
  // Default fallback (generic US)
  'default': [
    { id: 'airport', name: 'Nearest Airport', shortName: 'Airport', lat: 0, lng: 0, icon: Plane, category: 'airport' },
    { id: 'downtown', name: 'Downtown', shortName: 'Downtown', lat: 0, lng: 0, icon: Building2, category: 'area' },
  ],
};

// City name variations mapping to regions
const CITY_TO_REGION: Record<string, string> = {
  // Miami area
  'miami': 'miami',
  'miami beach': 'miami',
  'south beach': 'miami',
  'bal harbour': 'miami',
  'sunny isles': 'miami',
  'sunny isles beach': 'miami',
  'aventura': 'miami',
  'coral gables': 'miami',
  'coconut grove': 'miami',
  'brickell': 'miami',
  'downtown miami': 'miami',
  'north miami': 'miami',
  'north miami beach': 'miami',
  'key biscayne': 'miami',
  'doral': 'miami',
  'miami shores': 'miami',
  'surfside': 'miami',
  'golden beach': 'miami',
  'fisher island': 'miami',
  'star island': 'miami',
  // Fort Lauderdale area
  'fort lauderdale': 'fort lauderdale',
  'ft. lauderdale': 'fort lauderdale',
  'ft lauderdale': 'fort lauderdale',
  'hollywood': 'fort lauderdale',
  'hallandale': 'fort lauderdale',
  'hallandale beach': 'fort lauderdale',
  'pompano beach': 'fort lauderdale',
  'deerfield beach': 'fort lauderdale',
  'lauderdale by the sea': 'fort lauderdale',
  'lauderdale-by-the-sea': 'fort lauderdale',
  'wilton manors': 'fort lauderdale',
  'oakland park': 'fort lauderdale',
  'lighthouse point': 'fort lauderdale',
  // West Palm Beach area
  'west palm beach': 'west palm beach',
  'palm beach': 'west palm beach',
  'palm beach gardens': 'west palm beach',
  'jupiter': 'west palm beach',
  'boca raton': 'west palm beach',
  'delray beach': 'west palm beach',
  'boynton beach': 'west palm beach',
  'lake worth': 'west palm beach',
  'wellington': 'west palm beach',
  // Orlando area
  'orlando': 'orlando',
  'kissimmee': 'orlando',
  'lake buena vista': 'orlando',
  'winter park': 'orlando',
  'celebration': 'orlando',
  // Tampa area
  'tampa': 'tampa',
  'st. petersburg': 'tampa',
  'st petersburg': 'tampa',
  'clearwater': 'tampa',
  'clearwater beach': 'tampa',
  'sarasota': 'tampa',
  'bradenton': 'tampa',
  // Naples area
  'naples': 'naples',
  'marco island': 'naples',
  'bonita springs': 'naples',
  'estero': 'naples',
  'fort myers': 'naples',
  'ft myers': 'naples',
  'cape coral': 'naples',
  'sanibel': 'naples',
  'sanibel island': 'naples',
  // Key West / Keys
  'key west': 'key west',
  'key largo': 'key west',
  'islamorada': 'key west',
  'marathon': 'key west',
  'florida keys': 'key west',
  'keys': 'key west',
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Estimate driving time based on distance
function estimateDriveTime(distanceMiles: number): number {
  // More realistic estimates based on distance
  if (distanceMiles < 5) {
    return Math.round((distanceMiles / 20) * 60); // Slower for short distances (traffic)
  } else if (distanceMiles < 20) {
    return Math.round((distanceMiles / 30) * 60); // Moderate speed
  } else {
    return Math.round((distanceMiles / 45) * 60); // Highway speeds for longer distances
  }
}

// Format distance for display
function formatDistance(miles: number): string {
  if (miles < 1) {
    return `${Math.round(miles * 10) / 10} mi`;
  }
  return `${Math.round(miles)} mi`;
}

// Format time for display
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}

interface PointsOfInterestProps {
  lat: number;
  lng: number;
  city: string;
  maxItems?: number;
}

export default function PointsOfInterest({
  lat,
  lng,
  city,
  maxItems = 8,
}: PointsOfInterestProps) {
  // Determine the region based on city name
  const region = useMemo(() => {
    const normalizedCity = city.toLowerCase().trim();
    return CITY_TO_REGION[normalizedCity] || 'miami'; // Default to Miami if city not found
  }, [city]);

  // Get points of interest for this region
  const regionPOIs = POINTS_OF_INTEREST_BY_REGION[region] || POINTS_OF_INTEREST_BY_REGION['miami'];

  // Calculate distances and sort by proximity
  const nearbyPlaces = useMemo(() => {
    const places = regionPOIs.map(poi => {
      const distance = calculateDistance(lat, lng, poi.lat, poi.lng);
      const driveTime = estimateDriveTime(distance);
      return { ...poi, distance, driveTime };
    });

    // Sort by distance and take top items
    return places
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxItems);
  }, [lat, lng, regionPOIs, maxItems]);

  // Group by category for better organization
  const groupedPlaces = useMemo(() => {
    const groups: Record<string, typeof nearbyPlaces> = {};

    // Ensure airports are always shown first
    const airports = nearbyPlaces.filter(p => p.category === 'airport');
    const others = nearbyPlaces.filter(p => p.category !== 'airport');

    if (airports.length > 0) {
      groups['Getting There'] = airports;
    }

    const attractions = others.filter(p =>
      ['sports', 'attraction', 'area', 'culture'].includes(p.category)
    );
    if (attractions.length > 0) {
      groups['Attractions & Entertainment'] = attractions;
    }

    const shopping = others.filter(p => p.category === 'shopping');
    if (shopping.length > 0) {
      groups['Shopping'] = shopping;
    }

    const beaches = others.filter(p => p.category === 'beach');
    if (beaches.length > 0) {
      groups['Beaches'] = beaches;
    }

    const dining = others.filter(p => p.category === 'dining');
    if (dining.length > 0) {
      groups['Dining & Nightlife'] = dining;
    }

    const transport = others.filter(p => p.category === 'transport');
    if (transport.length > 0) {
      groups['Transportation'] = transport;
    }

    return groups;
  }, [nearbyPlaces]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedPlaces).map(([groupName, places]) => (
        <div key={groupName}>
          <h4 className="text-sm font-semibold text-[var(--casita-gray-500)] uppercase tracking-wide mb-3">
            {groupName}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {places.map(place => {
              const Icon = place.icon;
              return (
                <div
                  key={place.id}
                  className="flex items-center gap-3 p-3 bg-[var(--casita-gray-50)] rounded-xl"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-[var(--casita-orange)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--casita-gray-900)] text-sm truncate">
                      {place.shortName}
                    </p>
                    <p className="text-xs text-[var(--casita-gray-500)]">
                      {formatDistance(place.distance)} • {formatTime(place.driveTime)} drive
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
