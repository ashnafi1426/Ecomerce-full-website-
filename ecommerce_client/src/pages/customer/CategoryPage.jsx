import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { customerAPI } from '../../services/api.service'

const CategoryPage = () => {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    sortBy: 'featured'
  })

  useEffect(() => {
    fetchCategoryData()
  }, [categoryId])

  useEffect(() => {
    if (category) {
      fetchCategoryProducts()
    }
  }, [filters.sortBy, categoryId])

  const fetchCategoryData = async () => {
    try {
      setLoading(true)
      console.log('🏷️ Fetching category data for ID:', categoryId)

      // Fetch category info and products
      const [categoriesRes, productsRes] = await Promise.all([
        customerAPI.getCategories(),
        customerAPI.getCategoryProducts(categoryId, { 
          limit: 50,
          sort: filters.sortBy 
        })
      ])

      console.log('📂 Categories response:', categoriesRes)
      console.log('📦 Category products response:', productsRes)

      // Find the specific category
      const categoryList = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.categories || []
      const foundCategory = categoryList.find(cat => cat.id == categoryId)
      
      if (foundCategory) {
        setCategory(foundCategory)
      } else {
        setCategory({ id: categoryId, name: 'Category' })
      }

      // Set products
      const productList = Array.isArray(productsRes) ? productsRes : productsRes?.products || []
      setProducts(productList)

    } catch (error) {
      console.error('❌ Failed to load category data:', error)
      toast.error('Failed to load category products')
      setCategory({ id: categoryId, name: 'Category' })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryProducts = async () => {
    try {
      console.log('🔄 Fetching products for category:', categoryId, 'with sort:', filters.sortBy)
      
      const response = await customerAPI.getCategoryProducts(categoryId, { 
        limit: 50,
        sort: filters.sortBy 
      })
      
      const productList = Array.isArray(response) ? response : response?.products || []
      setProducts(productList)
      
    } catch (error) {
      console.error('❌ Failed to load category products:', error)
      toast.error('Failed to load products')
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
        <div className="bg-gray-100 px-5 py-4 mb-5 text-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="flex gap-5">
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </aside>
          <main className="flex-1">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
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
      {/* Breadcrumb */}
      <div className="bg-gray-100 px-5 py-4 mb-5 text-sm">
        <button 
          onClick={() => navigate('/')}
          className="text-blue-600 hover:underline"
        >
          Home
        </button>
        <span className="text-gray-600 mx-2">›</span>
        <span className="text-gray-600">{category?.name || 'Category'}</span>
      </div>

      <div className="flex gap-5">
        {/* Sidebar Filters */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold mb-4">Price</h3>
            <div className="space-y-2 mb-3">
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
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                value={filters.priceMin}
                onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                value={filters.priceMax}
                onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
              />
            </div>
            <button className="w-full mt-3 p-2 bg-orange-400 text-white rounded hover:bg-orange-500">
              Go
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
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
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold mb-1">{category?.name || 'Products'}</h1>
              <div className="text-sm text-gray-600">
                1-{products.length} of {products.length} results
              </div>
            </div>
            <select
              className="p-2 border border-gray-300 rounded cursor-pointer"
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            >
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
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
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600">
                No products available in this category yet. Check back soon!
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse All Products
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default CategoryPage
