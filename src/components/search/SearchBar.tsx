'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Users, Minus, Plus, X, DollarSign, PawPrint } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLocale } from '@/contexts/LocaleContext';

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  onSearch?: (params: SearchParams) => void;
}

interface SearchParams {
  destination: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  rooms: number;
  minPrice: number | null;
  maxPrice: number | null;
  petFriendly: boolean;
}

// Price range presets for quick selection
const PRICE_RANGES = [
  { label: 'Any', min: null, max: null },
  { label: 'Under $100', min: null, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200 - $350', min: 200, max: 350 },
  { label: '$350 - $500', min: 350, max: 500 },
  { label: '$500+', min: 500, max: null },
];

export default function SearchBar({ variant = 'hero', onSearch }: SearchBarProps) {
  const { t, formatPrice } = useLocale();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [petFriendly, setPetFriendly] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await fetch('/api/cities');
        const data = await response.json();
        if (data.success && data.data) {
          setCities(data.data);
          setFilteredCities(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
        // Fallback cities - matches actual properties
        const fallback = ['Bal Harbour', 'Kissimmee', 'Miami', 'Miami Beach', 'Puerto Iguazú'];
        setCities(fallback);
        setFilteredCities(fallback);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // Filter cities based on input
  useEffect(() => {
    if (destination.trim() === '') {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter((city) =>
        city.toLowerCase().includes(destination.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [destination, cities]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
        setShowGuestPicker(false);
        setShowPricePicker(false);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get price display text
  const getPriceDisplayText = () => {
    if (minPrice === null && maxPrice === null) return 'Any price';
    if (minPrice === null && maxPrice !== null) return `Under ${formatPrice(maxPrice)}`;
    if (minPrice !== null && maxPrice === null) return `${formatPrice(minPrice)}+`;
    return `${formatPrice(minPrice!)} - ${formatPrice(maxPrice!)}`;
  };

  const handleSearch = () => {
    onSearch?.({
      destination,
      checkIn,
      checkOut,
      guests,
      rooms,
      minPrice,
      maxPrice,
      petFriendly,
    });
    // Navigate to search results
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkIn) params.set('checkIn', checkIn.toISOString().split('T')[0]);
    if (checkOut) params.set('checkOut', checkOut.toISOString().split('T')[0]);
    params.set('guests', guests.toString());
    params.set('rooms', rooms.toString());
    if (minPrice !== null) params.set('minPrice', minPrice.toString());
    if (maxPrice !== null) params.set('maxPrice', maxPrice.toString());
    if (petFriendly) params.set('petFriendly', 'true');
    window.location.href = `/properties?${params.toString()}`;
  };

  const handleCitySelect = (city: string) => {
    setDestination(city);
    setShowCityDropdown(false);
    setActiveField(null);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-full shadow-lg border border-[var(--casita-gray-200)] p-2 flex items-center">
        <button className="flex-1 flex items-center px-4 py-2 text-left hover:bg-[var(--casita-gray-50)] rounded-full transition-colors">
          <span className="text-sm font-medium">{t.search.destination}</span>
        </button>
        <div className="w-px h-6 bg-[var(--casita-gray-200)]" />
        <button className="flex-1 flex items-center px-4 py-2 text-left hover:bg-[var(--casita-gray-50)] rounded-full transition-colors">
          <span className="text-sm font-medium">{t.search.addDate}</span>
        </button>
        <div className="w-px h-6 bg-[var(--casita-gray-200)]" />
        <button className="flex-1 flex items-center px-4 py-2 text-left hover:bg-[var(--casita-gray-50)] rounded-full transition-colors">
          <span className="text-sm text-[var(--casita-gray-500)]">{t.search.guests}</span>
        </button>
        <button className="p-3 bg-[var(--casita-orange)] text-white rounded-full hover:bg-[var(--casita-orange-dark)] transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 relative z-[100]" ref={searchBarRef}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[var(--casita-gray-100)]">
        {/* Row 1: Destination & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--casita-gray-100)]">
          {/* Destination */}
          <div className="relative">
            <div
              className={`p-5 cursor-pointer transition-all duration-200 ${
                activeField === 'destination'
                  ? 'bg-[var(--casita-gray-50)]'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('destination');
                setShowCityDropdown(true);
                setShowGuestPicker(false);
                setShowPricePicker(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-2">
                {t.search.destination}
              </label>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
                <input
                  type="text"
                  placeholder={t.search.destinationPlaceholder}
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => {
                    setActiveField('destination');
                    setShowCityDropdown(true);
                    setShowGuestPicker(false);
                    setShowPricePicker(false);
                  }}
                  className="flex-1 bg-transparent text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none text-base font-medium"
                />
                {destination && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDestination('');
                    }}
                    className="p-1 hover:bg-[var(--casita-gray-200)] rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-[var(--casita-gray-500)]" />
                  </button>
                )}
              </div>
            </div>

            {/* City Dropdown */}
            {showCityDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-[var(--casita-gray-100)] max-h-80 overflow-y-auto z-[200] animate-scale-in">
                {isLoadingCities ? (
                  <div className="p-4 text-center text-[var(--casita-gray-500)]">
                    Loading cities...
                  </div>
                ) : filteredCities.length > 0 ? (
                  <ul className="py-1">
                    {filteredCities.map((city) => (
                      <li key={city}>
                        <button
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-3 text-left hover:bg-[var(--casita-gray-50)] flex items-center gap-3 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-[var(--casita-orange)]" />
                          <span className="text-[var(--casita-gray-800)] font-medium">{city}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-[var(--casita-gray-500)]">
                    No cities found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Check-in */}
          <div
            className={`p-5 cursor-pointer transition-all duration-200 ${
              activeField === 'checkin'
                ? 'bg-[var(--casita-gray-50)]'
                : 'hover:bg-[var(--casita-gray-50)]'
            }`}
            onClick={() => {
              setActiveField('checkin');
              setShowCityDropdown(false);
              setShowGuestPicker(false);
              setShowPricePicker(false);
            }}
          >
            <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-2">
              {t.search.checkIn}
            </label>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
              <DatePicker
                selected={checkIn}
                onChange={(date: Date | null) => {
                  setCheckIn(date);
                  // Auto-adjust checkout if it's on or before the new check-in
                  if (date && checkOut && checkOut <= date) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOut(nextDay);
                  }
                  // If no checkout is set, auto-set it to the next day
                  if (date && !checkOut) {
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOut(nextDay);
                  }
                }}
                selectsStart
                startDate={checkIn}
                endDate={checkOut}
                minDate={new Date()}
                placeholderText={t.search.addDate}
                className="w-full bg-transparent text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none text-base font-medium cursor-pointer"
                dateFormat="MMM d, yyyy"
                onFocus={() => {
                  setActiveField('checkin');
                  setShowCityDropdown(false);
                  setShowGuestPicker(false);
                  setShowPricePicker(false);
                }}
              />
            </div>
          </div>

          {/* Check-out */}
          <div
            className={`p-5 cursor-pointer transition-all duration-200 ${
              activeField === 'checkout'
                ? 'bg-[var(--casita-gray-50)]'
                : 'hover:bg-[var(--casita-gray-50)]'
            }`}
            onClick={() => {
              setActiveField('checkout');
              setShowCityDropdown(false);
              setShowGuestPicker(false);
              setShowPricePicker(false);
            }}
          >
            <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-2">
              {t.search.checkOut}
            </label>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
              <DatePicker
                selected={checkOut}
                onChange={(date: Date | null) => setCheckOut(date)}
                selectsEnd
                startDate={checkIn}
                endDate={checkOut}
                minDate={checkIn || new Date()}
                placeholderText={t.search.addDate}
                className="w-full bg-transparent text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none text-base font-medium cursor-pointer"
                dateFormat="MMM d, yyyy"
                onFocus={() => {
                  setActiveField('checkout');
                  setShowCityDropdown(false);
                  setShowGuestPicker(false);
                  setShowPricePicker(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--casita-gray-100)]" />

        {/* Row 2: Guests, Budget & Search */}
        <div className="flex flex-col md:flex-row md:items-center">
          {/* Guests */}
          <div className="relative flex-1">
            <div
              className={`p-5 cursor-pointer transition-all duration-200 ${
                activeField === 'guests'
                  ? 'bg-[var(--casita-gray-50)]'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('guests');
                setShowGuestPicker(!showGuestPicker);
                setShowCityDropdown(false);
                setShowPricePicker(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-2">
                {t.search.guests}
              </label>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
                <span className="text-[var(--casita-gray-900)] text-base font-medium">
                  {guests} {guests !== 1 ? t.search.guestsPlural : t.search.guest}, {rooms} {rooms !== 1 ? 'rooms' : 'room'}
                </span>
              </div>
            </div>

            {/* Guest Picker Dropdown */}
            {showGuestPicker && (
              <div className="absolute top-full left-0 right-0 md:right-auto md:w-72 mt-1 bg-white rounded-xl shadow-2xl border border-[var(--casita-gray-100)] p-4 z-[200] animate-scale-in">
                <div className="space-y-4">
                  {/* Guests Row */}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--casita-gray-900)]">{t.search.guests}</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGuests(Math.max(1, guests - 1));
                        }}
                        className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40"
                        disabled={guests <= 1}
                      >
                        <Minus className="w-4 h-4 text-[var(--casita-gray-700)]" />
                      </button>
                      <span className="w-6 text-center text-lg font-semibold">{guests}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGuests(guests + 1);
                        }}
                        className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[var(--casita-gray-700)]" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[var(--casita-gray-100)]" />

                  {/* Rooms Row */}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--casita-gray-900)]">Rooms</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRooms(Math.max(1, rooms - 1));
                        }}
                        className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40"
                        disabled={rooms <= 1}
                      >
                        <Minus className="w-4 h-4 text-[var(--casita-gray-700)]" />
                      </button>
                      <span className="w-6 text-center text-lg font-semibold">{rooms}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRooms(rooms + 1);
                        }}
                        className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-[var(--casita-gray-700)]" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGuestPicker(false);
                  }}
                  className="w-full mt-4 py-2.5 bg-[var(--casita-orange)] text-white rounded-lg font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-16 bg-[var(--casita-gray-100)]" />
          <div className="md:hidden border-t border-[var(--casita-gray-100)]" />

          {/* Budget */}
          <div className="relative flex-1">
            <div
              className={`p-5 cursor-pointer transition-all duration-200 ${
                activeField === 'price'
                  ? 'bg-[var(--casita-gray-50)]'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('price');
                setShowPricePicker(!showPricePicker);
                setShowGuestPicker(false);
                setShowCityDropdown(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-2">
                Budget
              </label>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
                <span className="text-[var(--casita-gray-900)] text-base font-medium">
                  {getPriceDisplayText()}
                </span>
              </div>
            </div>

            {/* Price Picker Dropdown */}
            {showPricePicker && (
              <div className="absolute top-full left-0 right-0 md:right-auto md:w-80 mt-1 bg-white rounded-xl shadow-2xl border border-[var(--casita-gray-100)] p-4 z-[200] animate-scale-in">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-[var(--casita-gray-900)] mb-3">Price per night</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PRICE_RANGES.map((range) => (
                        <button
                          key={range.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMinPrice(range.min);
                            setMaxPrice(range.max);
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            minPrice === range.min && maxPrice === range.max
                              ? 'bg-[var(--casita-orange)] text-white'
                              : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] hover:bg-[var(--casita-gray-200)]'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[var(--casita-gray-100)]" />

                  <div>
                    <p className="font-medium text-[var(--casita-gray-700)] mb-2 text-sm">Custom range</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--casita-gray-400)]">$</span>
                        <input
                          type="number"
                          value={minPrice || ''}
                          onChange={(e) => setMinPrice(e.target.value ? parseInt(e.target.value) : null)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-7 pr-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--casita-orange)]"
                          placeholder="Min"
                        />
                      </div>
                      <span className="text-[var(--casita-gray-400)]">-</span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--casita-gray-400)]">$</span>
                        <input
                          type="number"
                          value={maxPrice || ''}
                          onChange={(e) => setMaxPrice(e.target.value ? parseInt(e.target.value) : null)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-7 pr-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:border-[var(--casita-orange)]"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPricePicker(false);
                  }}
                  className="w-full mt-4 py-2.5 bg-[var(--casita-orange)] text-white rounded-lg font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-16 bg-[var(--casita-gray-100)]" />
          <div className="md:hidden border-t border-[var(--casita-gray-100)]" />

          {/* Pet Friendly Toggle */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setPetFriendly(!petFriendly)}
              className={`p-5 flex items-center gap-3 transition-all duration-200 ${
                petFriendly
                  ? 'bg-[var(--casita-orange)]/10'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                petFriendly
                  ? 'bg-[var(--casita-orange)] text-white'
                  : 'bg-[var(--casita-gray-100)] text-[var(--casita-gray-500)]'
              }`}>
                <PawPrint className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider">Pets</p>
                <p className={`text-sm font-medium ${petFriendly ? 'text-[var(--casita-orange)]' : 'text-[var(--casita-gray-900)]'}`}>
                  {petFriendly ? 'Yes' : 'No'}
                </p>
              </div>
            </button>
          </div>

          {/* Search Button */}
          <div className="p-4 md:pr-5">
            <button
              onClick={handleSearch}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--casita-orange)] text-white px-8 py-4 rounded-xl font-bold hover:bg-[var(--casita-orange-dark)] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              <span>{t.search.search}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
