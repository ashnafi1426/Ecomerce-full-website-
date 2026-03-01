import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecommendations(response.data.recommendations || [])
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">✨ Your Recommendations</h1>
          <p className="text-gray-600">Products picked just for you based on your browsing and purchase history</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendations.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden no-underline group"
            >
              <div className="relative h-48 bg-gray-100">
                <img
                  src={product.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600">
                  {product.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-gray-900">
                    ${product.price?.toFixed(2)}
                  </span>
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-gray-700">{product.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {recommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-2">No recommendations yet</p>
            <p className="text-gray-400 text-sm">Start browsing products to get personalized recommendations!</p>
            <Link
              to="/"
              className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors no-underline"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecommendationsPage
