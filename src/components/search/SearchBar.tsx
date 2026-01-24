'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Users, Minus, Plus, X } from 'lucide-react';
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
}

export default function SearchBar({ variant = 'hero', onSearch }: SearchBarProps) {
  const { t } = useLocale();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Fallback cities - shown immediately while API loads
  const fallbackCities = ['Bal Harbour', 'Kissimmee', 'Miami', 'Miami Beach', 'Puerto Iguazú'];
  const [cities, setCities] = useState<string[]>(fallbackCities);
  const [filteredCities, setFilteredCities] = useState<string[]>(fallbackCities);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const guestPickerRef = useRef<HTMLDivElement>(null);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await fetch('/api/cities');
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setCities(data.data);
          // Only update filtered if no search input yet
          if (!destination.trim()) {
            setFilteredCities(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
        // Keep fallback cities already set
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    onSearch?.({
      destination,
      checkIn,
      checkOut,
      guests,
      rooms,
    });
    // Navigate to search results
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkIn) params.set('checkIn', checkIn.toISOString().split('T')[0]);
    if (checkOut) params.set('checkOut', checkOut.toISOString().split('T')[0]);
    params.set('guests', guests.toString());
    params.set('rooms', rooms.toString());
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
    <div className="w-full max-w-4xl mx-auto px-4" ref={searchBarRef}>
      <div className="bg-white rounded-2xl shadow-2xl p-3 md:p-4 border border-[var(--casita-gray-100)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          {/* Destination with City Dropdown */}
          <div className="relative flex-1 lg:flex-[1.5]">
            <div
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeField === 'destination'
                  ? 'bg-[var(--casita-gray-50)] ring-2 ring-[var(--casita-orange)]/20'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('destination');
                setShowCityDropdown(true);
                setShowGuestPicker(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-1">
                {t.search.destination}
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--casita-orange)] flex-shrink-0" />
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
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-[var(--casita-gray-100)] max-h-64 overflow-y-auto z-50 animate-scale-in">
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

          <div className="hidden lg:block w-px h-10 bg-[var(--casita-gray-200)]" />

          {/* Check-in */}
          <div className="flex-1">
            <div
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeField === 'checkin'
                  ? 'bg-[var(--casita-gray-50)] ring-2 ring-[var(--casita-orange)]/20'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('checkin');
                setShowCityDropdown(false);
                setShowGuestPicker(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-1">
                {t.search.checkIn}
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--casita-orange)] flex-shrink-0" />
                <DatePicker
                  selected={checkIn}
                  onChange={(date: Date | null) => setCheckIn(date)}
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
                  }}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-[var(--casita-gray-200)]" />

          {/* Check-out */}
          <div className="flex-1">
            <div
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeField === 'checkout'
                  ? 'bg-[var(--casita-gray-50)] ring-2 ring-[var(--casita-orange)]/20'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('checkout');
                setShowCityDropdown(false);
                setShowGuestPicker(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-1">
                {t.search.checkOut}
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--casita-orange)] flex-shrink-0" />
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
                  }}
                />
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-[var(--casita-gray-200)]" />

          {/* Guests & Rooms */}
          <div className="relative flex-1" ref={guestPickerRef}>
            <div
              className={`px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeField === 'guests'
                  ? 'bg-[var(--casita-gray-50)] ring-2 ring-[var(--casita-orange)]/20'
                  : 'hover:bg-[var(--casita-gray-50)]'
              }`}
              onClick={() => {
                setActiveField('guests');
                setShowGuestPicker(!showGuestPicker);
                setShowCityDropdown(false);
              }}
            >
              <label className="block text-xs font-bold text-[var(--casita-gray-500)] uppercase tracking-wider mb-1">
                {t.search.guests}
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--casita-orange)] flex-shrink-0" />
                <span className="text-[var(--casita-gray-900)] text-base font-medium">
                  {guests} {guests !== 1 ? t.search.guestsPlural : t.search.guest}, {rooms} {rooms !== 1 ? 'rooms' : 'room'}
                </span>
              </div>
            </div>

            {/* Guest & Room Picker Dropdown */}
            {showGuestPicker && (
              <div className="absolute top-full right-0 left-0 lg:left-auto lg:w-72 mt-2 bg-white rounded-xl shadow-2xl border border-[var(--casita-gray-100)] p-4 z-50 animate-scale-in">
                <div className="space-y-4">
                  {/* Guests Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--casita-gray-900)]">{t.search.guests}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGuests(Math.max(1, guests - 1));
                        }}
                        className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={guests <= 1}
                      >
                        <Minus className="w-4 h-4 text-[var(--casita-gray-700)]" />
                      </button>
                      <span className="w-6 text-center text-lg font-semibold text-[var(--casita-gray-900)]">{guests}</span>
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

                  {/* Divider */}
                  <div className="border-t border-[var(--casita-gray-100)]" />

                  {/* Rooms Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--casita-gray-900)]">Rooms</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRooms(Math.max(1, rooms - 1));
                        }}
                        className="w-8 h-8 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={rooms <= 1}
                      >
                        <Minus className="w-4 h-4 text-[var(--casita-gray-700)]" />
                      </button>
                      <span className="w-6 text-center text-lg font-semibold text-[var(--casita-gray-900)]">{rooms}</span>
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

                {/* Done Button */}
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

          {/* Search Button */}
          <div className="flex-shrink-0 pt-2 lg:pt-0 lg:pl-2">
            <button
              onClick={handleSearch}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[var(--casita-orange)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--casita-orange-dark)] transition-all duration-200 shadow-lg hover:shadow-xl"
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
