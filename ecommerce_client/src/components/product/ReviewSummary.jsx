import RatingStars from './RatingStars'

/**
 * ReviewSummary Component
 * Displays review statistics and rating distribution
 */
const ReviewSummary = ({ summary }) => {
  if (!summary) return null

  const { averageRating = 0, totalReviews = 0, percentages = {} } = summary

  return (
    <div className="flex gap-10 mb-8 p-6 bg-gray-100 rounded-lg flex-wrap">
      {/* Average Rating */}
      <div className="text-center min-w-[120px]">
        <div className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</div>
        <RatingStars rating={averageRating} size="xl" />
        <div className="text-sm text-gray-600 mt-1">{totalReviews.toLocaleString()} ratings</div>
      </div>

      {/* Rating Distribution Bars */}
      <div className="flex-1 min-w-[300px]">
        {[5, 4, 3, 2, 1].map((stars) => (
          <div key={stars} className="flex items-center gap-3 mb-1">
            <span className="w-16 text-sm">{stars} star</span>
            <div className="flex-1 h-5 bg-gray-300 rounded overflow-hidden">
              <div 
                className="h-full bg-orange-400 transition-all duration-300" 
                style={{ width: `${percentages[stars] || 0}%` }}
              ></div>
            </div>
            <span className="w-10 text-sm text-right">{percentages[stars] || 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReviewSummary
