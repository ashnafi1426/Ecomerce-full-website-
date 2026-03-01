import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../../config/api'
import StartChatButton from '../../components/chat/StartChatButton'

const SellerProfilePage = () => {
  const { sellerId } = useParams()
  const navigate = useNavigate()
  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sellerId) {
      fetchSellerProfile()
      fetchSellerProducts()
    }
  }, [sellerId])

  const fetchSellerProfile = async () => {
    try {
      const response = await api.get(`/sellers/${sellerId}`)
      setSeller(response.data || response)
    } catch (error) {
      console.error('Error fetching seller:', error)
      toast.error('Failed to load seller profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchSellerProducts = async () => {
    try {
      const response = await api.get(`/products?seller_id=${sellerId}`)
      setProducts(response.data?.products || response.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Seller Not Found</h2>
        <button
          onClick={() => navigate('/sellers')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Browse All Sellers
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Seller Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {seller.display_name?.charAt(0) || seller.store_name?.charAt(0) || 'S'}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {seller.display_name || seller.store_name || 'Seller'}
            </h1>
            {seller.store_name && seller.display_name !== seller.store_name && (
              <p className="text-lg text-gray-600 mb-3">{seller.store_name}</p>
            )}
            
            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div>
                <span className="text-2xl font-bold text-blue-600">
                  {seller.total_products || products.length || 0}
                </span>
                <span className="text-gray-600 ml-2">Products</span>
              </div>
              {seller.rating && (
                <div>
                  <span className="text-2xl font-bold text-yellow-500">
                    {seller.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-600 ml-2">Rating</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <StartChatButton
                recipientId={seller.id}
                recipientName={seller.display_name || seller.store_name || 'Seller'}
                recipientRole="seller"
                metadata={{
                  type: 'seller_inquiry',
                  storeName: seller.store_name,
                  source: 'seller_profile'
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                💬 Chat with Seller
              </StartChatButton>
              
              <button
                onClick={() => navigate(`/search?seller_id=${seller.id}`)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View All Products
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Products from this Seller</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.slice(0, 8).map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
              >
                {product.image_url && product.image_url.startsWith('http') ? (
                  <img
                    src={product.image_url}
                    alt={product.name || product.title}
                    className="w-full h-48 object-cover rounded mb-3"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="80"%3E📦%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl rounded mb-3">
                    📦
                  </div>
                )}
                <h3 className="text-sm mb-2 h-10 overflow-hidden line-clamp-2">
                  {product.name || product.title}
                </h3>
                <div className="text-xl font-bold text-blue-600">
                  ${Number(product.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600">No products available from this seller</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerProfilePage
