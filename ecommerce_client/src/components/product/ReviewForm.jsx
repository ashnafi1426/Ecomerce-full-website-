import { useState } from 'react'
import { toast } from 'react-hot-toast'
import RatingStars from './RatingStars'
import api from '../../config/api'

/**
 * ReviewForm Component
 * Form for submitting product reviews
 */
const ReviewForm = ({ productId, onReviewSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (title.trim().length === 0) {
      toast.error('Please enter a review title')
      return
    }

    if (reviewText.trim().length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    setSubmitting(true)

    try {
      const response = await api.post(`/reviews/product/${productId}`, {
        rating,
        title: title.trim(),
        reviewText: reviewText.trim()
      })

      toast.success('Review submitted successfully!')
      
      // Reset form
      setRating(0)
      setTitle('')
      setReviewText('')

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(response.review)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Rating Selection */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Your Rating *</label>
          <RatingStars 
            rating={rating}
            interactive={true}
            onChange={setRating}
            size="xl"
          />
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
            </p>
          )}
        </div>

        {/* Review Title */}
        <div className="mb-4">
          <label htmlFor="review-title" className="block font-semibold mb-2">
            Review Title *
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={200}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
        </div>

        {/* Review Text */}
        <div className="mb-4">
          <label htmlFor="review-text" className="block font-semibold mb-2">
            Your Review *
          </label>
          <textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={6}
            minLength={10}
            maxLength={2000}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{reviewText.length}/2000 characters (minimum 10)</p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="bg-orange-400 hover:bg-orange-500 text-gray-900 font-semibold px-6 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ReviewForm
