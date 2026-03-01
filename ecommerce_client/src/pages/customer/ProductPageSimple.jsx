import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import { toast } from 'react-hot-toast'
import api from '../../config/api'
import StartChatButton from '../../components/chat/StartChatButton'
import RatingStars from '../../components/product/RatingStars'
import ReviewSummary from '../../components/product/ReviewSummary'
import ReviewList from '../../components/product/ReviewList'
import ReviewForm from '../../components/product/ReviewForm'

const ProductPageSimple = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviewSummary, setReviewSummary] = useState(null)
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        console.log('Fetching product with ID:', id)
        
        // Fetch product details
        const productData = await api.get(`/products/${id}`)
        console.log('Product data received:', productData)
        setProduct(productData)
        
        // Fetch review summary
        const summaryData = await api.get(`/reviews/product/${id}/summary`)
        console.log('Review summary:', summaryData)
        setReviewSummary(summaryData.summary)
        
        // Check if user can review (only if authenticated)
        if (isAuthenticated) {
          const canReviewData = await api.get(`/reviews/product/${id}/can-review`)
          setCanReview(canReviewData.canReview)
        }
      } catch (err) {
        console.error('Error fetching product data:', err)
        toast.error('Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchProductData()
    }
  }, [id, isAuthenticated])

  const handleAddToCart = async () => {
    setAddingToCart(true)
    
    try {
      const cartItem = {
        id: product.id,
        name: product.title || product.name,
        price: product.price,
        image: product.image_url || product.image,
        quantity,
        price_at_add: product.price
      }
      
      dispatch(addToCart(cartItem))
      
      toast.success('✓ Added to cart!', {
        duration: 2000,
        style: {
          background: '#067D62',
          color: '#fff',
        }
      })
    } catch (err) {
      console.error('Error adding to cart:', err)
      toast.error('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    setAddingToCart(true)
    
    try {
      const cartItem = {
        id: product.id,
        name: product.title || product.name,
        price: product.price,
        image: product.image_url || product.image,
        quantity,
        price_at_add: product.price
      }
      
      dispatch(addToCart(cartItem))
      navigate('/checkout')
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to proceed to checkout')
      setAddingToCart(false)
    }
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    setCanReview(false)
    // Refresh review summary
    api.get(`/reviews/product/${id}/summary`)
      .then(data => setReviewSummary(data.summary))
      .catch(err => console.error('Error refreshing summary:', err))
    toast.success('Thank you for your review!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-2xl text-gray-800 mb-4">Product not found</p>
          <Link to="/" className="text-blue-600 hover:text-orange-600 hover:underline">
            ← Return to Home
          </Link>
        </div>
      </div>
    )
  }

  // Mock images array (in real app, this would come from product.images)
  const images = [
    product.image_url || product.image || 'https://via.placeholder.com/500',
    product.image_url || product.image || 'https://via.placeholder.com/500',
    product.image_url || product.image || 'https://via.placeholder.com/500',
    product.image_url || product.image || 'https://via.placeholder.com/500'
  ]

  const originalPrice = product.original_price || product.price * 1.3
  const savings = originalPrice - product.price
  const savingsPercent = Math.round((savings / originalPrice) * 100)

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="px-5 py-4 text-sm text-gray-600">
        <Link to="/" className="text-blue-600 hover:text-orange-600 hover:underline">Home</Link>
        {' › '}
        <Link to={`/category/${product.category_slug || 'electronics'}`} className="text-blue-600 hover:text-orange-600 hover:underline">
          {product.category_name || 'Electronics'}
        </Link>
        {' › '}
        <span className="text-gray-800">{product.title || product.name}</span>
      </div>

      {/* Product Container */}
      <div className="max-w-[1500px] mx-auto px-5 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_400px] gap-8">
          
          {/* IMAGE GALLERY */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="flex flex-col gap-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 border-2 rounded cursor-pointer flex items-center justify-center overflow-hidden ${
                    selectedImage === idx ? 'border-orange-500' : 'border-gray-300 hover:border-orange-400'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
            
            {/* Main Image */}
            <div className="flex-1 border border-gray-300 rounded flex items-center justify-center bg-white" style={{ minHeight: '500px' }}>
              <img 
                src={images[selectedImage]} 
                alt={product.title || product.name}
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="px-5">
            <h1 className="text-2xl font-normal text-gray-900 mb-2 leading-tight">
              {product.title || product.name}
            </h1>

            {product.brand && (
              <Link to={`/brand/${product.brand}`} className="text-blue-600 hover:text-orange-600 hover:underline text-sm inline-block mb-3">
                Visit the {product.brand} Store
              </Link>
            )}

            {/* Rating */}
            {reviewSummary && reviewSummary.totalReviews > 0 && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-300">
                <RatingStars rating={reviewSummary.averageRating} size="lg" />
                <Link to="#reviews" className="text-blue-600 hover:text-orange-600 hover:underline text-sm">
                  {reviewSummary.averageRating.toFixed(1)} out of 5 stars
                </Link>
                <span className="text-sm text-gray-600">{reviewSummary.totalReviews.toLocaleString()} ratings</span>
              </div>
            )}

            {/* Price Section */}
            <div className="mb-5 pb-4 border-b border-gray-300">
              <span className="text-sm text-gray-600">Price:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl text-red-700">${Number(product.price).toFixed(2)}</span>
                {originalPrice > product.price && (
                  <>
                    <span className="text-gray-500 line-through text-base">${Number(originalPrice).toFixed(2)}</span>
                    <span className="text-red-600 text-sm">Save ${savings.toFixed(2)} ({savingsPercent}%)</span>
                  </>
                )}
              </div>
              {isAuthenticated && (
                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded text-sm mt-2">
                  <span>⚡</span>
                  <span>Prime FREE Delivery</span>
                </div>
              )}
            </div>

            {/* About this item */}
            <div className="mb-5">
              <h3 className="font-semibold text-base mb-2">About this item</h3>
              <ul className="space-y-2">
                {product.description && (
                  <li className="text-sm text-gray-800 pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                    {product.description}
                  </li>
                )}
                <li className="text-sm text-gray-800 pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  High quality product with excellent features
                </li>
                <li className="text-sm text-gray-800 pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  Fast shipping and secure packaging
                </li>
                <li className="text-sm text-gray-800 pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  30-day return policy for your peace of mind
                </li>
              </ul>
            </div>

            {/* Product Details */}
            <div className="mb-5">
              <h3 className="font-semibold text-base mb-2">Product Details</h3>
              <div className="space-y-2">
                {product.brand && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">Brand</span>
                    <span className="flex-1 text-gray-800">{product.brand}</span>
                  </div>
                )}
                {product.category_name && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">Category</span>
                    <span className="flex-1 text-gray-800">{product.category_name}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">SKU</span>
                    <span className="flex-1 text-gray-800">{product.sku}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">Weight</span>
                    <span className="flex-1 text-gray-800">{product.weight}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">Dimensions</span>
                    <span className="flex-1 text-gray-800">{product.dimensions}</span>
                  </div>
                )}
                <div className="flex text-sm">
                  <span className="font-semibold w-36">Stock Status</span>
                  <span className="flex-1 text-green-700 font-semibold">✓ In Stock</span>
                </div>
                {product.is_returnable && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">Returns</span>
                    <span className="flex-1 text-gray-800">30-day return policy</span>
                  </div>
                )}
                {product.shipping_cost !== undefined && (
                  <div className="flex text-sm">
                    <span className="font-semibold w-36">Shipping</span>
                    <span className="flex-1 text-gray-800">
                      {product.shipping_cost === 0 ? 'FREE Shipping' : `$${product.shipping_cost.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BUY BOX */}
          <div className="border border-gray-300 rounded-lg p-5 bg-white h-fit sticky top-5">
            <div className="text-3xl text-red-700 mb-3">${Number(product.price).toFixed(2)}</div>

            {/* Delivery Info */}
            <div className="bg-gray-100 p-4 rounded mb-4">
              <p className="text-sm mb-1">
                <strong>FREE delivery</strong> <span className="text-green-700 font-semibold">Wednesday, Feb 12</span>
              </p>
              <p className="text-sm mb-1">Order within <strong>5 hrs 23 mins</strong></p>
              <p className="text-sm">📍 Deliver to New York 10001</p>
            </div>

            <div className="text-green-700 font-semibold mb-4">✓ In Stock</div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block font-semibold text-sm mb-2">Quantity:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            {/* Add to Cart Button */}
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-orange-400 hover:bg-orange-500 text-gray-900 font-semibold py-3 rounded-lg mb-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            {/* Buy Now Button */}
            <button 
              onClick={handleBuyNow}
              disabled={addingToCart}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-lg mb-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>

            {/* Seller Info */}
            <div className="pt-5 border-t border-gray-300 text-sm">
              <p className="mb-2"><strong>Ships from:</strong> FastShop</p>
              <p className="mb-2">
                <strong>Sold by:</strong>{' '}
                {product.seller_name ? (
                  <Link to={`/seller/${product.seller_id}`} className="text-blue-600 hover:text-orange-600 hover:underline">
                    {product.seller_name}
                  </Link>
                ) : (
                  <span className="text-blue-600">FastShop Official</span>
                )}
              </p>
              <p className="mb-2">⭐ 98% positive ratings</p>
              <p className="mb-2">🔒 Secure transaction</p>
              <p>🔄 30-day return policy</p>
            </div>

            {/* Ask Seller Button */}
            {product.seller_id && (
              <div className="mt-4">
                <StartChatButton
                  recipientId={product.seller_id}
                  recipientName={product.seller_name || 'Seller'}
                  recipientRole="seller"
                  metadata={{
                    type: 'product_inquiry',
                    productId: product.id,
                    productName: product.title || product.name
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  💬 Ask Seller
                </StartChatButton>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCT INFORMATION SECTIONS */}
        <div className="mt-12 max-w-[1200px] mx-auto">
          {/* Product Information Table */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Product Information</h2>
            <table className="w-full">
              <tbody>
                {product.brand && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm w-1/3">Brand</td>
                    <td className="py-3 text-sm">{product.brand}</td>
                  </tr>
                )}
                {product.sku && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Model Number</td>
                    <td className="py-3 text-sm">{product.sku}</td>
                  </tr>
                )}
                {product.category_name && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Category</td>
                    <td className="py-3 text-sm">{product.category_name}</td>
                  </tr>
                )}
                {product.weight && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Item Weight</td>
                    <td className="py-3 text-sm">{product.weight}</td>
                  </tr>
                )}
                {product.dimensions && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Product Dimensions</td>
                    <td className="py-3 text-sm">{product.dimensions}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-200">
                  <td className="py-3 font-semibold text-sm">Availability</td>
                  <td className="py-3 text-sm text-green-700 font-semibold">In Stock</td>
                </tr>
                {product.is_returnable !== undefined && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Return Policy</td>
                    <td className="py-3 text-sm">
                      {product.is_returnable ? '30-day return policy' : 'Non-returnable'}
                    </td>
                  </tr>
                )}
                {product.shipping_cost !== undefined && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Shipping</td>
                    <td className="py-3 text-sm">
                      {product.shipping_cost === 0 ? (
                        <span className="text-green-700 font-semibold">FREE Shipping</span>
                      ) : (
                        `$${product.shipping_cost.toFixed(2)}`
                      )}
                    </td>
                  </tr>
                )}
                {product.seller_name && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Sold by</td>
                    <td className="py-3 text-sm">
                      <Link to={`/seller/${product.seller_id}`} className="text-blue-600 hover:text-orange-600 hover:underline">
                        {product.seller_name}
                      </Link>
                    </td>
                  </tr>
                )}
                {product.created_at && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 font-semibold text-sm">Date First Available</td>
                    <td className="py-3 text-sm">
                      {new Date(product.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Product Description</h2>
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Technical Specifications */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.brand && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold text-sm w-40">Brand Name</span>
                  <span className="text-sm text-gray-800">{product.brand}</span>
                </div>
              )}
              {product.sku && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold text-sm w-40">Model Number</span>
                  <span className="text-sm text-gray-800">{product.sku}</span>
                </div>
              )}
              {product.weight && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold text-sm w-40">Weight</span>
                  <span className="text-sm text-gray-800">{product.weight}</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold text-sm w-40">Dimensions</span>
                  <span className="text-sm text-gray-800">{product.dimensions}</span>
                </div>
              )}
              {product.max_quantity_per_order && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold text-sm w-40">Max Order Qty</span>
                  <span className="text-sm text-gray-800">{product.max_quantity_per_order} units</span>
                </div>
              )}
              {product.min_quantity_per_order && (
                <div className="flex border-b border-gray-200 pb-2">
                  <span className="font-semibold text-sm w-40">Min Order Qty</span>
                  <span className="text-sm text-gray-800">{product.min_quantity_per_order} unit(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Additional Information</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm">
                  <strong>Secure transaction:</strong> Your transaction is secure. We work hard to protect your security and privacy.
                </span>
              </div>
              {product.is_returnable && (
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm">
                    <strong>Easy returns:</strong> 30-day return policy for your peace of mind.
                  </span>
                </div>
              )}
              {product.shipping_cost === 0 && (
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm">
                    <strong>FREE Shipping:</strong> Enjoy free shipping on this item.
                  </span>
                </div>
              )}
              <div className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-sm">
                  <strong>Customer Support:</strong> 24/7 customer service available.
                </span>
              </div>
              {product.total_sales > 0 && (
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">📊</span>
                  <span className="text-sm">
                    <strong>Popular item:</strong> {product.total_sales} units sold
                  </span>
                </div>
              )}
              {product.view_count > 0 && (
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">👁️</span>
                  <span className="text-sm">
                    <strong>Views:</strong> {product.view_count.toLocaleString()} people viewed this item
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-12" id="reviews">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

          {/* Review Summary */}
          {reviewSummary && <ReviewSummary summary={reviewSummary} />}

          {/* Write Review Button/Form */}
          {isAuthenticated && canReview && !showReviewForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-orange-400 hover:bg-orange-500 text-gray-900 font-semibold px-6 py-3 rounded transition-colors"
              >
                Write a Review
              </button>
            </div>
          )}

          {/* Review Form */}
          {isAuthenticated && showReviewForm && (
            <ReviewForm
              productId={id}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          {/* Login Prompt */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">
                <Link to="/login" className="font-semibold hover:underline">Login</Link> to write a review
              </p>
            </div>
          )}

          {/* Reviews List */}
          <ReviewList productId={id} currentUserId={user?.id} />
        </div>
      </div>
    </div>
  )
}

export default ProductPageSimple
