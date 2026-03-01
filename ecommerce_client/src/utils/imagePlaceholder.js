/**
 * Image Placeholder Utility
 * Generates inline SVG placeholders to replace via.placeholder.com
 */

/**
 * Generate an inline SVG data URL for placeholder images
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} textColor - Text color (hex without #)
 * @param {string} text - Text to display
 * @returns {string} Data URL for the SVG
 */
export const generatePlaceholder = (
  width = 400,
  height = 400,
  bgColor = '667eea',
  textColor = 'ffffff',
  text = 'Product'
) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect fill="#${bgColor}" width="${width}" height="${height}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        fill="#${textColor}"
      >${text}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * Common placeholder presets
 */
export const PLACEHOLDERS = {
  product: generatePlaceholder(400, 400, '667eea', 'ffffff', 'Product'),
  productSmall: generatePlaceholder(50, 50, '667eea', 'ffffff', '📦'),
  test: generatePlaceholder(400, 400, '667eea', 'ffffff', 'Test'),
  noImage: generatePlaceholder(400, 400, 'f3f4f6', '9ca3af', 'No Image'),
};

/**
 * Get a fallback image for broken images
 * @param {string} altText - Alternative text for the image
 * @returns {string} Data URL for fallback image
 */
export const getFallbackImage = (altText = 'Product') => {
  return generatePlaceholder(400, 400, 'f3f4f6', '6b7280', altText);
};

export default {
  generatePlaceholder,
  PLACEHOLDERS,
  getFallbackImage
};
