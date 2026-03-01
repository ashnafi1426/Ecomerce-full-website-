import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const BrowsingHistoryPage = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrowsingHistory()
  }, [])

  const fetchBrowsingHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/browsing-history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(response.data.history || [])
    } catch (error) {
      console.error('Error fetching browsing history:', error)
      toast.error('Failed to load browsing history')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your browsing history?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/browsing-history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory([])
      toast.success('Browsing history cleared')
    } catch (error) {
      console.error('Error clearing history:', error)
      toast.error('Failed to clear history')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading browsing history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🕐 Browsing History</h1>
            <p className="text-gray-600">Products you've recently viewed</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {history.map((item) => (
            <Link
              key={item.id}
              to={`/product/${item.product_id}`}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden no-underline group"
            >
              <div className="relative h-48 bg-gray-100">
                <img
                  src={item.product?.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={item.product?.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600">
                  {item.product?.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-gray-900">
                    ${item.product?.price?.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Viewed {new Date(item.viewed_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {history.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-2">No browsing history</p>
            <p className="text-gray-400 text-sm">Products you view will appear here</p>
            <Link
              to="/"
              className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowsingHistoryPage
