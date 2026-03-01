import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../config/api'
import { toast } from 'react-toastify'
import StartChatButton from '../../components/chat/StartChatButton'
import StartSupportChatButton from '../../components/chat/StartSupportChatButton'

const OrderDetailPage = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderDetail()
  }, [orderId])

  const fetchOrderDetail = async () => {
    try {
      console.log('Fetching order:', orderId)
      const response = await api.get(`/orders/${orderId}`)
      console.log('Order data received:', response)
      
      // The API interceptor returns response.data, which is { success: true, data: {...} }
      // So we need to access response.data (not response.data.data)
      const orderData = response.data || response
      console.log('Setting order:', orderData)
      setOrder(orderData)
    } catch (error) {
      console.error('Failed to fetch order:', orderId, error)
      toast.error(`Failed to load order details (ID: ${orderId})`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <p className="text-gray-600 mb-4">The order you're looking for doesn't exist</p>
        <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
          Order ID: {orderId}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-amazon-orange text-white rounded hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Order Details</h1>
      <p className="text-gray-600 mb-8">Order #{order.id}</p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Order Date</div>
            <div className="font-semibold">
              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="font-semibold text-xl">${order.total?.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="font-semibold text-green-600">{order.status}</div>
          </div>
        </div>

        {/* Contact Support Button */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex gap-3">
            <StartSupportChatButton
              metadata={{
                type: 'order_support',
                orderId: order.id,
                orderStatus: order.status
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              💬 Contact Support
            </StartSupportChatButton>
            
            {order.seller_id && (
              <StartChatButton
                recipientId={order.seller_id}
                recipientName={order.seller_name || 'Seller'}
                recipientRole="seller"
                metadata={{
                  type: 'order_inquiry',
                  orderId: order.id,
                  orderNumber: order.order_number || order.id,
                  orderStatus: order.status
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors border border-gray-300"
              >
                💬 Message Seller
              </StartChatButton>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold mb-4">Shipping Address</h3>
          <div className="text-gray-700">
            {order.shippingAddress?.fullName}<br />
            {order.shippingAddress?.addressLine1}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br />
            {order.shippingAddress?.country}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded flex items-center justify-center text-4xl">
                {item.product?.emoji || '📦'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{item.product?.name}</h4>
                <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                <div className="text-lg font-bold text-amazon-orange mt-2">
                  ${item.price?.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage
