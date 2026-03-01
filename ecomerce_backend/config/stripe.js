import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

// Stripe configuration
export const stripeConfig = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
  captureMethod: 'automatic', // Charge immediately on confirmation
};

export default stripe;
