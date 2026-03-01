import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { customerAPI } from '../../services/api.service'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchOrders()
    
    // Handle navigation state from payment success
    if (location.state?.showSuccess && location.state?.newOrderId) {
      toast.success(`Order #${location.state.newOrderId.substring(0, 8)} placed successfully!`)
      // Clear the state to prevent showing the message again
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Force refresh when component mounts or when coming from payment
  useEffect(() => {
    const forceRefresh = () => {
      console.log('🔄 Force refreshing orders...')
      fetchOrders()
    }
    
    // Refresh immediately
    forceRefresh()
    
    // Also refresh when window gains focus (user comes back from payment)
    window.addEventListener('focus', forceRefresh)
    
    return () => {
      window.removeEventListener('focus', forceRefresh)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 Fetching orders...')
      
      // Make API call with error handling
      let response
      try {
        response = await customerAPI.getOrders()
        console.log('✅ Orders API call successful')
      } catch (apiError) {
        console.error('❌ Orders API call failed:', apiError)
        throw apiError
      }
      
      console.log('📊 Orders response:', response)
      console.log('   Response type:', typeof response)
      console.log('   Is array:', Array.isArray(response))
      
      // Handle different possible formats with defensive checks
      let ordersData = []
      
      try {
        if (!response) {
          console.warn('⚠️ Response is null or undefined')
          ordersData = []
        } else if (Array.isArray(response)) {
          // Direct array
          ordersData = response
          console.log('✅ Response is direct array')
        } else if (typeof response === 'object') {
          // Try different object structures
          if (response.orders && Array.isArray(response.orders)) {
            ordersData = response.orders
            console.log('✅ Found orders in response.orders')
          } else if (response.data?.orders && Array.isArray(response.data.orders)) {
            ordersData = response.data.orders
            console.log('✅ Found orders in response.data.orders')
          } else if (response.data && Array.isArray(response.data)) {
            ordersData = response.data
            console.log('✅ Found orders in response.data')
          } else {
            console.warn('⚠️ Unknown response structure:', response)
            ordersData = []
          }
        } else {
          console.warn('⚠️ Response is not an object or array:', typeof response)
          ordersData = []
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError)
        ordersData = []
      }
      
      console.log(`📋 Final orders data: ${ordersData.length} orders`)
      if (ordersData.length > 0) {
        console.log('   Sample order:', {
          id: ordersData[0].id,
          status: ordersData[0].status,
          total: ordersData[0].total,
          items: ordersData[0].items?.length || 0
        })
      }
      
      setOrders(ordersData)
      
      // Show success message if orders found
      if (ordersData.length > 0) {
        console.log(`✅ Successfully loaded ${ordersData.length} orders`)
      } else {
        console.log('ℹ️ No orders found')
      }
      
    } catch (error) {
      console.error('❌ Failed to load orders:', error)
      console.error('   Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      toast.error(error.message || 'Failed to load orders. Please try refreshing the page.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      packed: 'bg-purple-100 text-purple-800',
      shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusDisplayName = (status) => {
    const displayNames = {
      pending_payment: 'Pending Payment',
      paid: 'Paid',
      confirmed: 'Confirmed',
      packed: 'Packed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    }
    return displayNames[status] || status
  }

  const getStatusDescription = (status) => {
    const descriptions = {
      pending_payment: 'Payment is being processed',
      paid: 'Payment completed successfully',
      confirmed: 'Order confirmed and being prepared',
      packed: 'Order packed and ready to ship',
      shipped: 'Order is on the way',
      delivered: 'Order has been delivered',
      cancelled: 'Order was cancelled',
      refunded: 'Order has been refunded'
    }
    return descriptions[status] || 'Order status'
  }

  // Filter orders based on search term, status, and date range
  const filteredOrders = orders.filter(order => {
    // Status filter
    const statusMatch = filter === 'all' || order.status === filter
    
    // Search filter
    const searchMatch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => 
        item.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    // Date range filter
    let dateMatch = true
    if (dateRange !== 'all') {
      const orderDate = new Date(order.created_at)
      const now = new Date()
      
      switch (dateRange) {
        case 'last30':
          dateMatch = (now - orderDate) <= (30 * 24 * 60 * 60 * 1000)
          break
        case 'last90':
          dateMatch = (now - orderDate) <= (90 * 24 * 60 * 60 * 1000)
          break
        case 'thisYear':
          dateMatch = orderDate.getFullYear() === now.getFullYear()
          break
        default:
          dateMatch = true
      }
    }
    
    return statusMatch && searchMatch && dateMatch
  })

  // Get order counts for each status
  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      pending_payment: 0,
      paid: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0
    }
    
    orders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status]++
      }
    })
    
    return counts
  }

  // Cancel order function
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setCancellingOrder(orderId)
      await customerAPI.cancelOrder(orderId)
      toast.success('Order cancelled successfully')
      fetchOrders() // Refresh orders
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error(error.message || 'Failed to cancel order')
    } finally {
      setCancellingOrder(null)
    }
  }

  // Export orders function
  const handleExportOrders = () => {
    try {
      const csvContent = [
        ['Order ID', 'Date', 'Status', 'Total', 'Items'].join(','),
        ...filteredOrders.map(order => [
          order.id,
          new Date(order.created_at).toLocaleDateString(),
          order.status,
          `$${order.total?.toFixed(2) || '0.00'}`,
          order.items?.length || 0
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Orders exported successfully')
    } catch (error) {
      console.error('Failed to export orders:', error)
      toast.error('Failed to export orders')
    }
  }

  const orderCounts = getOrderCounts()

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h1 className="text-3xl font-normal">Your Orders</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="thisYear">This Year</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportOrders}
              disabled={filteredOrders.length === 0}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered')
                fetchOrders()
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF9900] hover:bg-[#F08804] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filter Tabs with Counts */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending_payment', label: 'Pending Payment' },
              { key: 'paid', label: 'Paid' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'packed', label: 'Packed' },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'cancelled', label: 'Cancelled' },
              { key: 'refunded', label: 'Refunded' }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilter(status.key)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                  filter === status.key
                    ? 'border-b-2 border-[#FF9900] text-[#FF9900]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{status.label}</span>
                {orderCounts[status.key] > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    filter === status.key
                      ? 'bg-[#FF9900] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {orderCounts[status.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900]"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">
              {searchTerm || dateRange !== 'all' 
                ? 'No matching orders found' 
                : filter === 'all' 
                  ? 'No orders found' 
                  : `No ${getStatusDisplayName(filter).toLowerCase()} orders found`
              }
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || dateRange !== 'all'
                ? 'Try adjusting your search or filters'
                : filter === 'all' 
                  ? "You haven't placed any orders yet" 
                  : `You don't have any ${getStatusDisplayName(filter).toLowerCase()} orders`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!searchTerm && dateRange === 'all' && (
                <Link
                  to="/"
                  className="inline-block bg-[#FF9900] hover:bg-[#F08804] text-white px-8 py-3 rounded font-semibold"
                >
                  Start Shopping
                </Link>
              )}
              {(filter !== 'all' || searchTerm || dateRange !== 'all') && (
                <button
                  onClick={() => {
                    setFilter('all')
                    setSearchTerm('')
                    setDateRange('all')
                  }}
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <p>Just made a purchase? It may take a moment to appear.</p>
              <button
                onClick={() => {
                  console.log('🔄 Refresh from no orders section')
                  fetchOrders()
                }}
                className="text-[#FF9900] hover:underline mt-2"
              >
                Click here to refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Summary */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                  {searchTerm && ` matching "${searchTerm}"`}
                  {dateRange !== 'all' && ` from ${dateRange.replace('last', 'last ').replace('thisYear', 'this year')}`}
                </p>
                {(searchTerm || dateRange !== 'all' || filter !== 'all') && (
                  <button
                    onClick={() => {
                      setFilter('all')
                      setSearchTerm('')
                      setDateRange('all')
                    }}
                    className="text-[#FF9900] hover:underline text-sm"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 uppercase">Order Placed</div>
                    <div className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 uppercase">Total</div>
                    <div className="font-semibold">${order.total?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 uppercase">Ship To</div>
                    <div className="font-semibold">{order.shipping_address?.fullName || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600 uppercase mb-1">Order # {order.order_number || order.id}</div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-amazon-blue hover:text-[#C7511F] hover:underline text-sm font-semibold"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                      {order.status === 'delivered' ? 'Delivered' : 
                       order.status === 'shipped' ? 'On the way' :
                       order.status === 'packed' ? 'Packed and ready to ship' :
                       order.status === 'confirmed' ? 'Order confirmed' :
                       order.status === 'paid' ? 'Payment received' :
                       order.status === 'pending_payment' ? 'Awaiting payment' :
                       order.status === 'cancelled' ? 'Cancelled' : 
                       order.status === 'refunded' ? 'Refunded' : 'Processing'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusDisplayName(order.status)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex gap-4">
                        {item.product?.image_url && item.product.image_url.startsWith('http') ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product?.title || item.product?.name || item.title}
                            className="w-24 h-24 object-cover rounded border"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E📦%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : item.product?.image && item.product.image.startsWith('http') ? (
                          <img
                            src={item.product.image}
                            alt={item.product?.title || item.product?.name || item.title}
                            className="w-24 h-24 object-cover rounded border"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E📦%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : item.image_url && item.image_url.startsWith('http') ? (
                          <img
                            src={item.image_url}
                            alt={item.product?.title || item.product?.name || item.title}
                            className="w-24 h-24 object-cover rounded border"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E📦%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl rounded border">
                            📦
                          </div>
                        )}
                        <div className="flex-1">
                          <Link
                            to={`/product/${item.product_id}`}
                            className="font-semibold hover:text-amazon-orange line-clamp-2"
                          >
                            {item.product?.title || item.product?.name || item.title || 'Product'}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                          <p className="text-sm font-bold mt-1">${(item.price * item.quantity)?.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link
                            to={`/product/${item.product_id}`}
                            className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold hover:bg-gray-50 text-center"
                          >
                            Buy Again
                          </Link>
                          {order.status === 'delivered' && (
                            <Link
                              to={`/customer/reviews?product=${item.product_id}`}
                              className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold hover:bg-gray-50 text-center"
                            >
                              Write Review
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-amazon-blue hover:underline text-sm"
                      >
                        View {order.items.length - 3} more items
                      </Link>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-6 py-2 bg-[#FF9900] hover:bg-[#F08804] text-white rounded font-semibold"
                    >
                      Track Package
                    </Link>
                    {(order.status === 'pending_payment' || order.status === 'paid' || order.status === 'confirmed') && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingOrder === order.id}
                        className="px-6 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <Link
                        to={`/customer/returns?order=${order.id}`}
                        className="px-6 py-2 border border-gray-300 rounded font-semibold hover:bg-gray-50"
                      >
                        Return Items
                      </Link>
                    )}
                    {order.status === 'shipped' && (
                      <button className="px-6 py-2 border border-gray-300 rounded font-semibold hover:bg-gray-50">
                        Contact Seller
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage
