'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Header from '@/components/layout/Header';
import PaymentForm from '@/components/stripe/PaymentForm';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  BedDouble,
  Shield,
  Check,
  Loader2,
  Star,
  Phone,
  Mail,
  CreditCard
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PropertyData {
  id: string;
  name: string;
  images: string[];
  location: {
    address: string;
    city: string;
    country: string;
  };
  rating?: number;
  reviewCount?: number;
}

interface QuoteData {
  quoteId: string;
  ratePlanId: string;
  nightsCount: number;
  pricePerNight: number;
  accommodation: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse URL params
  const listingId = searchParams.get('listingId') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '1');
  const rooms = parseInt(searchParams.get('rooms') || '1');

  // State
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guest info state
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    notes: '',
  });

  // Country list for tracking customer origins
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'AR', name: 'Argentina' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CU', name: 'Cuba' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HN', name: 'Honduras' },
    { code: 'MX', name: 'Mexico' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'PA', name: 'Panama' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PR', name: 'Puerto Rico' },
    { code: 'ES', name: 'Spain' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'PT', name: 'Portugal' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'OTHER', name: 'Other' },
  ];

  // Payment state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
    confirmationCode?: string;
  } | null>(null);

  // Fetch property data
  useEffect(() => {
    if (!listingId) {
      setError('Missing listing information');
      setIsLoadingProperty(false);
      return;
    }

    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        const data = await response.json();
        if (data.success) {
          setProperty(data.data);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError('Failed to load property');
      } finally {
        setIsLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [listingId]);

  // Fetch quote
  useEffect(() => {
    if (!listingId || !checkIn || !checkOut) {
      setIsLoadingQuote(false);
      return;
    }

    const fetchQuote = async () => {
      try {
        const response = await fetch('/api/booking/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            checkIn,
            checkOut,
            guestsCount: guests,
          }),
        });
        const data = await response.json();
        if (data.success && data.quote) {
          setQuote(data.quote);
        } else {
          setError(data.error || 'Unable to get pricing');
        }
      } catch (err) {
        setError('Failed to load pricing');
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [listingId, checkIn, checkOut, guests]);

  // Initialize Stripe PaymentIntent once we have the quote (need amount for Klarna/Affirm)
  useEffect(() => {
    const initializeStripe = async () => {
      if (stripeClientSecret || !quote) return; // Already initialized or no quote yet

      setIsLoadingStripe(true);
      try {
        const response = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: quote.total,
            currency: quote.currency,
          }),
        });
        const data = await response.json();
        if (data.success && data.clientSecret) {
          setStripeClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Failed to initialize payment:', err);
      } finally {
        setIsLoadingStripe(false);
      }
    };

    initializeStripe();
  }, [stripeClientSecret, quote]);

  // Handle payment authorization - payment is authorized, now capture and create reservation
  const handlePaymentAuthorized = async (paymentIntentId: string) => {
    if (!quote) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guestsCount: guests,
          guest: {
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone,
            country: guestInfo.country,
          },
          bookingType: 'instant',
          paymentIntentId, // Stripe PaymentIntent ID for capture
          quoteId: quote.quoteId,
          ratePlanId: quote.ratePlanId,
          notes: guestInfo.notes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBookingResult({
          success: true,
          message: data.message || 'Your booking is confirmed!',
          confirmationCode: data.reservation?.confirmationCode,
        });
      } else {
        setBookingResult({
          success: false,
          message: data.error || 'Booking failed. Please try again.',
        });
      }
    } catch (err) {
      setBookingResult({
        success: false,
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setBookingResult({
      success: false,
      message: 'Payment failed. Please check your card details and try again.',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoadingProperty || isLoadingQuote) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--casita-orange)]" />
              <span className="ml-3 text-[var(--casita-gray-600)]">Loading checkout...</span>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Error state
  if (error || !property || !quote) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-[var(--casita-gray-900)] mb-4">
                {error || 'Unable to load checkout'}
              </h1>
              <Link
                href="/properties"
                className="text-[var(--casita-orange)] hover:underline"
              >
                Browse Properties
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Success state
  if (bookingResult?.success) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-4">
                Booking Confirmed!
              </h1>
              {bookingResult.confirmationCode && (
                <p className="text-lg text-[var(--casita-gray-600)] mb-2">
                  Confirmation Code: <span className="font-bold text-[var(--casita-gray-900)]">{bookingResult.confirmationCode}</span>
                </p>
              )}
              <p className="text-[var(--casita-gray-600)] mb-8">
                {bookingResult.message}
              </p>

              <div className="bg-[var(--casita-cream)] rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-[var(--casita-gray-900)] mb-4">Your Stay</h3>
                <div className="flex gap-4">
                  {property.images[0] && (
                    <Image
                      src={property.images[0]}
                      alt={property.name}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium text-[var(--casita-gray-900)]">{property.name}</p>
                    <p className="text-sm text-[var(--casita-gray-600)]">{property.location.city}</p>
                    <p className="text-sm text-[var(--casita-orange)] mt-2">
                      {formatDate(checkIn)} - {formatDate(checkOut)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[var(--casita-gray-500)] mb-6">
                A confirmation email has been sent to {guestInfo.email}
              </p>

              <Link
                href="/"
                className="inline-block bg-[var(--casita-orange)] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Checkout form
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back button */}
          <Link
            href={`/property/${listingId}`}
            className="inline-flex items-center gap-2 text-[var(--casita-gray-600)] hover:text-[var(--casita-gray-900)] mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to property</span>
          </Link>

          <h1 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-8">
            Complete Your Reservation
          </h1>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column - Guest Info & Payment */}
            <div className="lg:col-span-3 space-y-6">
              {/* Trip Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-4">
                  Your Trip
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[var(--casita-orange)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--casita-gray-500)]">Check-in</p>
                      <p className="font-medium text-[var(--casita-gray-900)]">{formatDate(checkIn)}</p>
                      <p className="text-xs text-[var(--casita-gray-500)]">From 3:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[var(--casita-orange)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--casita-gray-500)]">Check-out</p>
                      <p className="font-medium text-[var(--casita-gray-900)]">{formatDate(checkOut)}</p>
                      <p className="text-xs text-[var(--casita-gray-500)]">Until 11:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-[var(--casita-orange)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--casita-gray-500)]">Guests</p>
                      <p className="font-medium text-[var(--casita-gray-900)]">{guests} guest{guests > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {rooms > 1 && (
                    <div className="flex items-start gap-3">
                      <BedDouble className="w-5 h-5 text-[var(--casita-orange)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--casita-gray-500)]">Rooms</p>
                        <p className="font-medium text-[var(--casita-gray-900)]">{rooms} room{rooms > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--casita-orange)]" />
                  Guest Information
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                        placeholder="John"
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.lastName}
                        onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                        placeholder="Doe"
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                    />
                    <p className="text-xs text-[var(--casita-gray-500)] mt-1">
                      Confirmation will be sent to this email
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                        Country of Residence *
                      </label>
                      <select
                        value={guestInfo.country}
                        onChange={(e) => setGuestInfo({ ...guestInfo, country: e.target.value })}
                        className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)] bg-white"
                      >
                        <option value="">Select your country</option>
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--casita-gray-700)] mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={guestInfo.notes}
                      onChange={(e) => setGuestInfo({ ...guestInfo, notes: e.target.value })}
                      placeholder="Any special requests or notes for your stay..."
                      rows={3}
                      className="w-full px-4 py-3 border border-[var(--casita-gray-200)] rounded-xl text-[var(--casita-gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--casita-orange)]/20 focus:border-[var(--casita-orange)] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-[var(--casita-gray-900)] mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[var(--casita-orange)]" />
                  Payment Details
                </h2>

                {isLoadingStripe ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--casita-orange)]" />
                    <span className="ml-2 text-[var(--casita-gray-600)]">Loading payment form...</span>
                  </div>
                ) : stripeClientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: stripeClientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#F97316',
                          colorBackground: '#ffffff',
                          colorText: '#1f2937',
                          colorDanger: '#ef4444',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          borderRadius: '12px',
                        },
                      },
                    }}
                  >
                    <PaymentForm
                      onPaymentAuthorized={handlePaymentAuthorized}
                      onError={handlePaymentError}
                      isSubmitting={isSubmitting}
                      setIsSubmitting={setIsSubmitting}
                      guestInfoComplete={!!(guestInfo.firstName && guestInfo.lastName && guestInfo.email && guestInfo.country)}
                    />
                  </Elements>
                ) : (
                  <div className="bg-[var(--casita-cream)] rounded-xl p-6 text-center">
                    <p className="text-[var(--casita-gray-600)]">
                      Unable to load payment form. Please refresh and try again.
                    </p>
                  </div>
                )}

                {/* Error message */}
                {bookingResult && !bookingResult.success && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{bookingResult.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-28">
                {/* Property Preview */}
                <div className="flex gap-4 pb-6 border-b border-[var(--casita-gray-100)]">
                  {property.images[0] && (
                    <Image
                      src={property.images[0]}
                      alt={property.name}
                      width={120}
                      height={90}
                      className="rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--casita-gray-900)] line-clamp-2">
                      {property.name}
                    </h3>
                    <p className="text-sm text-[var(--casita-gray-600)] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {property.location.city}
                    </p>
                    {property.rating && property.reviewCount && property.reviewCount > 0 && (
                      <p className="text-sm text-[var(--casita-gray-600)] flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-[var(--casita-orange)] text-[var(--casita-orange)]" />
                        {property.rating.toFixed(1)} ({property.reviewCount} reviews)
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Breakdown - All-in pricing for direct booking */}
                <div className="py-6 border-b border-[var(--casita-gray-100)]">
                  <h3 className="font-semibold text-[var(--casita-gray-900)] mb-4">Price Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--casita-gray-600)]">
                        {formatCurrency(Math.round(quote.total / quote.nightsCount))} x {quote.nightsCount} night{quote.nightsCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-[var(--casita-gray-900)]">
                        {formatCurrency(quote.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="py-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[var(--casita-gray-900)]">Total</span>
                    <span className="text-xl font-bold text-[var(--casita-gray-900)]">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--casita-gray-500)] mt-1">
                    All taxes and fees included. No hidden charges.
                  </p>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3 pt-6 border-t border-[var(--casita-gray-100)]">
                  <div className="flex items-center gap-3 text-sm text-[var(--casita-gray-600)]">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Free cancellation for 48 hours</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--casita-gray-600)]">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Instant confirmation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--casita-gray-600)]">
                    <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Secure payment with Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--casita-orange)]" />
              <span className="ml-3 text-[var(--casita-gray-600)]">Loading checkout...</span>
            </div>
          </div>
        </main>
      </>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
