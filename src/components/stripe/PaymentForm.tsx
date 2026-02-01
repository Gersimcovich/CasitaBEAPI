'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';

interface PaymentFormProps {
  onPaymentAuthorized: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  guestInfoComplete?: boolean;
}

export default function PaymentForm({
  onPaymentAuthorized,
  onError,
  isSubmitting,
  setIsSubmitting,
  guestInfoComplete = true,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      // Confirm the PaymentIntent - this authorizes the payment (manual capture)
      // Supports all payment methods including Klarna, Affirm, Apple Pay, Google Pay, etc.
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
        setIsSubmitting(false);
        return;
      }

      if (paymentIntent && paymentIntent.id) {
        // Pass the PaymentIntent ID (pi_xxx) to the parent for capture
        // Payment is authorized but not yet captured (manual capture mode)
        onPaymentAuthorized(paymentIntent.id);
      } else {
        setPaymentError('Unable to process payment. Please try again.');
        onError('No payment intent returned');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError('An unexpected error occurred. Please try again.');
      onError('Unexpected payment error');
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = !stripe || isSubmitting || !guestInfoComplete;

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: 'accordion',
        }}
      />

      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{paymentError}</p>
        </div>
      )}

      {!guestInfoComplete && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">Please complete guest information above to proceed.</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        className="w-full bg-[var(--casita-orange)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--casita-orange-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Complete Booking
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-[var(--casita-gray-500)]">
        <Lock className="w-3 h-3" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </div>
  );
}
