/**
 * Placeholder Image Utility
 * 
 * Provides fallback images when product images are not available
 * Uses placehold.co instead of via.placeholder.com (which has DNS issues)
 */

/**
 * Generate a placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to display
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} textColor - Text color (hex without #)
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (
  width = 400,
  height = 400,
  text = 'Product',
  bgColor = '667eea',
  textColor = 'ffffff'
) => {
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`
}

/**
 * Generate a data URI placeholder (no external dependency)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to display
 * @param {string} bgColor - Background color (hex with #)
 * @param {string} textColor - Text color (hex with #)
 * @returns {string} Data URI
 */
export const getDataURIPlaceholder = (
  width = 400,
  height = 400,
  text = 'Product',
  bgColor = '#667eea',
  textColor = '#ffffff'
) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="sans-serif" 
        font-size="24" 
        fill="${textColor}"
      >${text}</text>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Default placeholder images for different contexts
 */
export const PLACEHOLDER_IMAGES = {
  product: getPlaceholderImage(400, 400, 'Product', '667eea', 'ffffff'),
  productSmall: getPlaceholderImage(50, 50, 'Product', '667eea', 'ffffff'),
  test: getPlaceholderImage(400, 400, 'Test', '667eea', 'ffffff'),
  pending: getPlaceholderImage(400, 400, 'Pending', 'FF9900', 'ffffff'),
  noImage: getPlaceholderImage(400, 400, 'No Image', 'cccccc', '666666'),
}

/**
 * Get a safe image URL with fallback
 * @param {string} imageUrl - Original image URL
 * @param {string} fallback - Fallback placeholder type
 * @returns {string} Safe image URL
 */
export const getSafeImageUrl = (imageUrl, fallback = 'product') => {
  if (!imageUrl || imageUrl.trim() === '') {
    return PLACEHOLDER_IMAGES[fallback] || PLACEHOLDER_IMAGES.product
  }
  
  // Replace old via.placeholder.com URLs with placehold.co
  if (imageUrl.includes('via.placeholder.com')) {
    return imageUrl.replace('via.placeholder.com', 'placehold.co')
  }
  
  return imageUrl
}

export default {
  getPlaceholderImage,
  getDataURIPlaceholder,
  PLACEHOLDER_IMAGES,
  getSafeImageUrl
}
