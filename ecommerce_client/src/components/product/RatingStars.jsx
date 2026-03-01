import { useState } from 'react'

/**
 * RatingStars Component
 * Displays star ratings with optional interactivity
 */
const RatingStars = ({ 
  rating = 0, 
  totalStars = 5, 
  size = 'md', 
  interactive = false,
  onChange = null,
  showNumber = false
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(rating)

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const handleClick = (value) => {
    if (interactive && onChange) {
      setSelectedRating(value)
      onChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const displayRating = interactive ? (hoverRating || selectedRating) : rating

  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${sizeClasses[size]} ${interactive ? 'cursor-pointer' : ''}`}>
        {[...Array(totalStars)].map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= Math.floor(displayRating)
          const isHalf = !isFilled && starValue === Math.ceil(displayRating) && displayRating % 1 !== 0

          return (
            <span
              key={index}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              className={`
                ${isFilled ? 'text-orange-500' : isHalf ? 'text-orange-500' : 'text-gray-300'}
                ${interactive ? 'hover:text-orange-400 transition-colors' : ''}
              `}
            >
              {isFilled ? '★' : isHalf ? '⯨' : '☆'}
            </span>
          )
        })}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default RatingStars
