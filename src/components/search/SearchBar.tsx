'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Calendar, Users, Minus, Plus, X, ChevronDown } from 'lucide-react';
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

type SearchStep = 'destination' | 'dates' | 'guests';

export default function SearchBar({ variant = 'hero', onSearch }: SearchBarProps) {
  const { t } = useLocale();

  // Progressive disclosure step
  const [step, setStep] = useState<SearchStep>('destination');

  // Search form state
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  // UI state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const searchBarRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

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
    setStep('dates');
  };

  const clearDestination = () => {
    setDestination('');
    setCheckIn(null);
    setCheckOut(null);
    setStep('destination');
    setTimeout(() => destinationInputRef.current?.focus(), 100);
  };

  const clearDates = () => {
    setCheckIn(null);
    setCheckOut(null);
    setStep('dates');
  };

  const formatDateRange = () => {
    if (!checkIn || !checkOut) return '';
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(checkIn)} - ${formatDate(checkOut)}`;
  };

  // Compact variant (header)
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

  // Hero variant - Full width bar with progressive disclosure
  return (
    <div className="w-full max-w-4xl mx-auto px-4 relative z-[100]" ref={searchBarRef}>
      <div className="bg-white rounded-full shadow-2xl border border-[var(--casita-gray-100)] transition-all duration-300">
        <div className="flex items-center h-[72px]">
          {/* Left section: Pills for completed selections */}
          {step !== 'destination' && (
            <div className="flex items-center gap-2 pl-6 flex-shrink-0">
              {/* Destination Pill */}
              <button
                onClick={() => {
                  setStep('destination');
                  setShowCityDropdown(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--casita-gray-50)] rounded-full border border-[var(--casita-gray-200)] hover:border-[var(--casita-orange)] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[var(--casita-orange)]" />
                <span className="text-sm font-medium text-[var(--casita-gray-900)]">{destination}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDestination();
                  }}
                  className="p-0.5 hover:bg-[var(--casita-gray-200)] rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[var(--casita-gray-500)]" />
                </button>
              </button>

              {/* Dates Pill - shown when on guests step */}
              {step === 'guests' && checkIn && checkOut && (
                <button
                  onClick={() => setStep('dates')}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--casita-gray-50)] rounded-full border border-[var(--casita-gray-200)] hover:border-[var(--casita-orange)] transition-colors"
                >
                  <Calendar className="w-4 h-4 text-[var(--casita-orange)]" />
                  <span className="text-sm font-medium text-[var(--casita-gray-900)]">{formatDateRange()}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearDates();
                    }}
                    className="p-0.5 hover:bg-[var(--casita-gray-200)] rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-[var(--casita-gray-500)]" />
                  </button>
                </button>
              )}
            </div>
          )}

          {/* Center section: Current input */}
          <div className="flex-1 relative">
            {/* Step 1: Large destination input */}
            {step === 'destination' && (
              <div className="relative">
                <div
                  className="flex items-center gap-4 px-8 cursor-text"
                  onClick={() => {
                    setShowCityDropdown(true);
                    destinationInputRef.current?.focus();
                  }}
                >
                  <MapPin className="w-6 h-6 text-[var(--casita-orange)] flex-shrink-0" />
                  <input
                    ref={destinationInputRef}
                    type="text"
                    placeholder={t.search.destinationPlaceholder}
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    className="flex-1 bg-transparent text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none text-2xl font-semibold tracking-tight"
                  />
                </div>

                {/* City Dropdown */}
                {showCityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-[var(--casita-gray-100)] max-h-80 overflow-y-auto z-[200] animate-scale-in">
                    {isLoadingCities ? (
                      <div className="p-4 text-center text-[var(--casita-gray-500)]">
                        Loading cities...
                      </div>
                    ) : filteredCities.length > 0 ? (
                      <ul className="py-2">
                        {filteredCities.map((city) => (
                          <li key={city}>
                            <button
                              onClick={() => handleCitySelect(city)}
                              className="w-full px-6 py-4 text-left hover:bg-[var(--casita-gray-50)] flex items-center gap-4 transition-colors"
                            >
                              <MapPin className="w-5 h-5 text-[var(--casita-orange)]" />
                              <span className="text-lg text-[var(--casita-gray-800)] font-medium">{city}</span>
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
            )}

            {/* Step 2: Date Pickers */}
            {step === 'dates' && (
              <div className="flex items-center gap-2 px-6">
                <Calendar className="w-5 h-5 text-[var(--casita-orange)] flex-shrink-0" />
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--casita-gray-500)] mb-1">Check-in</label>
                    <DatePicker
                      selected={checkIn}
                      onChange={(date: Date | null) => {
                        setCheckIn(date);
                        if (date && checkOut && checkOut <= date) {
                          const nextDay = new Date(date);
                          nextDay.setDate(nextDay.getDate() + 1);
                          setCheckOut(nextDay);
                        }
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
                      placeholderText="Add date"
                      className="w-full bg-transparent text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none text-lg font-medium cursor-pointer"
                      dateFormat="MMM d"
                    />
                  </div>
                  <div className="w-px h-10 bg-[var(--casita-gray-200)]" />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--casita-gray-500)] mb-1">Check-out</label>
                    <DatePicker
                      selected={checkOut}
                      onChange={(date: Date | null) => {
                        setCheckOut(date);
                        // Auto-advance to guests step when both dates are selected
                        if (date && checkIn) {
                          setTimeout(() => setStep('guests'), 300);
                        }
                      }}
                      selectsEnd
                      startDate={checkIn}
                      endDate={checkOut}
                      minDate={checkIn || new Date()}
                      placeholderText="Add date"
                      className="w-full bg-transparent text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none text-lg font-medium cursor-pointer"
                      dateFormat="MMM d"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Guests */}
            {step === 'guests' && (
              <div className="flex items-center gap-4 px-6">
                <div className="relative">
                  <button
                    onClick={() => setShowGuestPicker(!showGuestPicker)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--casita-gray-50)] rounded-full border border-[var(--casita-gray-200)] hover:border-[var(--casita-orange)] transition-colors"
                  >
                    <Users className="w-4 h-4 text-[var(--casita-orange)]" />
                    <span className="text-sm font-medium text-[var(--casita-gray-900)]">
                      {guests} {guests !== 1 ? 'guests' : 'guest'}, {rooms} {rooms !== 1 ? 'rooms' : 'room'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--casita-gray-500)]" />
                  </button>

                  {/* Guest Picker Dropdown */}
                  {showGuestPicker && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-[var(--casita-gray-100)] p-4 z-[200] animate-scale-in w-64">
                      <div className="space-y-4">
                        {/* Guests Row */}
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-[var(--casita-gray-900)]">Guests</p>
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
              </div>
            )}
          </div>

          {/* Right section: Search Button */}
          <div className="pr-3 flex-shrink-0">
            <button
              onClick={handleSearch}
              disabled={!destination}
              className="flex items-center justify-center gap-2 bg-[var(--casita-orange)] text-white px-6 py-4 rounded-full font-bold hover:bg-[var(--casita-orange-dark)] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">{t.search.search}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
