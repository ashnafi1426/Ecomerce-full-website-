import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not defined');
}

export const stripePromise = loadStripe(stripePublishableKey);

export default stripePromise;
