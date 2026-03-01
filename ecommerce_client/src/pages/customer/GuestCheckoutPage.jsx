import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { guestAPI } from '../../services/api.service';
import { clearGuestCart } from '../../store/slices/guestCartSlice';
import { toast } from 'react-hot-toast';

const GuestCheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const guestCart = useSelector((state) => state.guestCart);
  
  const [step, setStep] = useState(1); // 1: Email, 2: Address, 3: Payment
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  useEffect(() => {
    // Load cart items with product details
    loadCartItems();
  }, [guestCart.items]);

  const loadCartItems = async () => {
    if (!guestCart.items || guestCart.items.length === 0) {
      return;
    }

    try {
      const itemsWithDetails = await Promise.all(
        guestCart.items.map(async (item) => {
          const response = await api.get(`/products/${item.product_id}`);
          return {
            ...item,
            product: response.data
          };
        })
      );

      setCartItems(itemsWithDetails);
      
      // Calculate total
      const total = itemsWithDetails.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
      }, 0);
      setCartTotal(total);
    } catch (error) {
      console.error('Failed to load cart items:', error);
    }
  };

  // Step 1: Email validation
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await guestAPI.validateGuestEmail(guestEmail);
      
      if (result.requiresLogin) {
        toast.info('This email is already registered. Please login.');
        navigate('/login');
        return;
      }
      
      toast.success('Email validated');
      setStep(2);
    } catch (error) {
      toast.error(error.message || 'Failed to validate email');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Address submission
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await guestAPI.createGuestUser(guestEmail, fullName, guestPhone);
      await guestAPI.saveGuestAddress({ 
        ...address, 
        guestEmail, 
        fullName, 
        phone: guestPhone 
      });
      
      toast.success('Address saved');
      setStep(3);
    } catch (error) {
      toast.error(error.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Place order
  const handlePlaceOrder = async (paymentMethod) => {
    setLoading(true);
    
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const result = await guestAPI.placeGuestOrder({
        sessionId: guestCart.sessionId,
        guestEmail,
        guestPhone,
        shippingAddress: address,
        paymentMethod,
        items: orderItems
      });
      
      toast.success('Order placed successfully!');
      dispatch(clearGuestCart());
      navigate(`/track-order?token=${result.data.trackingToken}`);
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!guestCart.items || guestCart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to your cart before checking out.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Guest Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Checkout Form */}
        <div className="lg:col-span-2">
          {/* Progress indicator */}
          <div className="flex justify-between mb-8 bg-white p-4 rounded-lg shadow">
            <div className={`flex-1 text-center ${step >= 1 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              Email
            </div>
            <div className={`flex-1 text-center ${step >= 2 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              Address
            </div>
            <div className={`flex-1 text-center ${step >= 3 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              Payment
            </div>
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Enter your email</h2>
              <p className="text-gray-600 mb-4">We'll use this to send you order updates</p>
              
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-orange-500 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <form onSubmit={handleAddressSubmit} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
                <input
                  type="text"
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  placeholder="123 Main Street"
                  required
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Address Line 2</label>
                <input
                  type="text"
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  placeholder="Apt, Suite, Unit (Optional)"
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="New York"
                    required
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State *</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    placeholder="NY"
                    required
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Postal Code *</label>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  placeholder="10001"
                  required
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-3 rounded hover:bg-orange-600 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : 'Continue to Payment'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <p className="text-gray-600 mb-6">Select your payment method</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handlePlaceOrder('card')}
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-4 rounded hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {loading ? 'Processing...' : 'Pay with Credit/Debit Card'}
                </button>
                
                <button
                  onClick={() => handlePlaceOrder('paypal')}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Pay with PayPal
                </button>

                <button
                  onClick={() => handlePlaceOrder('cod')}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-4 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Cash on Delivery
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded hover:bg-gray-300"
              >
                Back to Address
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.product_id} className="flex gap-3">
                  <img
                    src={item.product?.image_url || '/placeholder.png'}
                    alt={item.product?.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.product?.title}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold">${(item.product?.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>$10.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (8%)</span>
                <span>${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>${(cartTotal + 10 + cartTotal * 0.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCheckoutPage;
