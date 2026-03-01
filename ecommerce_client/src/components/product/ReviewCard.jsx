import { useState } from 'react'
import { toast } from 'react-hot-toast'
import RatingStars from './RatingStars'
import api from '../../config/api'

/**
 * ReviewCard Component
 * Displays a single product review
 */
const ReviewCard = ({ review, onHelpfulUpdate, currentUserId }) => {
  const [isHelpful, setIsHelpful] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0)
  const [loading, setLoading] = useState(false)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const handleHelpfulClick = async () => {
    if (!currentUserId) {
      toast.error('Please login to mark reviews as helpful')
      return
    }

    setLoading(true)
    try {
      const response = await api.post(`/reviews/${review.id}/helpful`)
      
      if (response.action === 'added') {
        setIsHelpful(true)
        setHelpfulCount(prev => prev + 1)
        toast.success('Marked as helpful')
      } else {
        setIsHelpful(false)
        setHelpfulCount(prev => prev - 1)
        toast.success('Removed helpful mark')
      }

      if (onHelpfulUpdate) {
        onHelpfulUpdate(review.id, response.action)
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error)
      toast.error('Failed to update helpful status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-b border-gray-300 pb-6 mb-6">
      {/* Review Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl flex-shrink-0">
          {getInitials(review.user_name)}
        </div>
        <div>
          <div className="font-semibold">{review.user_name || 'Anonymous'}</div>
          <RatingStars rating={review.rating} size="sm" />
        </div>
        {review.verified_purchase && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
            ✓ Verified Purchase
          </span>
        )}
      </div>

      {/* Review Date */}
      <div className="text-sm text-gray-600 mb-2">
        Reviewed in the United States on {formatDate(review.created_at)}
      </div>

      {/* Review Title */}
      {review.title && (
        <div className="mb-2">
          <strong>{review.title}</strong>
        </div>
      )}

      {/* Review Text */}
      <div className="text-gray-800 leading-relaxed mb-3">
        {review.review_text}
      </div>

      {/* Helpful Button */}
      <div className="mt-3 text-sm text-gray-600 flex items-center gap-3">
        <button 
          onClick={handleHelpfulClick}
          disabled={loading}
          className={`
            border rounded px-4 py-1 transition-colors
            ${isHelpful 
              ? 'border-orange-500 bg-orange-50 text-orange-700' 
              : 'border-gray-300 hover:bg-gray-100'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          👍 Helpful
        </button>
        {helpfulCount > 0 && (
          <span>{helpfulCount.toLocaleString()} {helpfulCount === 1 ? 'person' : 'people'} found this helpful</span>
        )}
      </div>
    </div>
  )
}

export default ReviewCard
