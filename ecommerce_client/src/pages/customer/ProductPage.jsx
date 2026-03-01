import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import { toast } from 'react-hot-toast'
import api from '../../config/api'
import StartChatButton from '../../components/chat/StartChatButton'
import { PLACEHOLDERS } from '../../utils/imagePlaceholder'

const ProductPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Core product state
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Enhanced features state
  const [stockStatus, setStockStatus] = useState('IN_STOCK')
  const [availableQuantity, setAvailableQuantity] = useState(0)
  const [badges, setBadges] = useState([])
  const [productImages, setProductImages] = useState([])
  const [addingToCart, setAddingToCart] = useState(false)
  
  // Wishlist state
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
      checkWishlistStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching product:', id)
      
      // Fetch product from enhanced view
      const response = await api.get(`/products/${id}`)
      const productData = response.data
      
      console.log('Product data received:', productData)
      
      // Normalize product data
      const normalizedProduct = {
        ...productData,
        name: productData.title || productData.name,
        image: productData.image_url || productData.image,
        price: Number(productData.price),
        original_price: productData.original_price ? Number(productData.price * 1.6) : Number(productData.price * 1.6),
        rating: productData.average_rating || productData.rating || 4.3,
        reviews_count: productData.total_reviews || productData.reviews_count || 1234,
        seller_name: productData.seller_name || 'FastShop',
        seller_id: productData.seller_id || 1,
        stock_status: productData.stock_status || 'IN_STOCK',
        available_quantity: productData.available_quantity || 100,
        badges: productData.badges || [],
        max_quantity_per_order: productData.max_quantity_per_order || 10,
        min_quantity_per_order: productData.min_quantity_per_order || 1
      }
      
      setProduct(normalizedProduct)
      setStockStatus(normalizedProduct.stock_status)
      setAvailableQuantity(normalizedProduct.available_quantity)
      
      // Safely parse badges
      let parsedBadges = []
      if (normalizedProduct.badges) {
        if (typeof normalizedProduct.badges === 'string') {
          try {
            parsedBadges = JSON.parse(normalizedProduct.badges)
          } catch (e) {
            console.warn('Failed to parse badges:', e)
            parsedBadges = []
          }
        } else if (Array.isArray(normalizedProduct.badges)) {
          parsedBadges = normalizedProduct.badges
        }
      }
      setBadges(parsedBadges)
      
      // Set product images
      const images = productData.images || (productData.image_url ? [productData.image_url] : [productData.image || PLACEHOLDERS.product])
      setProductImages(images)
      
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err.message || 'Failed to load product')
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    // Validate stock
    if (stockStatus === 'OUT_OF_STOCK') {
      toast.error('This product is currently out of stock')
      return
    }
    
    // Validate quantity
    if (quantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} items available`)
      return
    }
    
    if (quantity > product.max_quantity_per_order) {
      toast.error(`Maximum ${product.max_quantity_per_order} items per order`)
      return
    }
    
    setAddingToCart(true)
    
    try {
      // Add to cart with inventory locking
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        price_at_add: product.price // Track price at time of adding
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
    if (!product) return
    
    // Validate stock
    if (stockStatus === 'OUT_OF_STOCK') {
      toast.error('This product is currently out of stock')
      return
    }
    
    setAddingToCart(true)
    
    try {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
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

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return // User not logged in
      
      const response = await api.get(`/wishlist/check/${id}`)
      setIsInWishlist(response.data.isInWishlist)
    } catch (err) {
      console.error('Error checking wishlist status:', err)
    }
  }

  const handleToggleWishlist = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login to add items to wishlist')
        navigate('/login')
        return
      }
      
      setWishlistLoading(true)
      
      if (isInWishlist) {
        await api.delete(`/wishlist/${id}`)
        setIsInWishlist(false)
        toast.success('Removed from wishlist')
      } else {
        await api.post('/wishlist', { productId: id })
        setIsInWishlist(true)
        toast.success('Added to wishlist')
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err)
      toast.error(err.response?.data?.message || 'Failed to update wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
            <p className="mt-4 text-[#565959]">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-[1500px] mx-auto px-5 py-5">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Product</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button
              onClick={fetchProduct}
              className="bg-[#FF9900] text-[#0F1111] px-6 py-2 rounded-lg hover:bg-[#F08804] transition-colors font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Product Not Found
  if (!product) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-[1500px] mx-auto px-5 py-5">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-4">Product Not Found</h2>
            <Link 
              to="/" 
              className="text-[#007185] hover:text-[#C7511F] hover:underline"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const images = productImages.length > 0 ? productImages : [product.image || PLACEHOLDERS.product]
  const rating = product.rating || 4.3
  const reviews = product.reviews_count || 1234
  const originalPrice = product.original_price || product.price * 1.6
  const savings = originalPrice - product.price
  const savingsPercent = Math.round((savings / originalPrice) * 100)
  
  // Calculate delivery date (simple estimation)
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 2)
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // Badge rendering helper
  const renderBadge = (badge) => {
    if (!badge || !badge.type) return null
    
    const badgeStyles = {
      best_seller: 'bg-[#FF9900] text-white',
      amazons_choice: 'bg-[#232F3E] text-white',
      deal: 'bg-[#CC0C39] text-white',
      limited_time: 'bg-[#B12704] text-white',
      new_arrival: 'bg-[#067D62] text-white',
      top_rated: 'bg-[#007185] text-white'
    }
    
    return (
      <span 
        key={badge.type}
        className={`inline-block px-3 py-1 rounded text-xs font-semibold ${badgeStyles[badge.type] || 'bg-gray-600 text-white'}`}
      >
        {badge.text || badge.type.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[#D5D9D9]">
        <div className="max-w-[1500px] mx-auto px-5 py-4 text-sm">
          <Link to="/" className="text-[#007185] hover:text-[#C7511F] hover:underline">Home</Link>
          <span className="mx-2 text-[#565959]">›</span>
          <Link to={`/category/${product.category}`} className="text-[#007185] hover:text-[#C7511F] hover:underline">
            {product.category}
          </Link>
          <span className="mx-2 text-[#565959]">›</span>
          <span className="text-[#0F1111]">{product.name}</span>
        </div>
      </div>

      {/* Product Container */}
      <div className="max-w-[1500px] mx-auto px-5 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Image Gallery - 5 columns */}
          <div className="lg:col-span-5">
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 border-2 rounded cursor-pointer flex items-center justify-center ${
                      selectedImage === index ? 'border-[#FF9900]' : 'border-[#D5D9D9]'
                    } hover:border-[#FF9900] transition-colors`}
                  >
                    {img && img.startsWith('http') ? (
                      <img 
                        src={img} 
                        alt={`${product.name} ${index + 1}`} 
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23f3f4f6" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="32"%3E📦%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl rounded">
                        📦
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Main Image */}
              <div className="flex-1">
                <div className="border border-[#D5D9D9] rounded-lg overflow-hidden relative">
                  {/* Badges Overlay */}
                  {badges && badges.length > 0 && (
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                      {badges.slice(0, 2).map((badge, idx) => badge && <span key={idx}>{renderBadge(badge)}</span>)}
                    </div>
                  )}
                  {images[selectedImage] && images[selectedImage].startsWith('http') ? (
                    <img
                      src={images[selectedImage]}
                      alt={product.name}
                      className="w-full h-[500px] object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23f3f4f6" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="120"%3E📦%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-9xl">
                      📦
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info - 4 columns */}
          <div className="lg:col-span-4">
            {/* Badges */}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map((badge, idx) => badge && <span key={idx}>{renderBadge(badge)}</span>)}
              </div>
            )}
            
            <h1 className="text-2xl font-normal text-[#0F1111] mb-2 leading-tight">{product.name}</h1>
            
            <Link to={`/seller/${product.seller_id}`} className="text-[#007185] hover:text-[#C7511F] hover:underline text-sm inline-block mb-3">
              Visit the {product.seller_name || 'Store'}
            </Link>
            
            {/* Rating Section */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#D5D9D9]">
              <div className="flex text-[#FF9900] text-lg">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                ))}
              </div>
              <a href="#reviews" className="text-[#007185] hover:text-[#C7511F] hover:underline text-sm">
                {rating} out of 5 stars
              </a>
              <span className="text-[#007185] text-sm">{reviews.toLocaleString()} ratings</span>
            </div>

            {/* Price Section */}
            <div className="mb-4 pb-4 border-b border-[#D5D9D9]">
              <div className="text-sm text-[#565959] mb-1">Price:</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl text-[#B12704] font-normal">${product.price.toFixed(2)}</span>
                {originalPrice > product.price && (
                  <>
                    <span className="text-sm text-[#565959] line-through">${originalPrice.toFixed(2)}</span>
                    <span className="text-sm text-[#CC0C39]">Save ${savings.toFixed(2)} ({savingsPercent}%)</span>
                  </>
                )}
              </div>
              <div className="inline-flex items-center gap-2 bg-[#007185] text-white px-3 py-1 rounded text-sm">
                <span>⚡</span>
                <span>Prime FREE Delivery</span>
              </div>
            </div>

            {/* About This Item */}
            <div className="mb-6">
              <h3 className="font-bold text-[#0F1111] mb-3">About this item</h3>
              <ul className="space-y-2">
                <li className="text-sm text-[#0F1111] pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  {product.description}
                </li>
                <li className="text-sm text-[#0F1111] pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  Premium quality materials and construction
                </li>
                <li className="text-sm text-[#0F1111] pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  Fast and reliable shipping
                </li>
                <li className="text-sm text-[#0F1111] pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  30-day return policy
                </li>
                <li className="text-sm text-[#0F1111] pl-5 relative before:content-['•'] before:absolute before:left-0 before:font-bold">
                  Secure transaction guaranteed
                </li>
              </ul>
            </div>

            {/* Product Details */}
            {product.specifications && (
              <div className="mb-6">
                <h3 className="font-bold text-[#0F1111] mb-3">Product Details</h3>
                <div className="space-y-0">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex py-2 border-b border-[#F7F8F8]">
                      <div className="font-semibold text-[#0F1111] w-36 text-sm">{key}</div>
                      <div className="flex-1 text-[#0F1111] text-sm">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buy Box - 3 columns */}
          <div className="lg:col-span-3">
            <div className="border border-[#D5D9D9] rounded-lg p-5 sticky top-5">
              <div className="text-3xl text-[#B12704] font-normal mb-3">${product.price.toFixed(2)}</div>
              
              {/* Delivery Info */}
              <div className="bg-[#F7F8F8] rounded p-3 mb-4">
                <p className="text-sm text-[#0F1111] mb-1">
                  <strong>FREE delivery</strong> <span className="text-[#067D62] font-semibold">{deliveryDateStr}</span>
                </p>
                <p className="text-sm text-[#0F1111] mb-1">
                  Order within <strong>5 hrs 23 mins</strong>
                </p>
                <p className="text-sm text-[#0F1111]">📍 Deliver to New York 10001</p>
              </div>
              
              {/* Stock Status */}
              {stockStatus === 'IN_STOCK' && (
                <div className="text-[#067D62] font-semibold mb-4">✓ In Stock</div>
              )}
              {stockStatus === 'LOW_STOCK' && (
                <div className="text-[#B12704] font-semibold mb-4">⚠ Only {availableQuantity} left in stock - order soon</div>
              )}
              {stockStatus === 'OUT_OF_STOCK' && (
                <div className="text-[#CC0C39] font-semibold mb-4">✗ Currently unavailable</div>
              )}
              
              {/* Quantity Selector */}
              {stockStatus !== 'OUT_OF_STOCK' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[#0F1111] mb-2">Quantity:</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full border border-[#D5D9D9] rounded px-3 py-2 text-[#0F1111] focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900] outline-none"
                  >
                    {[...Array(Math.min(product.max_quantity_per_order, availableQuantity, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Action Buttons */}
              {stockStatus !== 'OUT_OF_STOCK' && (
                <>
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] py-3 rounded-lg font-semibold mb-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  
                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                    className="w-full bg-[#FFA41C] hover:bg-[#FF8F00] text-[#0F1111] py-3 rounded-lg font-semibold mb-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                  
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                    className="w-full border-2 border-[#D5D9D9] hover:border-[#FF9900] text-[#0F1111] py-3 rounded-lg font-semibold mb-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">{isInWishlist ? '❤️' : '🤍'}</span>
                    {wishlistLoading ? 'Updating...' : isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                  </button>
                  
                  {/* Chat with Seller Button */}
                  <StartChatButton
                    recipientId={product.seller_id}
                    recipientName={product.seller_name || 'Seller'}
                    recipientRole="seller"
                    metadata={{
                      type: 'product_inquiry',
                      productId: product.id,
                      productName: product.name,
                      productPrice: product.price
                    }}
                    className="w-full border-2 border-[#007185] hover:bg-[#007185] text-[#007185] hover:text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">💬</span>
                    Chat with Seller
                  </StartChatButton>
                </>
              )}
              
              {/* Seller Info */}
              <div className="pt-4 border-t border-[#D5D9D9] text-sm space-y-2">
                <p className="text-[#0F1111]">
                  <strong>Ships from:</strong> FastShop
                </p>
                <p className="text-[#0F1111]">
                  <strong>Sold by:</strong>{' '}
                  <Link to={`/seller/${product.seller_id}`} className="text-[#007185] hover:text-[#C7511F] hover:underline">
                    {product.seller_name || 'FastShop'}
                  </Link>
                </p>
                <p className="text-[#0F1111]">⭐ 98% positive ratings (5,432 ratings)</p>
                <p className="text-[#0F1111]">🔒 Secure transaction</p>
                <p className="text-[#0F1111]">🔄 30-day return policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-12" id="reviews">
          <h2 className="text-3xl font-bold text-[#0F1111] mb-6">Customer Reviews</h2>
          
          {/* Review Summary */}
          <div className="bg-[#F7F8F8] rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-5xl font-bold text-[#0F1111] mb-2">{rating}</div>
                <div className="flex justify-center text-[#FF9900] text-2xl mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.floor(rating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <div className="text-sm text-[#565959]">{reviews.toLocaleString()} ratings</div>
              </div>
              
              {/* Rating Bars */}
              <div className="md:col-span-2 space-y-2">
                {[
                  { stars: 5, percentage: 65 },
                  { stars: 4, percentage: 20 },
                  { stars: 3, percentage: 10 },
                  { stars: 2, percentage: 3 },
                  { stars: 1, percentage: 2 }
                ].map(({ stars, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="w-16 text-sm text-[#0F1111]">{stars} star</div>
                    <div className="flex-1 h-5 bg-[#D5D9D9] rounded overflow-hidden">
                      <div 
                        className="h-full bg-[#FF9900]" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-sm text-[#565959]">{percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-6">
            {[
              {
                name: 'John Smith',
                rating: 5,
                date: 'February 5, 2026',
                verified: true,
                title: 'Amazing sound quality and comfort!',
                text: 'These headphones exceeded my expectations. The noise cancellation is incredible - I can\'t hear anything when it\'s on. The battery life is exactly as advertised, lasting me through multiple long flights. The comfort is outstanding, I can wear them for hours without any discomfort. Highly recommended!',
                helpful: 234
              },
              {
                name: 'Sarah Johnson',
                rating: 4,
                date: 'February 3, 2026',
                verified: true,
                title: 'Great headphones, minor issues',
                text: 'Overall very satisfied with these headphones. The sound quality is excellent and the ANC works well. My only complaint is that the Bluetooth connection occasionally drops when I\'m far from my device. Other than that, they\'re perfect for daily use.',
                helpful: 156
              },
              {
                name: 'Michael Chen',
                rating: 5,
                date: 'January 28, 2026',
                verified: true,
                title: 'Best purchase of the year!',
                text: 'I\'ve tried many headphones over the years, and these are by far the best. The build quality is premium, the sound is crystal clear, and the noise cancellation is top-notch. Worth every penny!',
                helpful: 189
              }
            ].map((review, index) => (
              <div key={index} className="border-b border-[#D5D9D9] pb-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl">
                    👤
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F1111]">{review.name}</div>
                    <div className="flex text-[#FF9900]">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-[#565959] mb-2">
                  {review.verified && <span className="text-[#FF9900] font-semibold mr-2">✓ Verified Purchase</span>}
                  Reviewed in the United States on {review.date}
                </div>
                <div className="mb-3">
                  <div className="font-bold text-[#0F1111] mb-1">{review.title}</div>
                  <div className="text-[#0F1111] leading-relaxed">{review.text}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button className="border border-[#D5D9D9] px-4 py-1 rounded hover:bg-[#F7F8F8] transition-colors text-[#0F1111]">
                    👍 Helpful
                  </button>
                  <span className="text-[#565959]">{review.helpful} people found this helpful</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
