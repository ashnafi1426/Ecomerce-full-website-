import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`)
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryEmoji = (categoryName) => {
    const emojiMap = {
      'Electronics': '💻',
      'Fashion': '👗',
      'Clothing': '👕',
      'Home & Kitchen': '🏠',
      'Home & Garden': '🏡',
      'Books': '📚',
      'Sports': '⚽',
      'Sports & Outdoors': '🏃',
      'Toys': '🧸',
      'Toys & Games': '🎮',
      'Beauty & Personal Care': '💄',
      'Automotive': '🚗',
      'Gold': '💍'
    }
    return emojiMap[categoryName] || '📦'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h1>
          <p className="text-gray-600">Browse all product categories</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col items-center justify-center text-center no-underline group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                {getCategoryEmoji(category.name)}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                {category.name}
              </h3>
              {category.product_count > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {category.product_count} products
                </p>
              )}
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No categories available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoriesPage
