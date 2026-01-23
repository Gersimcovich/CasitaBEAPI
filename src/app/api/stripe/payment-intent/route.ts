import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd' } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with all available payment methods
    // Using automatic_payment_methods lets Stripe show applicable methods based on currency/region
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      // Enable automatic payment methods - Stripe will show all applicable methods
      // based on the customer's location and the currency
      automatic_payment_methods: {
        enabled: true,
      },
      // Capture method: manual allows authorization then capture later
      // This is similar to how hotel bookings work - authorize now, charge at check-in
      capture_method: 'manual',
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);

    let userMessage = 'Unable to initialize payment. Please try again.';

    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === 'StripeAuthenticationError') {
        userMessage = 'Payment system configuration error. Please contact support.';
      } else if (error.type === 'StripeRateLimitError') {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.type === 'StripeInvalidRequestError') {
        // Some payment methods may not be enabled on the account
        userMessage = error.message || 'Payment configuration error.';
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
