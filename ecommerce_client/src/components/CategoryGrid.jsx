import { useNavigate } from 'react-router-dom';

const CategoryGrid = ({ categories = [] }) => {
  const navigate = useNavigate();

  // Default categories with images if none provided
  const defaultCategories = [
    {
      id: 'electronics',
      name: 'Electronics',
      description: 'Phones, Laptops, TVs & More',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '📱',
      color: 'from-blue-500 to-blue-600',
      productCount: '10,000+'
    },
    {
      id: 'fashion',
      name: 'Fashion',
      description: 'Clothing, Shoes & Accessories',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '👗',
      color: 'from-pink-500 to-rose-500',
      productCount: '25,000+'
    },
    {
      id: 'home',
      name: 'Home & Kitchen',
      description: 'Furniture, Decor & Appliances',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '🏠',
      color: 'from-green-500 to-emerald-500',
      productCount: '15,000+'
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      description: 'Equipment, Apparel & Nutrition',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '⚽',
      color: 'from-orange-500 to-red-500',
      productCount: '8,000+'
    },
    {
      id: 'books',
      name: 'Books & Media',
      description: 'Books, eBooks & Audiobooks',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '📚',
      color: 'from-purple-500 to-indigo-500',
      productCount: '50,000+'
    },
    {
      id: 'beauty',
      name: 'Beauty & Health',
      description: 'Skincare, Makeup & Wellness',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '💄',
      color: 'from-teal-500 to-cyan-500',
      productCount: '12,000+'
    },
    {
      id: 'toys',
      name: 'Toys & Games',
      description: 'Kids Toys, Board Games & More',
      image: 'https://images.unsplash.com/photo-1558877385-1c4c7e9e5c8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '🧸',
      color: 'from-yellow-500 to-orange-500',
      productCount: '5,000+'
    },
    {
      id: 'automotive',
      name: 'Automotive',
      description: 'Car Parts, Tools & Accessories',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      icon: '🚗',
      color: 'from-gray-600 to-gray-700',
      productCount: '3,000+'
    }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  return (
    <div className="responsive-grid-2">
      {displayCategories.map((category) => (
        <div
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
        >
          {/* Category Image */}
          <div className="relative h-32 md:h-40 overflow-hidden">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`}></div>
            
            {/* Category Icon */}
            <div className="absolute top-3 right-3 text-2xl bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
              {category.icon}
            </div>

            {/* Product Count Badge */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="text-xs font-semibold text-gray-800">{category.productCount}</span>
            </div>
          </div>

          {/* Category Info */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
              {category.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {category.description}
            </p>
            
            {/* Shop Now Button */}
            <div className="flex items-center justify-between">
              <span className="text-blue-600 font-medium text-sm group-hover:underline">
                Shop Now →
              </span>
              <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryGrid;