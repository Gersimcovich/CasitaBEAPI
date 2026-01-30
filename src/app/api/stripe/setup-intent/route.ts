import { NextResponse } from 'next/server';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover',
    });
  }
  return _stripe;
}

export async function POST() {
  try {
    // Create a SetupIntent for collecting payment method
    // This allows us to collect card details without charging immediately
    // The payment method ID will be passed to Guesty as ccToken
    // Note: Klarna and Affirm require PaymentIntents with an amount, not SetupIntents
    // For now, we support card payments. BNPL options can be added when using PaymentIntents.
    const setupIntent = await getStripe().setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session', // Allow the payment method to be used later by Guesty
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);

    let userMessage = 'Unable to initialize payment. Please try again.';

    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeAuthenticationError') {
        userMessage = 'Payment system configuration error. Please contact support.';
      } else if (error.type === 'StripeRateLimitError') {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
      },
      { status: 500 }
    );
  }
}
