import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../config/api'
import { toast } from 'react-toastify'

const TrackingPage = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`)
      setOrder(response.data)
    } catch (error) {
      toast.error('Failed to load tracking information')
    } finally {
      setLoading(false)
    }
  }

  const trackingSteps = [
    { status: 'pending', label: 'Order Placed', icon: '📝', date: order?.created_at },
    { status: 'processing', label: 'Processing', icon: '⚙️', date: order?.processing_date },
    { status: 'shipped', label: 'Shipped', icon: '📦', date: order?.shipped_date },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', date: order?.out_for_delivery_date },
    { status: 'delivered', label: 'Delivered', icon: '✅', date: order?.delivered_date }
  ]

  const currentStepIndex = trackingSteps.findIndex(step => step.status === order?.status)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-5 py-8">
        <Link to="/orders" className="text-amazon-blue hover:underline mb-4 inline-block">
          ← Back to Orders
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-600 mb-6">Order #{order?.order_number || order?.id}</p>

          {/* Tracking Timeline */}
          <div className="relative">
            {trackingSteps.map((step, index) => (
              <div key={step.status} className="flex items-start mb-8 last:mb-0">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl z-10 ${
                    index <= currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {step.icon}
                  </div>
                  {index < trackingSteps.length - 1 && (
                    <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  )}
                </div>
                
                <div className="ml-6 flex-1">
                  <h3 className={`font-bold text-lg ${
                    index <= currentStepIndex ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </h3>
                  {step.date && (
                    <p className="text-sm text-gray-600">
                      {new Date(step.date).toLocaleString()}
                    </p>
                  )}
                  {index === currentStepIndex && (
                    <p className="text-sm text-amazon-orange font-semibold mt-1">Current Status</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm text-gray-600">
                {order?.shipping_address?.fullName}<br />
                {order?.shipping_address?.address}<br />
                {order?.shipping_address?.city}, {order?.shipping_address?.state} {order?.shipping_address?.zipCode}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Estimated Delivery</h3>
              <p className="text-sm text-gray-600">
                {order?.estimated_delivery 
                  ? new Date(order.estimated_delivery).toLocaleDateString()
                  : 'To be determined'}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Items in this order</h3>
            <div className="space-y-4">
              {order?.items?.map((item, index) => (
                <div key={index} className="flex gap-4">
                  {item.product?.image && item.product.image.startsWith('http') ? (
                    <img
                      src={item.product.image}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E📦%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl rounded border">
                      📦
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="font-semibold hover:text-amazon-orange"
                    >
                      {item.product?.name}
                    </Link>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm font-bold">${item.price?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackingPage
