'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Check, Loader2, AlertCircle } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded') {
      setStatus('success');
      setMessage('Your payment has been authorized. Your booking is being confirmed.');
    } else if (redirectStatus === 'processing') {
      setStatus('loading');
      setMessage('Your payment is being processed. You will receive a confirmation email shortly.');
    } else if (redirectStatus === 'requires_payment_method') {
      setStatus('error');
      setMessage('Payment was not completed. Please try again with a different payment method.');
    } else {
      setStatus('success');
      setMessage('Thank you for your booking!');
    }
  }, [searchParams]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {status === 'loading' && (
              <>
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-[var(--casita-orange)] animate-spin" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-4">
                  Processing...
                </h1>
                <p className="text-[var(--casita-gray-600)] mb-8">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-4">
                  Booking Confirmed!
                </h1>
                <p className="text-[var(--casita-gray-600)] mb-8">{message}</p>
                <p className="text-sm text-[var(--casita-gray-500)] mb-6">
                  A confirmation email will be sent to you shortly with your booking details.
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--casita-gray-900)] mb-4">
                  Payment Issue
                </h1>
                <p className="text-[var(--casita-gray-600)] mb-8">{message}</p>
              </>
            )}

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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-[var(--casita-cream)] pt-24">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--casita-orange)]" />
            </div>
          </div>
        </main>
      </>
    }>
      <SuccessContent />
    </Suspense>
  );
}
