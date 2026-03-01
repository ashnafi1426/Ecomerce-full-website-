import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const DealsPage = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, week, month

  useEffect(() => {
    fetchDeals()
  }, [filter])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/deals`, {
        params: { filter }
      })
      setDeals(response.data.deals || [])
    } catch (error) {
      console.error('Error fetching deals:', error)
      toast.error('Failed to load deals')
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscount = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice) return 0
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏷️ Today's Deals</h1>
          <p className="text-gray-600">Limited time offers and special discounts</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Deals
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'today'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today Only
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'week'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'month'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deals.map((product) => {
            const discount = calculateDiscount(product.original_price, product.price)
            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden no-underline group"
              >
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-bold z-10">
                    -{discount}%
                  </div>
                )}

                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600">
                    {product.title}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-900">
                      ${product.price?.toFixed(2)}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.original_price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-gray-700">{product.rating.toFixed(1)}</span>
                      {product.review_count > 0 && (
                        <span className="text-gray-500">({product.review_count})</span>
                      )}
                    </div>
                  )}

                  {/* Deal End Time */}
                  {product.deal_end_time && (
                    <div className="mt-2 text-xs text-red-600 font-medium">
                      ⏰ Ends: {new Date(product.deal_end_time).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No deals available at the moment</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new offers!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DealsPage
