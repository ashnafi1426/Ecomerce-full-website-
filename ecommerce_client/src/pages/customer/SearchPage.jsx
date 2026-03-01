import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { customerAPI } from '../../services/api.service'
import StartChatButton from '../../components/chat/StartChatButton'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    if (query) {
      searchProducts()
    } else {
      setLoading(false)
    }
  }, [query, sortBy])

  const searchProducts = async () => {
    setLoading(true)
    try {
      console.log('🔍 Searching for:', query, 'with sort:', sortBy)
      
      const response = await customerAPI.searchProducts({ 
        q: query, 
        sort: sortBy,
        limit: 50 
      })
      
      console.log('🔍 Search response:', response)
      
      const productList = Array.isArray(response) ? response : response?.products || []
      setProducts(productList)
      
    } catch (error) {
      console.error('❌ Failed to search products:', error)
      toast.error('Failed to search products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`)
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0)
    const emptyStars = 5 - fullStars
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-5">
        <div className="flex gap-5">
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </aside>
          <main className="flex-1">
            <div className="mb-5">
              <div className="h-8 bg-gray-200 rounded w-64 mb-3 animate-pulse"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-5">
      <div className="flex gap-5">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold mb-4">Department</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">Electronics</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">Fashion</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">Home & Garden</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">Sports</span>
              </label>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold mb-4">Price</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">Under $25</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">$25 to $50</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">$50 to $100</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm">$100 & Above</span>
              </label>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">Customer Review</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm text-yellow-500">★★★★★</span>
                <span className="text-sm">& Up</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm text-yellow-500">★★★★☆</span>
                <span className="text-sm">& Up</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm text-yellow-500">★★★☆☆</span>
                <span className="text-sm">& Up</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-5">
            <h1 className="text-3xl font-bold mb-3">
              {query ? `Results for "${query}"` : 'Search Products'}
            </h1>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {products.length > 0 ? `1-${products.length} of ${products.length} results` : 'No results'}
              </div>
              <select
                className="p-2 border border-gray-300 rounded cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {query && (
            <div className="bg-gray-100 p-4 rounded-lg mb-5">
              <h3 className="text-sm font-semibold mb-2">Related searches:</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(query + ' wireless')}`)}
                  className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm hover:bg-orange-400 hover:text-white hover:border-orange-400"
                >
                  {query} wireless
                </button>
                <button 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(query + ' premium')}`)}
                  className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm hover:bg-orange-400 hover:text-white hover:border-orange-400"
                >
                  {query} premium
                </button>
                <button 
                  onClick={() => navigate(`/search?q=${encodeURIComponent(query + ' best')}`)}
                  className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm hover:bg-orange-400 hover:text-white hover:border-orange-400"
                >
                  best {query}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title || product.name}
                        className="w-full h-48 object-cover rounded mb-3"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-3 flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm mb-2 h-10 overflow-hidden line-clamp-2">
                    {product.title || product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-2 text-sm">
                    <span className="text-yellow-500">
                      {renderStars(product.average_rating || product.rating)}
                    </span>
                    <span className="text-blue-600">
                      ({product.total_reviews || product.reviews_count || 0})
                    </span>
                  </div>
                  <div className="text-xl font-bold mb-1 text-blue-600">
                    ${Number(product.price).toFixed(2)}
                    {product.original_price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        ${Number(product.original_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.seller_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      by {product.seller_name}
                    </p>
                  )}
                </div>
                
                {/* Chat Button */}
                {product.seller_id && (
                  <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                    <StartChatButton
                      recipientId={product.seller_id}
                      recipientName={product.seller_name || 'Seller'}
                      recipientRole="seller"
                      metadata={{
                        type: 'product_inquiry',
                        productId: product.id,
                        productName: product.title || product.name,
                        source: 'search_results'
                      }}
                      className="w-full text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      Chat with Seller
                    </StartChatButton>
                  </div>
                )}
              </div>
            ))}
          </div>

          {products.length === 0 && query && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No results found for "{query}"</h3>
              <p className="text-gray-600 mb-4">Try different keywords or check your spelling</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Suggestions:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button 
                    onClick={() => navigate('/search?q=electronics')}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200"
                  >
                    Electronics
                  </button>
                  <button 
                    onClick={() => navigate('/search?q=fashion')}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200"
                  >
                    Fashion
                  </button>
                  <button 
                    onClick={() => navigate('/search?q=home')}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200"
                  >
                    Home & Garden
                  </button>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse All Products
              </button>
            </div>
          )}

          {!query && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Start Your Search</h3>
              <p className="text-gray-600">Enter a search term to find products</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default SearchPage
