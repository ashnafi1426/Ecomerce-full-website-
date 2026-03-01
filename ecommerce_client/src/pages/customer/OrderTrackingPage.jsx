import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { guestAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const OrderTrackingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Manual tracking form
  const [trackingEmail, setTrackingEmail] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      trackOrderByToken(token);
    }
  }, [searchParams]);

  const trackOrderByToken = async (token) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await guestAPI.trackOrderByToken(token);
      setOrder(response.data);
    } catch (err) {
      setError(err.message || 'Failed to track order');
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTracking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await guestAPI.trackGuestOrder(trackingEmail, trackingOrderId);
      setOrder(response.data);
      toast.success('Order found!');
    } catch (err) {
      setError(err.message || 'Failed to track order');
      toast.error('Order not found. Please check your email and order ID.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'processing':
        return '📦';
      case 'shipped':
        return '🚚';
      case 'delivered':
        return '🎉';
      case 'cancelled':
        return '❌';
      case 'refunded':
        return '💰';
      default:
        return '📋';
    }
  };

  if (loading && !order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Track Your Order</h1>

      {/* Manual Tracking Form */}
      {!order && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enter Order Details</h2>
          <form onSubmit={handleManualTracking} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={trackingEmail}
                onChange={(e) => setTrackingEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Order ID</label>
              <input
                type="text"
                value={trackingOrderId}
                onChange={(e) => setTrackingOrderId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Order Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h2>
                <p className="text-gray-600">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full ${getStatusColor(order.status)} font-semibold flex items-center gap-2`}>
                <span>{getStatusIcon(order.status)}</span>
                <span className="capitalize">{order.status}</span>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold mb-4">Order Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.status !== 'pending' && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-gray-600">Processing your order</p>
                    </div>
                  </div>
                )}

                {['shipped', 'delivered'].includes(order.status) && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium">Order Shipped</p>
                      <p className="text-sm text-gray-600">Your order is on the way</p>
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-gray-600">Order has been delivered</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Shipping Address</h3>
            {order.shipping_address && (
              <div className="text-gray-700">
                {typeof order.shipping_address === 'string' ? (
                  <pre className="whitespace-pre-wrap">{order.shipping_address}</pre>
                ) : (
                  <>
                    <p>{order.shipping_address.addressLine1}</p>
                    {order.shipping_address.addressLine2 && (
                      <p>{order.shipping_address.addressLine2}</p>
                    )}
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.state}{' '}
                      {order.shipping_address.postalCode}
                    </p>
                    <p>{order.shipping_address.country || 'US'}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
                  <img
                    src={item.products?.image_url || '/placeholder.png'}
                    alt={item.products?.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.products?.title}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-1">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${order.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> {order.guest_email}
              </p>
              {order.guest_phone && (
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {order.guest_phone}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Need Help?</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/contact')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded hover:bg-gray-200"
              >
                Contact Support
              </button>
              
              {order.status === 'delivered' && (
                <button
                  onClick={() => navigate(`/orders/${order.id}/return`)}
                  className="w-full bg-orange-500 text-white py-3 rounded hover:bg-orange-600"
                >
                  Request Return
                </button>
              )}

              <button
                onClick={() => {
                  setOrder(null);
                  setTrackingEmail('');
                  setTrackingOrderId('');
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded hover:bg-gray-200"
              >
                Track Another Order
              </button>
            </div>
          </div>

          {/* Create Account Prompt */}
          {order.guest_email && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow p-6 border border-orange-200">
              <h3 className="font-semibold mb-2">Create an Account</h3>
              <p className="text-gray-700 mb-4">
                Save your order history and enjoy faster checkout next time!
              </p>
              <button
                onClick={() => navigate(`/register?email=${order.guest_email}`)}
                className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
