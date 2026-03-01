import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/redux'
import { addToCart } from '../../store/slices/cartSlice'
import { customerAPI } from '../../services/api.service'
import { toast } from 'react-hot-toast'

const WishlistPage = () => {
  const dispatch = useAppDispatch()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching wishlist...')
      const response = await customerAPI.getWishlist()
      console.log('✅ Wishlist fetched:', response)
      
      setWishlist(response.wishlist || response.items || [])
    } catch (err) {
      console.error('❌ Error fetching wishlist:', err)
      const errorMessage = err.message || 'Failed to load wishlist'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId) => {
    try {
      console.log('🗑️ Removing from wishlist:', productId)
      await customerAPI.removeFromWishlist(productId)
      setWishlist(wishlist.filter(item => 
        (item.id !== productId && item.product_id !== productId) &&
        (item.product?.id !== productId)
      ))
      toast.success('Removed from wishlist')
    } catch (err) {
      console.error('❌ Error removing from wishlist:', err)
      toast.error(err.message || 'Failed to remove item')
    }
  }

  const handleAddToCart = async (product) => {
    try {
      console.log('🛒 Adding to cart:', product)
      
      // Add to cart via API
      await customerAPI.addToCart({
        productId: product.id,
        quantity: 1
      })
      
      // Also update Redux store for immediate UI feedback
      dispatch(addToCart({ 
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1 
      }))
      
      toast.success('Added to cart!')
    } catch (err) {
      console.error('❌ Error adding to cart:', err)
      toast.error(err.message || 'Failed to add to cart')
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-normal">Your Wishlist</h1>
          {wishlist.length > 0 && (
            <span className="text-gray-600">{wishlist.length} items</span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Save items you love for later</p>
            <Link
              to="/"
              className="inline-block bg-amazon-orange hover:bg-[#F08804] text-white px-8 py-3 rounded font-semibold"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Link to={`/product/${item.product_id}`}>
                    {item.product?.image && item.product.image.startsWith('http') ? (
                      <img
                        src={item.product.image}
                        alt={item.product?.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="80"%3E📦%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
                  >
                    ❌
                  </button>
                </div>
                
                <div className="p-4">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="font-semibold text-sm mb-2 hover:text-amazon-orange line-clamp-2 block"
                  >
                    {item.product?.name}
                  </Link>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-amazon-orange text-sm">
                      {'★'.repeat(Math.floor(item.product?.rating || 4))}
                      {'☆'.repeat(5 - Math.floor(item.product?.rating || 4))}
                    </div>
                    <span className="text-xs text-gray-600">
                      ({item.product?.reviews_count || 0})
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-xl font-bold">${item.product?.price}</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    disabled={item.product?.stock_quantity === 0}
                    className="w-full bg-amazon-orange hover:bg-[#F08804] text-white py-2 rounded font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {item.product?.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistPage
