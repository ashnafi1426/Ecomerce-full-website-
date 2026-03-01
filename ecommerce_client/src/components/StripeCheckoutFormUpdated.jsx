import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from '../config/api';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * STRIPE CHECKOUT FORM COMPONENT - UPDATED
 * ========================================
 * 
 * Complete Stripe payment integration with:
 * 1. Payment intent creation with backend validation
 * 2. Secure card input with Stripe Elements
 * 3. Payment processing and confirmation
 * 4. Order creation after successful payment
 * 5. Multi-vendor order splitting
 * 6. Error handling and loading states
 */

const CheckoutForm = ({ cartItems, shippingAddress, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useSelector(state => state.auth);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderBreakdown, setOrderBreakdown] = useState(null);

  // Create payment intent when component mounts
  useEffect(() => {
    if (cartItems && cartItems.length > 0 && shippingAddress) {
      createPaymentIntent();
    }
  }, [cartItems, shippingAddress]);

  const createPaymentIntent = async () => {
    try {
      setPaymentError('');
      
      if (!cartItems || cartItems.length === 0) {
        setPaymentError('Cart is empty');
        return;
      }

      console.log('[Stripe Checkout] Creating payment intent...');
      console.log('[Stripe Checkout] Cart items:', cartItems);
      
      const response = await api.post('/stripe/create-intent', {
        cartItems: cartItems,
        shippingAddress: shippingAddress,
        billingAddress: shippingAddress // Use same address for billing
      });

      if (response.success) {
        setClientSecret(response.client_secret);
        setPaymentIntent(response.payment_intent_id);
        setOrderTotal(response.amount);
        setOrderBreakdown(response.items);
        
        console.log('[Stripe Checkout] Payment intent created successfully');
        console.log(`[Stripe Checkout] Order total: $${response.amount}`);
        console.log(`[Stripe Checkout] Items: ${response.items?.length || 0}`);
        
        // Show order breakdown
        if (response.items && response.items.length > 1) {
          const sellerCount = new Set(response.items.map(item => item.seller_id)).size;
          console.log(`[Stripe Checkout] Multi-vendor order: ${sellerCount} sellers`);
          
          // Calculate commission breakdown
          let totalCommission = 0;
          let totalSellerPayout = 0;
          
          response.items.forEach(item => {
            const commission = Math.round(item.total * 0.15); // 15%
            const sellerPayout = item.total - commission;
            totalCommission += commission;
            totalSellerPayout += sellerPayout;
          });
          
          console.log(`[Stripe Checkout] Commission breakdown:`);
          console.log(`  - Customer pays: $${response.amount}`);
          console.log(`  - Admin commission: $${(totalCommission/100).toFixed(2)}`);
          console.log(`  - Seller payout: $${(totalSellerPayout/100).toFixed(2)}`);
        }
      } else {
        setPaymentError(response.error || 'Failed to create payment intent');
        console.error('[Stripe Checkout] Payment intent creation failed:', response.error);
      }
    } catch (error) {
      setPaymentError(error.message || 'Network error. Please try again.');
      console.error('[Stripe Checkout] Payment intent creation error:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    const cardElement = elements.getElement(CardElement);

    try {
      console.log('[Stripe Checkout] Processing payment...');
      
      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingAddress?.fullName || user?.name || 'Customer',
              email: shippingAddress?.email || user?.email,
              address: {
                line1: shippingAddress?.address,
                city: shippingAddress?.city,
                state: shippingAddress?.state,
                postal_code: shippingAddress?.zipCode,
                country: 'US' // Always use 2-character ISO country code
              }
            }
          }
        }
      );

      if (error) {
        console.error('[Stripe Checkout] Payment failed:', error);
        setPaymentError(error.message);
        toast.error(`Payment failed: ${error.message}`);
        
        if (onPaymentError) {
          onPaymentError(error);
        }
      } else if (confirmedPaymentIntent.status === 'succeeded') {
        console.log('[Stripe Checkout] Payment succeeded!');
        toast.success('Payment successful! Creating your order...');
        
        // Create order after successful payment
        await createOrderAfterPayment(confirmedPaymentIntent.id);
      }
    } catch (err) {
      console.error('[Stripe Checkout] Payment processing error:', err);
      setPaymentError('Payment processing failed. Please try again.');
      toast.error('Payment processing failed. Please try again.');
      
      if (onPaymentError) {
        onPaymentError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrderAfterPayment = async (paymentIntentId) => {
    try {
      console.log('[Order Creation] Creating order after payment...');
      
      const response = await api.post('/stripe/create-order', {
        payment_intent_id: paymentIntentId
      });

      if (response.success) {
        console.log('[Order Creation] Order created successfully!');
        console.log(`[Order Creation] Order ID: ${response.order_id}`);
        
        const splitResult = response.split_result;
        if (splitResult && splitResult.success) {
          console.log(`[Order Creation] Multi-vendor splitting: ${splitResult.sellers_count} sellers`);
          
          if (splitResult.is_multi_vendor) {
            toast.success(`Order created! Split across ${splitResult.sellers_count} sellers.`);
          } else {
            toast.success('Order created successfully!');
          }
        } else {
          toast.success('Order created successfully!');
        }

        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess({
            orderId: response.order_id,
            paymentIntentId: paymentIntentId,
            amount: orderTotal,
            splitResult: splitResult
          });
        }
      } else {
        console.error('[Order Creation] Order creation failed:', response.error);
        setPaymentError('Payment succeeded but order creation failed. Please contact support.');
        toast.error('Payment succeeded but order creation failed. Please contact support.');
        
        if (onPaymentError) {
          onPaymentError(new Error(response.error));
        }
      }
    } catch (error) {
      console.error('[Order Creation] Order creation error:', error);
      setPaymentError('Payment succeeded but order creation failed. Please contact support.');
      toast.error('Payment succeeded but order creation failed. Please contact support.');
      
      if (onPaymentError) {
        onPaymentError(error);
      }
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false
  };

  if (!clientSecret) {
    return (
      <div className="stripe-checkout-loading">
        <div className="loading-spinner"></div>
        <p>Preparing payment...</p>
      </div>
    );
  }

  return (
    <div className="stripe-checkout-form">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        <div className="order-total">
          <strong>Total: ${orderTotal}</strong>
        </div>
        
        {orderBreakdown && orderBreakdown.length > 0 && (
          <div className="order-breakdown">
            <h4>Order Details:</h4>
            {orderBreakdown.map((item, index) => (
              <div key={index} className="breakdown-item">
                <span className="item-name">{item.title}</span>
                <span className="item-total">${(item.total/100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        
        {cartItems && cartItems.length > 1 && (
          <p className="multi-vendor-note">
            This order contains items from multiple sellers and will be split automatically.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="card-element-container">
          <label htmlFor="card-element">
            Credit or Debit Card
          </label>
          <CardElement
            id="card-element"
            options={cardElementOptions}
            onChange={(event) => {
              if (event.error) {
                setPaymentError(event.error.message);
              } else {
                setPaymentError('');
              }
            }}
          />
        </div>

        {paymentError && (
          <div className="payment-error">
            <p>{paymentError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isProcessing || !clientSecret}
          className={`pay-button ${isProcessing ? 'processing' : ''}`}
        >
          {isProcessing ? (
            <>
              <span className="spinner"></span>
              Processing Payment...
            </>
          ) : (
            `Pay $${orderTotal}`
          )}
        </button>

        <div className="payment-security">
          <p>
            <span className="security-icon">🔒</span>
            Your payment information is secure and encrypted
          </p>
        </div>
      </form>

      <style jsx>{`
        .stripe-checkout-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .stripe-checkout-loading {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #FF9900;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .payment-summary {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .payment-summary h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .order-total {
          font-size: 24px;
          color: #FF9900;
          margin-bottom: 15px;
        }

        .order-breakdown {
          margin: 15px 0;
        }

        .order-breakdown h4 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .item-name {
          color: #666;
          flex: 1;
        }

        .item-total {
          color: #333;
          font-weight: 600;
        }

        .multi-vendor-note {
          font-size: 14px;
          color: #666;
          margin: 0;
          padding: 10px;
          background: #e8f4fd;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }

        .payment-form {
          space-y: 20px;
        }

        .card-element-container {
          margin-bottom: 20px;
        }

        .card-element-container label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .card-element-container .StripeElement {
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          background: white;
          transition: border-color 0.2s;
        }

        .card-element-container .StripeElement:focus {
          border-color: #FF9900;
          outline: none;
        }

        .payment-error {
          margin: 15px 0;
          padding: 12px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          color: #721c24;
        }

        .pay-button {
          width: 100%;
          padding: 15px;
          background: #FF9900;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .pay-button:hover:not(:disabled) {
          background: #F08804;
        }

        .pay-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .pay-button.processing {
          background: #6c757d;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .payment-security {
          margin-top: 20px;
          text-align: center;
        }

        .payment-security p {
          font-size: 14px;
          color: #666;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .security-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

// Main component wrapper with Stripe Elements provider
const StripeCheckoutFormUpdated = ({ cartItems, shippingAddress, onPaymentSuccess, onPaymentError }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        cartItems={cartItems}
        shippingAddress={shippingAddress}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default StripeCheckoutFormUpdated;