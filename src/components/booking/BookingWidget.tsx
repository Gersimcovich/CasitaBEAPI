'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import { Users, Minus, Plus, Star, Shield, Loader2, BedDouble, Percent, Calendar, ShoppingCart } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import { useCart } from '@/contexts/CartContext';

interface BookingWidgetProps {
  listingId: string;
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  maxRooms?: number;
  guestsPerRoom?: number;
  rating?: number;
  reviewCount?: number;
  // Property info for cart
  propertyName?: string;
  propertyImage?: string;
  propertySlug?: string;
  propertyLocation?: string;
  // Initial dates from search
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
}

interface Quote {
  nightsCount: number;
  pricePerNight: number;
  accommodation: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
}

// Room configuration for multi-room bookings
interface RoomConfig {
  adults: number;
  children: number;
}

// Multi-room discount: 5% off for each additional room
const MULTI_ROOM_DISCOUNT = 0.05;

export default function BookingWidget({
  listingId,
  pricePerNight,
  currency,
  maxGuests,
  maxRooms = 5,
  guestsPerRoom = 4,
  rating = 4.9,
  reviewCount = 0,
  propertyName = '',
  propertyImage = '',
  propertySlug = '',
  propertyLocation = '',
  initialCheckIn = null,
  initialCheckOut = null,
}: BookingWidgetProps) {
  const router = useRouter();
  const { saveToCart, cartItem, hasCartItem } = useCart();
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut);
  const [rooms, setRooms] = useState<RoomConfig[]>([{ adults: 1, children: 0 }]);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [calendarPrices, setCalendarPrices] = useState<Map<string, number>>(new Map());
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Calculate total guests across all rooms
  const totalGuests = useMemo(() => {
    return rooms.reduce((sum, room) => sum + room.adults + room.children, 0);
  }, [rooms]);

  // Calculate multi-room discount (5% max, only applies from 3rd room)
  const multiRoomDiscount = useMemo(() => {
    if (rooms.length < 3) return 0;
    // Flat 5% discount when booking 3+ rooms
    return MULTI_ROOM_DISCOUNT;
  }, [rooms.length]);

  // Get dynamic price - QUOTE is the source of truth for pricing
  // Shows FINAL all-in rate per night (accommodation + cleaning + taxes)
  const dynamicPricePerNight = useMemo(() => {
    if (quote && quote.nightsCount > 0) {
      return Math.round(quote.total / quote.nightsCount);
    }
    // Fall back to static listing price when no quote available
    return pricePerNight;
  }, [quote, pricePerNight]);

  // Add a room
  const addRoom = () => {
    if (rooms.length < maxRooms) {
      setRooms([...rooms, { adults: 1, children: 0 }]);
    }
  };

  // Remove a room
  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  // Update room guests
  const updateRoomGuests = (roomIndex: number, type: 'adults' | 'children', delta: number) => {
    setRooms(rooms.map((room, index) => {
      if (index !== roomIndex) return room;
      const newValue = room[type] + delta;
      const totalInRoom = type === 'adults'
        ? newValue + room.children
        : room.adults + newValue;

      // Validate constraints
      if (type === 'adults' && newValue < 1) return room; // Min 1 adult per room
      if (newValue < 0) return room; // No negative values
      if (totalInRoom > guestsPerRoom) return room; // Max guests per room

      return { ...room, [type]: newValue };
    }));
  };

  // Fetch blocked dates (with optional cache bypass)
  const fetchBlockedDates = async (forceRefresh = false) => {
    setIsLoadingCalendar(true);
    setCalendarError(null);
    try {
      const today = new Date();
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      const from = today.toISOString().split('T')[0];
      const to = sixMonthsLater.toISOString().split('T')[0];

      const refreshParam = forceRefresh ? '&refresh=true' : '';
      const response = await fetch(
        `/api/booking/calendar?listingId=${listingId}&from=${from}&to=${to}${refreshParam}`
      );
      const data = await response.json();

      if (data.success) {
        if (data.blockedDates) {
          setBlockedDates(data.blockedDates.map((d: string) => new Date(d)));
        }
        // Store prices from calendar data
        if (data.availability) {
          const prices = new Map<string, number>();
          data.availability.forEach((day: { date: string; price: number }) => {
            if (day.price > 0) {
              prices.set(day.date, day.price);
            }
          });
          setCalendarPrices(prices);
        }
      } else if (!data.success) {
        setCalendarError(data.error || 'Unable to load availability');
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      setCalendarError('Unable to load calendar. Please try again.');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Fetch on mount - ALWAYS use fresh data to avoid "available but not bookable" bug
  useEffect(() => {
    fetchBlockedDates(true);
  }, [listingId]);

  // Check if a date is blocked
  const isDateBlocked = (date: Date) => {
    return blockedDates.some(
      (blocked) =>
        blocked.getFullYear() === date.getFullYear() &&
        blocked.getMonth() === date.getMonth() &&
        blocked.getDate() === date.getDate()
    );
  };

  // Custom day class for visual styling of blocked dates
  const getDayClassName = (date: Date) => {
    if (isDateBlocked(date)) {
      return 'booked-date';
    }
    return '';
  };

  // Fetch quote when dates change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!checkIn || !checkOut) {
        setQuote(null);
        setQuoteError(null);
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const response = await fetch('/api/booking/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            checkIn: checkIn.toISOString().split('T')[0],
            checkOut: checkOut.toISOString().split('T')[0],
            guestsCount: totalGuests,
          }),
        });

        const data = await response.json();

        if (data.success && data.quote) {
          setQuote(data.quote);
        } else {
          setQuoteError(data.error || 'These dates are already booked. Try adjusting your stay!');
          setQuote(null);
          // If quote reveals dates are actually booked, add them to blocked dates
          // but DON'T auto-clear selection - let user see the error and adjust manually
          if (data.unavailableDates?.length > 0) {
            const newBlocked = data.unavailableDates.map((d: string) => new Date(d));
            setBlockedDates(prev => {
              const existing = new Set(prev.map(d => d.toISOString().split('T')[0]));
              const merged = [...prev];
              for (const d of newBlocked) {
                if (!existing.has(d.toISOString().split('T')[0])) {
                  merged.push(d);
                }
              }
              return merged;
            });
            // Don't auto-clear dates - let user see error and adjust manually
            // Refresh the entire calendar in the background to get the latest blocked dates
            fetchBlockedDates(true);
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setQuoteError('We couldn\'t check availability right now. Please try again in a moment.');
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [checkIn, checkOut, totalGuests, listingId]);

  // Navigate to checkout page
  const handleReserve = () => {
    if (!quote || !checkIn || !checkOut) return;

    // Save to cart
    saveToCart({
      propertyId: listingId,
      propertyName: propertyName,
      propertyImage: propertyImage,
      propertySlug: propertySlug || listingId,
      location: propertyLocation,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: totalGuests,
      rooms: rooms.length,
      pricePerNight: pricePerNight,
      totalPrice: quote.total * rooms.length * (1 - multiRoomDiscount),
      currency: currency,
      savedAt: new Date().toISOString(),
    });

    // Navigate to checkout with all booking details
    const params = new URLSearchParams({
      listingId,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      guests: totalGuests.toString(),
      rooms: rooms.length.toString(),
    });

    router.push(`/checkout?${params.toString()}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[var(--casita-gray-100)] p-4 sm:p-6 sticky top-20 md:top-24">
      {/* Price Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-2xl font-bold text-[var(--casita-gray-900)]">
            {formatCurrency(dynamicPricePerNight)}
          </span>
          <span className="text-[var(--casita-gray-600)]"> / night</span>
        </div>
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[var(--casita-orange)] text-[var(--casita-orange)]" />
            <span className="font-semibold text-[var(--casita-gray-900)]">{rating.toFixed(1)}</span>
            <span className="text-[var(--casita-gray-500)]">({reviewCount})</span>
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div className="border border-[var(--casita-gray-200)] rounded-xl overflow-hidden mb-4">

        {/* Loading state */}
        {isLoadingCalendar && (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--casita-orange)]" />
            <span className="ml-2 text-sm text-[var(--casita-gray-500)]">Loading availability...</span>
          </div>
        )}

        {/* Calendar error state */}
        {!isLoadingCalendar && calendarError && (
          <div className="p-4 text-center">
            <p className="text-sm text-[var(--casita-gray-600)]">Unable to load availability</p>
            <button
              onClick={() => fetchBlockedDates(true)}
              className="mt-2 text-sm text-[var(--casita-orange)] hover:underline font-medium"
            >
              Try again
            </button>
          </div>
        )}


        {/* Date inputs */}
        {!isLoadingCalendar && !calendarError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--casita-gray-200)]">
            <div className="p-3 sm:p-3">
              <label className="block text-xs font-semibold text-[var(--casita-gray-700)] uppercase mb-1">
                Check-in
              </label>
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
                }}
                selectsStart
                startDate={checkIn}
                endDate={checkOut}
                minDate={new Date()}
                excludeDates={blockedDates}
                dayClassName={getDayClassName}
                placeholderText="Add date"
                className="w-full text-sm text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none cursor-pointer"
                dateFormat="MMM d, yyyy"
                monthsShown={1}
                inline={false}
              />
            </div>
            <div className="p-3 sm:p-3">
              <label className="block text-xs font-semibold text-[var(--casita-gray-700)] uppercase mb-1">
                Check-out
              </label>
              <DatePicker
                selected={checkOut}
                onChange={(date: Date | null) => setCheckOut(date)}
                selectsEnd
                startDate={checkIn}
                endDate={checkOut}
                minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
                filterDate={(date) => {
                  // Checkout date is when you leave, not when you stay
                  // So checkout is valid as long as all nights from check-in to checkout-1 are available
                  if (!checkIn) return true;

                  // Check that no blocked dates fall between check-in and checkout-1
                  const checkInTime = checkIn.getTime();
                  const checkOutTime = date.getTime();

                  // Must be at least 1 day after check-in
                  if (checkOutTime <= checkInTime) return false;

                  // Check if any blocked date falls within the stay period (check-in to checkout-1)
                  for (const blocked of blockedDates) {
                    const blockedTime = blocked.getTime();
                    // Blocked date is in the stay period if: check-in <= blocked < checkout
                    if (blockedTime >= checkInTime && blockedTime < checkOutTime) {
                      return false;
                    }
                  }
                  return true;
                }}
                dayClassName={getDayClassName}
                placeholderText="Add date"
                className="w-full text-sm text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none cursor-pointer"
                dateFormat="MMM d, yyyy"
                monthsShown={1}
                inline={false}
              />
            </div>
          </div>
        )}

        {/* Rooms & Guests */}
        <div className="border-t border-[var(--casita-gray-200)] p-3">
          <div
            className="cursor-pointer"
            onClick={() => setShowGuestPicker(!showGuestPicker)}
          >
            <label className="block text-xs font-semibold text-[var(--casita-gray-700)] uppercase mb-1">
              Rooms & Guests
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[var(--casita-gray-500)]" />
                <span className="text-sm text-[var(--casita-gray-900)]">
                  {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
                </span>
              </div>
              <span className="text-[var(--casita-gray-300)]">•</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[var(--casita-gray-500)]" />
                <span className="text-sm text-[var(--casita-gray-900)]">
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                </span>
              </div>
            </div>
          </div>

          {showGuestPicker && (
            <div className="mt-3 pt-3 border-t border-[var(--casita-gray-100)] space-y-4">
              {/* Room list */}
              {rooms.map((room, roomIndex) => (
                <div key={roomIndex} className="bg-[var(--casita-gray-50)] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-[var(--casita-orange)]" />
                      <span className="font-semibold text-sm text-[var(--casita-gray-900)]">
                        Room {roomIndex + 1}
                      </span>
                      {roomIndex >= 2 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          5% off
                        </span>
                      )}
                    </div>
                    {rooms.length > 1 && (
                      <button
                        onClick={() => removeRoom(roomIndex)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm text-[var(--casita-gray-700)]">Adults</span>
                      <p className="text-xs text-[var(--casita-gray-500)]">Age 13+</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateRoomGuests(roomIndex, 'adults', -1)}
                        className="w-7 h-7 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40"
                        disabled={room.adults <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-semibold text-sm">{room.adults}</span>
                      <button
                        onClick={() => updateRoomGuests(roomIndex, 'adults', 1)}
                        className="w-7 h-7 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40"
                        disabled={room.adults + room.children >= guestsPerRoom}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-[var(--casita-gray-700)]">Children</span>
                      <p className="text-xs text-[var(--casita-gray-500)]">Age 0-12</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateRoomGuests(roomIndex, 'children', -1)}
                        className="w-7 h-7 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40"
                        disabled={room.children <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-semibold text-sm">{room.children}</span>
                      <button
                        onClick={() => updateRoomGuests(roomIndex, 'children', 1)}
                        className="w-7 h-7 rounded-full border border-[var(--casita-gray-300)] hover:border-[var(--casita-orange)] flex items-center justify-center transition-colors disabled:opacity-40"
                        disabled={room.adults + room.children >= guestsPerRoom}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Room Button */}
              {rooms.length < maxRooms && (
                <button
                  onClick={addRoom}
                  className="w-full py-2.5 border-2 border-dashed border-[var(--casita-gray-300)] rounded-xl text-sm font-medium text-[var(--casita-gray-600)] hover:border-[var(--casita-orange)] hover:text-[var(--casita-orange)] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                  {rooms.length >= 2 && (
                    <span className="text-xs font-normal text-green-600">(5% off)</span>
                  )}
                </button>
              )}

              {/* Multi-room discount banner */}
              {rooms.length >= 3 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      {Math.round(multiRoomDiscount * 100)}% Multi-room Discount!
                    </p>
                    <p className="text-xs text-green-600">
                      5% off when booking 3 or more rooms
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-[var(--casita-gray-500)]">
                Max {guestsPerRoom} guests per room • Max {maxRooms} rooms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quote Error - Casita Style */}
      {quoteError && (
        <div className="mb-4 p-4 bg-[var(--casita-cream)] border border-[var(--casita-orange)]/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-[var(--casita-orange)]/10 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[var(--casita-orange)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--casita-gray-900)] mb-1">Let's find you the perfect dates</p>
              <p className="text-sm text-[var(--casita-gray-600)]">{quoteError}</p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setCheckIn(null);
                    setCheckOut(null);
                    setQuoteError(null);
                    fetchBlockedDates(true); // Refresh calendar with latest data
                  }}
                  className="text-sm font-medium text-[var(--casita-orange)] hover:underline"
                >
                  Refresh & try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Quote */}
      {isLoadingQuote && (
        <div className="mb-4 flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--casita-orange)]" />
          <span className="ml-2 text-sm text-[var(--casita-gray-600)]">Checking availability...</span>
        </div>
      )}

      {/* Price Breakdown - All-in pricing for direct booking (no hidden fees!) */}
      {quote && !isLoadingQuote && (
        <div className="mb-4 space-y-2 text-sm">
          {/* All-in nightly rate (includes accommodation, cleaning, taxes) */}
          <div className="flex justify-between">
            <span className="text-[var(--casita-gray-600)]">
              {formatCurrency(Math.round(quote.total / quote.nightsCount))} x {quote.nightsCount} night{quote.nightsCount > 1 ? 's' : ''} {rooms.length > 1 ? `x ${rooms.length} rooms` : ''}
            </span>
            <span className="text-[var(--casita-gray-900)]">
              {formatCurrency(quote.total * rooms.length)}
            </span>
          </div>
          {/* Multi-room discount */}
          {multiRoomDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Multi-room discount ({Math.round(multiRoomDiscount * 100)}%)
              </span>
              <span>-{formatCurrency(quote.total * rooms.length * multiRoomDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-[var(--casita-gray-200)] font-semibold">
            <span className="text-[var(--casita-gray-900)]">Total</span>
            <span className="text-[var(--casita-gray-900)]">
              {formatCurrency((quote.total * rooms.length) * (1 - multiRoomDiscount))}
            </span>
          </div>
          <p className="text-xs text-[var(--casita-gray-500)]">
            Includes all taxes and fees. No hidden charges.
          </p>
          {multiRoomDiscount > 0 && (
            <div className="text-xs text-green-600 text-right">
              You save {formatCurrency(quote.total * rooms.length * multiRoomDiscount)}!
            </div>
          )}
        </div>
      )}

      {/* Cart indicator if this property is in cart */}
      {hasCartItem && cartItem?.propertyId === listingId && (
        <div className="mb-4 p-3 bg-[var(--casita-cream)] rounded-xl flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[var(--casita-orange)]" />
          <span className="text-sm text-[var(--casita-gray-700)]">This property is in your cart</span>
        </div>
      )}

      {/* Reserve Button */}
      <button
        onClick={handleReserve}
        disabled={!quote || isLoadingQuote}
        className="w-full bg-[var(--casita-orange)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checkIn && checkOut ? 'Reserve' : 'Check Availability'}
      </button>

      <p className="text-center text-xs text-[var(--casita-gray-500)] mt-3">
        You won't be charged yet
      </p>

      {/* Trust Badges */}
      <div className="mt-6 pt-4 border-t border-[var(--casita-gray-100)]">
        <div className="flex items-center gap-2 text-sm text-[var(--casita-gray-600)]">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Free cancellation for 48 hours</span>
        </div>
      </div>
    </div>
  );
}
