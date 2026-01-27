'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Search,
  CalendarCheck,
  Loader2,
  User,
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit3,
  Phone,
} from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';

interface Reservation {
  id: string;
  confirmationCode: string;
  guestName: string;
  propertyName: string;
  propertyImage: string;
  propertyAddress: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  nightsCount?: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  canModify: boolean;
  canCancel: boolean;
}

export default function ManageReservationPage() {
  const { user, isAuthenticated } = useUser();
  const [lastName, setLastName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Logged-in user's reservations
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [myResLoading, setMyResLoading] = useState(false);
  const [showManualLookup, setShowManualLookup] = useState(false);

  // Auto-fetch reservations for logged-in users
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setMyResLoading(true);
      fetch('/api/reservation/my-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.reservations) {
            setMyReservations(data.reservations);
          }
        })
        .catch(() => {})
        .finally(() => setMyResLoading(false));
    }
  }, [isAuthenticated, user?.email]);

  // Modify dates state
  const [showModifyDates, setShowModifyDates] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState<Date | null>(null);
  const [newCheckOut, setNewCheckOut] = useState<Date | null>(null);
  const [modifyLoading, setModifyLoading] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [modifySuccess, setModifySuccess] = useState(false);
  const [newPrice, setNewPrice] = useState<number | null>(null);

  // Cancel state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReservation(null);

    try {
      const response = await fetch('/api/reservation/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastName, confirmationCode }),
      });

      const data = await response.json();

      if (data.success && data.reservation) {
        setReservation(data.reservation);
        // Initialize modify dates with current dates
        setNewCheckIn(new Date(data.reservation.checkIn));
        setNewCheckOut(new Date(data.reservation.checkOut));
      } else {
        setError(data.error || 'Reservation not found. Please check your details and try again.');
      }
    } catch {
      setError('Unable to connect. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNewDates = async () => {
    if (!newCheckIn || !newCheckOut || !reservation) return;

    setModifyLoading(true);
    setModifyError(null);
    setNewPrice(null);

    try {
      const response = await fetch('/api/reservation/check-modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          newCheckIn: newCheckIn.toISOString().split('T')[0],
          newCheckOut: newCheckOut.toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.newPrice >= reservation.totalPrice) {
          setNewPrice(data.newPrice);
        } else {
          setModifyError(
            'The new dates have a lower rate. Date modifications can only be made for the same price or higher. Please contact support for assistance.'
          );
        }
      } else {
        setModifyError(data.error || 'These dates are not available.');
      }
    } catch {
      setModifyError('Unable to check availability. Please try again.');
    } finally {
      setModifyLoading(false);
    }
  };

  const handleConfirmModify = async () => {
    if (!newCheckIn || !newCheckOut || !reservation || !newPrice) return;

    setModifyLoading(true);
    setModifyError(null);

    try {
      const response = await fetch('/api/reservation/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          newCheckIn: newCheckIn.toISOString().split('T')[0],
          newCheckOut: newCheckOut.toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setModifySuccess(true);
        // Update reservation with new dates
        setReservation({
          ...reservation,
          checkIn: newCheckIn.toISOString().split('T')[0],
          checkOut: newCheckOut.toISOString().split('T')[0],
          totalPrice: newPrice,
        });
        setShowModifyDates(false);
      } else {
        setModifyError(data.error || 'Unable to modify reservation. Please contact support.');
      }
    } catch {
      setModifyError('Unable to modify reservation. Please try again.');
    } finally {
      setModifyLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;

    setCancelLoading(true);

    try {
      const response = await fetch('/api/reservation/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: reservation.id }),
      });

      const data = await response.json();

      if (data.success) {
        setCancelSuccess(true);
        setReservation({ ...reservation, status: 'cancelled', canModify: false, canCancel: false });
        setShowCancelConfirm(false);
      }
    } catch {
      // Handle error
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[var(--casita-gray-50)]">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--casita-orange)]/10 flex items-center justify-center">
              <CalendarCheck className="w-8 h-8 text-[var(--casita-orange)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-2">
              {isAuthenticated ? 'My Reservations' : 'Manage Your Reservation'}
            </h1>
            <p className="text-[var(--casita-gray-600)]">
              {isAuthenticated
                ? 'View your upcoming and past bookings'
                : 'Look up your booking to view details, modify dates, or cancel'}
            </p>
          </div>

          {/* Logged-in user: Show their reservations */}
          {isAuthenticated && !reservation && (
            <div className="space-y-4 mb-8">
              {myResLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--casita-orange)] mb-3" />
                  <p className="text-sm text-[var(--casita-gray-500)]">Loading your reservations...</p>
                </div>
              ) : myReservations.length > 0 ? (
                <>
                  {myReservations.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => {
                        setReservation(res);
                        setNewCheckIn(new Date(res.checkIn));
                        setNewCheckOut(new Date(res.checkOut));
                      }}
                      className="w-full bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] overflow-hidden hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex">
                        {res.propertyImage && (
                          <div className="relative w-28 h-28 flex-shrink-0">
                            <Image
                              src={res.propertyImage}
                              alt={res.propertyName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-[var(--casita-gray-900)] text-sm line-clamp-1">
                              {res.propertyName}
                            </h3>
                            {getStatusBadge(res.status)}
                          </div>
                          <p className="text-xs text-[var(--casita-gray-500)] mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(res.checkIn)} - {formatDate(res.checkOut)}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-[var(--casita-gray-500)] font-mono">
                              {res.confirmationCode}
                            </span>
                            {res.totalPrice > 0 && (
                              <span className="text-sm font-bold text-[var(--casita-gray-900)]">
                                ${res.totalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Still allow manual lookup */}
                  {!showManualLookup && (
                    <button
                      onClick={() => setShowManualLookup(true)}
                      className="w-full text-center text-sm text-[var(--casita-orange)] hover:underline py-2"
                    >
                      Look up a different reservation
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] p-8 text-center">
                  <CalendarCheck className="w-12 h-12 text-[var(--casita-gray-300)] mx-auto mb-3" />
                  <p className="text-[var(--casita-gray-600)] mb-1">No reservations found</p>
                  <p className="text-sm text-[var(--casita-gray-400)]">
                    Book your first stay to see it here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lookup Form (guests or manual lookup for logged-in users) */}
          {!reservation && (!isAuthenticated || showManualLookup) && (
            <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] p-6">
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)]" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="w-full pl-11 pr-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-1 focus:ring-[var(--casita-orange)]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                    Confirmation Code
                  </label>
                  <div className="relative">
                    <CalendarCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--casita-gray-400)]" />
                    <input
                      type="text"
                      value={confirmationCode}
                      onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                      placeholder="e.g., GY-ABC123"
                      className="w-full pl-11 pr-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)] focus:ring-1 focus:ring-[var(--casita-orange)] uppercase"
                      required
                    />
                  </div>
                  <p className="text-xs text-[var(--casita-gray-500)] mt-1">
                    Find this in your confirmation email
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Find Reservation
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[var(--casita-gray-100)]">
                <p className="text-center text-sm text-[var(--casita-gray-600)]">
                  Need help?{' '}
                  <a
                    href="https://wa.me/17866947577"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--casita-orange)] hover:underline inline-flex items-center gap-1"
                  >
                    <Phone className="w-4 h-4" />
                    Contact us via WhatsApp
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Reservation Details */}
          {reservation && (
            <div className="space-y-6">
              {/* Success Messages */}
              {modifySuccess && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">
                    Your reservation has been successfully modified. You will receive an updated confirmation email.
                  </p>
                </div>
              )}

              {cancelSuccess && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    Your reservation has been cancelled. You will receive a cancellation confirmation email.
                  </p>
                </div>
              )}

              {/* Reservation Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] overflow-hidden">
                {/* Property Image */}
                <div className="relative h-48">
                  <Image
                    src={reservation.propertyImage || '/hotel-illustration-1.png'}
                    alt={reservation.propertyName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(reservation.status)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--casita-gray-900)]">
                        {reservation.propertyName}
                      </h2>
                      <p className="text-sm text-[var(--casita-gray-500)] flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {reservation.propertyAddress}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--casita-gray-500)]">Confirmation</p>
                      <p className="font-mono font-bold text-[var(--casita-orange)]">
                        {reservation.confirmationCode}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[var(--casita-gray-50)] rounded-xl p-4">
                      <p className="text-xs text-[var(--casita-gray-500)] mb-1">Check-in</p>
                      <p className="font-semibold text-[var(--casita-gray-900)] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--casita-orange)]" />
                        {formatDate(reservation.checkIn)}
                      </p>
                    </div>
                    <div className="bg-[var(--casita-gray-50)] rounded-xl p-4">
                      <p className="text-xs text-[var(--casita-gray-500)] mb-1">Check-out</p>
                      <p className="font-semibold text-[var(--casita-gray-900)] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--casita-orange)]" />
                        {formatDate(reservation.checkOut)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-[var(--casita-gray-100)]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[var(--casita-gray-700)]">
                        <User className="w-4 h-4" />
                        <span>{reservation.guestName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--casita-gray-700)]">
                        <Users className="w-4 h-4" />
                        <span>{reservation.guests} guests</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--casita-gray-500)]">Total</p>
                      <p className="text-xl font-bold text-[var(--casita-gray-900)]">
                        ${reservation.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {reservation.status !== 'cancelled' && (
                    <div className="flex gap-3 pt-4 border-t border-[var(--casita-gray-100)]">
                      {reservation.canModify && (
                        <button
                          onClick={() => setShowModifyDates(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--casita-gray-100)] text-[var(--casita-gray-700)] rounded-xl font-medium hover:bg-[var(--casita-gray-200)] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Modify Dates
                        </button>
                      )}
                      {reservation.canCancel && (
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modify Dates Modal */}
              {showModifyDates && (
                <div className="bg-white rounded-2xl shadow-sm border border-[var(--casita-gray-100)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--casita-gray-900)] mb-4">
                    Modify Dates
                  </h3>
                  <p className="text-sm text-[var(--casita-gray-600)] mb-4">
                    Select new dates for your stay. Note: Modifications are only available for the same price or higher.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                        New Check-in
                      </label>
                      <DatePicker
                        selected={newCheckIn}
                        onChange={(date: Date | null) => {
                          setNewCheckIn(date);
                          setNewPrice(null);
                          if (date && newCheckOut && newCheckOut <= date) {
                            const nextDay = new Date(date);
                            nextDay.setDate(nextDay.getDate() + 1);
                            setNewCheckOut(nextDay);
                          }
                        }}
                        selectsStart
                        startDate={newCheckIn}
                        endDate={newCheckOut}
                        minDate={new Date()}
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                        dateFormat="MMM d, yyyy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-2">
                        New Check-out
                      </label>
                      <DatePicker
                        selected={newCheckOut}
                        onChange={(date: Date | null) => {
                          setNewCheckOut(date);
                          setNewPrice(null);
                        }}
                        selectsEnd
                        startDate={newCheckIn}
                        endDate={newCheckOut}
                        minDate={newCheckIn || new Date()}
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl focus:outline-none focus:border-[var(--casita-orange)]"
                        dateFormat="MMM d, yyyy"
                      />
                    </div>
                  </div>

                  {modifyError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{modifyError}</p>
                    </div>
                  )}

                  {newPrice && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl mb-4">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-700 font-medium">Dates available!</p>
                        <p className="text-sm text-green-600">
                          New total: <span className="font-bold">${newPrice.toLocaleString()}</span>
                          {newPrice > reservation.totalPrice && (
                            <span className="ml-2">
                              (${(newPrice - reservation.totalPrice).toLocaleString()} additional)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowModifyDates(false);
                        setModifyError(null);
                        setNewPrice(null);
                      }}
                      className="flex-1 px-4 py-3 border border-[var(--casita-gray-200)] text-[var(--casita-gray-700)] rounded-xl font-medium hover:bg-[var(--casita-gray-50)] transition-colors"
                    >
                      Cancel
                    </button>
                    {!newPrice ? (
                      <button
                        onClick={handleCheckNewDates}
                        disabled={modifyLoading}
                        className="flex-1 px-4 py-3 bg-[var(--casita-orange)] text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
                      >
                        {modifyLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          'Check Availability'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleConfirmModify}
                        disabled={modifyLoading}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {modifyLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          'Confirm Modification'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Cancel Confirmation Modal */}
              {showCancelConfirm && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--casita-gray-900)]">
                        Cancel Reservation?
                      </h3>
                      <p className="text-sm text-[var(--casita-gray-600)]">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--casita-gray-600)] mb-4">
                    Please review the cancellation policy for your booking. Refund amount depends on how close the cancellation is to the check-in date.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 px-4 py-3 border border-[var(--casita-gray-200)] text-[var(--casita-gray-700)] rounded-xl font-medium hover:bg-[var(--casita-gray-50)] transition-colors"
                    >
                      Keep Reservation
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        'Yes, Cancel'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Look up another */}
              <button
                onClick={() => {
                  setReservation(null);
                  setLastName('');
                  setConfirmationCode('');
                  setModifySuccess(false);
                  setCancelSuccess(false);
                }}
                className="w-full text-center text-sm text-[var(--casita-orange)] hover:underline"
              >
                Look up a different reservation
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
