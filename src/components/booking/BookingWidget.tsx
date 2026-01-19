'use client';

import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { Users, Minus, Plus, Star, Shield, Check, Loader2, BedDouble, Percent } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

interface BookingWidgetProps {
  listingId: string;
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  maxRooms?: number;
  guestsPerRoom?: number;
  rating?: number;
  reviewCount?: number;
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
}: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [rooms, setRooms] = useState<RoomConfig[]>([{ adults: 1, children: 0 }]);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);

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

  // Guest form state
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
    confirmationCode?: string;
  } | null>(null);

  // Fetch blocked dates when component mounts
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const today = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

        const from = today.toISOString().split('T')[0];
        const to = threeMonthsLater.toISOString().split('T')[0];

        const response = await fetch(
          `/api/booking/calendar?listingId=${listingId}&from=${from}&to=${to}`
        );
        const data = await response.json();

        if (data.success && data.blockedDates) {
          setBlockedDates(data.blockedDates.map((d: string) => new Date(d)));
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };

    fetchBlockedDates();
  }, [listingId]);

  // Fetch quote when dates change
  useEffect(() => {
    const fetchQuote = async () => {
      if (!checkIn || !checkOut) {
        setQuote(null);
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
          setQuoteError(data.error || 'Selected dates are not available');
          setQuote(null);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setQuoteError('Failed to check availability');
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [checkIn, checkOut, totalGuests, listingId]);

  const handleReserve = async () => {
    if (!quote || !checkIn || !checkOut) return;

    // Validate guest info
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build room details for notes
      const roomDetails = rooms.map((room, i) =>
        `Room ${i + 1}: ${room.adults} adult${room.adults > 1 ? 's' : ''}${room.children > 0 ? `, ${room.children} child${room.children > 1 ? 'ren' : ''}` : ''}`
      ).join('\n');

      const notesWithRooms = `${guestInfo.notes ? guestInfo.notes + '\n\n' : ''}Rooms Booked: ${rooms.length}\n${roomDetails}${multiRoomDiscount > 0 ? `\n\nMulti-room discount: ${Math.round(multiRoomDiscount * 100)}% applied` : ''}`;

      const response = await fetch('/api/booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          checkIn: checkIn.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          guestsCount: totalGuests,
          guest: {
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone,
          },
          bookingType: 'inquiry', // Request to book
          notes: notesWithRooms,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBookingResult({
          success: true,
          message: data.message,
          confirmationCode: data.reservation?.confirmationCode,
        });
      } else {
        setBookingResult({
          success: false,
          message: data.error || 'Failed to submit booking request',
        });
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      setBookingResult({
        success: false,
        message: 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Success state
  if (bookingResult?.success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-[var(--casita-gray-100)] p-6 sticky top-24">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-[var(--casita-gray-900)] mb-2">
            Booking Request Submitted!
          </h3>
          {bookingResult.confirmationCode && (
            <p className="text-sm text-[var(--casita-gray-600)] mb-4">
              Confirmation Code: <span className="font-semibold">{bookingResult.confirmationCode}</span>
            </p>
          )}
          <p className="text-[var(--casita-gray-600)] mb-6">
            {bookingResult.message}
          </p>
          <button
            onClick={() => {
              setBookingResult(null);
              setShowBookingForm(false);
              setCheckIn(null);
              setCheckOut(null);
              setRooms([{ adults: 1, children: 0 }]);
              setGuestInfo({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                notes: '',
              });
            }}
            className="text-[var(--casita-orange)] font-semibold hover:underline"
          >
            Make Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[var(--casita-gray-100)] p-6 sticky top-24">
      {/* Price Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-2xl font-bold text-[var(--casita-gray-900)]">
            {formatCurrency(pricePerNight)}
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
        <div className="grid grid-cols-2 divide-x divide-[var(--casita-gray-200)]">
          <div className="p-3">
            <label className="block text-xs font-semibold text-[var(--casita-gray-700)] uppercase mb-1">
              Check-in
            </label>
            <DatePicker
              selected={checkIn}
              onChange={(date: Date | null) => setCheckIn(date)}
              selectsStart
              startDate={checkIn}
              endDate={checkOut}
              minDate={new Date()}
              excludeDates={blockedDates}
              placeholderText="Add date"
              className="w-full text-sm text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none cursor-pointer"
              dateFormat="MMM d, yyyy"
            />
          </div>
          <div className="p-3">
            <label className="block text-xs font-semibold text-[var(--casita-gray-700)] uppercase mb-1">
              Check-out
            </label>
            <DatePicker
              selected={checkOut}
              onChange={(date: Date | null) => setCheckOut(date)}
              selectsEnd
              startDate={checkIn}
              endDate={checkOut}
              minDate={checkIn || new Date()}
              excludeDates={blockedDates}
              placeholderText="Add date"
              className="w-full text-sm text-[var(--casita-gray-900)] placeholder-[var(--casita-gray-400)] focus:outline-none cursor-pointer"
              dateFormat="MMM d, yyyy"
            />
          </div>
        </div>

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

      {/* Quote Error */}
      {quoteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{quoteError}</p>
        </div>
      )}

      {/* Loading Quote */}
      {isLoadingQuote && (
        <div className="mb-4 flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--casita-orange)]" />
          <span className="ml-2 text-sm text-[var(--casita-gray-600)]">Checking availability...</span>
        </div>
      )}

      {/* Price Breakdown */}
      {quote && !isLoadingQuote && (
        <div className="mb-4 space-y-2 text-sm">
          {/* Room breakdown */}
          {rooms.length > 1 && (
            <div className="flex justify-between text-[var(--casita-gray-600)]">
              <span>{rooms.length} rooms</span>
              <span></span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--casita-gray-600)] underline cursor-help" title="Nightly rate">
              {formatCurrency(quote.pricePerNight)} x {quote.nightsCount} nights {rooms.length > 1 ? `x ${rooms.length} rooms` : ''}
            </span>
            <span className="text-[var(--casita-gray-900)]">
              {formatCurrency(quote.accommodation * rooms.length)}
            </span>
          </div>
          {/* Multi-room discount */}
          {multiRoomDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Multi-room discount ({Math.round(multiRoomDiscount * 100)}%)
              </span>
              <span>-{formatCurrency(quote.accommodation * rooms.length * multiRoomDiscount)}</span>
            </div>
          )}
          {quote.cleaningFee > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--casita-gray-600)]">Cleaning fee</span>
              <span className="text-[var(--casita-gray-900)]">{formatCurrency(quote.cleaningFee * rooms.length)}</span>
            </div>
          )}
          {quote.taxes > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--casita-gray-600)]">Taxes & fees</span>
              <span className="text-[var(--casita-gray-900)]">
                {formatCurrency((quote.taxes * rooms.length) * (1 - multiRoomDiscount))}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-[var(--casita-gray-200)] font-semibold">
            <span className="text-[var(--casita-gray-900)]">Total</span>
            <span className="text-[var(--casita-gray-900)]">
              {formatCurrency((quote.total * rooms.length) * (1 - multiRoomDiscount))}
            </span>
          </div>
          {multiRoomDiscount > 0 && (
            <div className="text-xs text-green-600 text-right">
              You save {formatCurrency(quote.total * rooms.length * multiRoomDiscount)}!
            </div>
          )}
        </div>
      )}

      {/* Guest Info Form */}
      {showBookingForm && quote && (
        <div className="mb-4 space-y-3">
          <h4 className="font-semibold text-[var(--casita-gray-900)]">Guest Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First name *"
              value={guestInfo.firstName}
              onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
              className="px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
            />
            <input
              type="text"
              placeholder="Last name *"
              value={guestInfo.lastName}
              onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
              className="px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
            />
          </div>
          <input
            type="email"
            placeholder="Email address *"
            value={guestInfo.email}
            onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
            className="w-full px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={guestInfo.phone}
            onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
            className="w-full px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
          />
          <textarea
            placeholder="Special requests or notes"
            value={guestInfo.notes}
            onChange={(e) => setGuestInfo({ ...guestInfo, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-[var(--casita-gray-200)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)] resize-none"
          />
        </div>
      )}

      {/* Reserve Button */}
      {!showBookingForm ? (
        <button
          onClick={() => {
            if (quote) {
              setShowBookingForm(true);
            }
          }}
          disabled={!quote || isLoadingQuote}
          className="w-full bg-[var(--casita-orange)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkIn && checkOut ? 'Reserve' : 'Check Availability'}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleReserve}
            disabled={isSubmitting || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email}
            className="w-full bg-[var(--casita-orange)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Request to Book'
            )}
          </button>
          <button
            onClick={() => setShowBookingForm(false)}
            className="w-full py-2 text-sm text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error Message */}
      {bookingResult && !bookingResult.success && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{bookingResult.message}</p>
        </div>
      )}

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
