import { useState, useEffect } from 'react'
import api from '../../config/api'
import { toast } from 'react-toastify'

const CustomerReviewsPage = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, avgRating: 0, helpfulVotes: 0 })

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews/my-reviews')
      setReviews(response.data.data || [])
      calculateStats(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reviewsData) => {
    const total = reviewsData.length
    const avgRating = total > 0 
      ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : 0
    const helpfulVotes = reviewsData.reduce((sum, r) => sum + (r.helpfulCount || 0), 0)
    setStats({ total, avgRating, helpfulVotes })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    
    try {
      await api.delete(`/reviews/${id}`)
      toast.success('Review deleted')
      fetchReviews()
    } catch (error) {
      toast.error('Failed to delete review')
    }
  }

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Your Reviews</h1>
      <p className="text-gray-600 mb-8">Manage your product reviews and ratings</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-amazon-orange mb-2">{stats.total}</div>
          <div className="text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-amazon-orange mb-2">{stats.avgRating}</div>
          <div className="text-gray-600">Average Rating</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-amazon-orange mb-2">{stats.helpfulVotes}</div>
          <div className="text-gray-600">Helpful Votes</div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
            <p className="text-gray-600">Start reviewing products you've purchased!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-4xl">
                    {review.product?.emoji || '📦'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{review.product?.name || 'Product'}</h3>
                    <div className="text-sm text-gray-600">
                      Purchased on {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="text-2xl text-amazon-orange mb-3">
                {renderStars(review.rating)}
              </div>

              <h4 className="text-lg font-semibold mb-2">{review.title}</h4>
              <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>

              <div className="text-sm text-gray-600 mb-3">
                Reviewed on {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                {review.helpfulCount || 0} people found this helpful
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomerReviewsPage
