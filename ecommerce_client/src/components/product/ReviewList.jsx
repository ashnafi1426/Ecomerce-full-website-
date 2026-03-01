import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import ReviewCard from './ReviewCard'
import api from '../../config/api'

/**
 * ReviewList Component
 * Displays paginated list of product reviews with sorting
 */
const ReviewList = ({ productId, currentUserId }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchReviews()
  }, [productId, sortBy, pagination.page])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/reviews/product/${productId}`, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          sortBy
        }
      })

      setReviews(response.reviews || [])
      setPagination(response.pagination || pagination)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleHelpfulUpdate = (reviewId, action) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === reviewId
          ? {
              ...review,
              helpful_count: action === 'added' 
                ? review.helpful_count + 1 
                : review.helpful_count - 1
            }
          : review
      )
    )
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading reviews...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-lg">No reviews yet</p>
        <p className="text-sm mt-2">Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-300">
        <div className="text-lg font-semibold">
          {pagination.total} {pagination.total === 1 ? 'Review' : 'Reviews'}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-0">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onHelpfulUpdate={handleHelpfulUpdate}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {[...Array(pagination.totalPages)].map((_, index) => {
              const pageNum = index + 1
              // Show first page, last page, current page, and pages around current
              if (
                pageNum === 1 ||
                pageNum === pagination.totalPages ||
                (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`
                      px-4 py-2 border rounded
                      ${pageNum === pagination.page
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-gray-300 hover:bg-gray-100'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                )
              } else if (
                pageNum === pagination.page - 2 ||
                pageNum === pagination.page + 2
              ) {
                return <span key={pageNum} className="px-2 py-2">...</span>
              }
              return null
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default ReviewList
