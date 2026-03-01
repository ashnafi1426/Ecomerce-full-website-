import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ onSearch, placeholder = "Search FastShop..." }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Categories', icon: '🔍' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👗' },
    { id: 'home', name: 'Home & Kitchen', icon: '🏠' },
    { id: 'sports', name: 'Sports & Fitness', icon: '⚽' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'toys', name: 'Toys & Games', icon: '🧸' },
    { id: 'beauty', name: 'Beauty & Health', icon: '💄' }
  ];

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchParams = {
        query: searchQuery.trim(),
        category: selectedCategory.id !== 'all' ? selectedCategory.id : undefined
      };
      
      if (onSearch) {
        onSearch(searchParams);
      } else {
        // Navigate to search results page
        const params = new URLSearchParams();
        params.set('q', searchParams.query);
        if (searchParams.category) {
          params.set('category', searchParams.category);
        }
        navigate(`/search?${params.toString()}`);
      }
    }
  };

  const handleQuickSearch = (query) => {
    setSearchQuery(query);
    const searchParams = { query, category: undefined };
    if (onSearch) {
      onSearch(searchParams);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const popularSearches = [
    'iPhone', 'Laptop', 'Headphones', 'Nike Shoes', 'Samsung TV',
    'Coffee Maker', 'Bluetooth Speaker', 'Gaming Chair'
  ];

  return (
    <div className="relative w-full responsive-container">
      {/* Main Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex bg-white rounded-lg shadow-lg border-2 border-gray-200 focus-within:border-orange-400 transition-colors responsive-flex-row">
          {/* Category Dropdown */}
          <div className="relative mobile-hide">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center responsive-gap px-3 md:px-4 py-2 md:py-3 bg-gray-50 hover:bg-gray-100 rounded-l-lg border-r border-gray-200 transition-colors min-w-[100px] md:min-w-[140px]"
            >
              <span className="text-base md:text-lg">{selectedCategory.icon}</span>
              <span className="responsive-body-sm font-medium text-gray-700 hidden sm:block">
                {selectedCategory.name.split(' ')[0]}
              </span>
              <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Category Dropdown Menu */}
            {isExpanded && (
              <div className="absolute top-full left-0 mt-1 w-56 md:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsExpanded(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors responsive-body-sm ${
                        selectedCategory.id === category.id ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-base md:text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="responsive-input flex-1 bg-transparent border-0 focus:ring-0"
          />

          {/* Search Button */}
          <button
            type="submit"
            className="responsive-btn bg-orange-400 hover:bg-orange-500 text-white rounded-r-lg transition-colors flex items-center responsive-gap"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:block font-medium responsive-body-sm">Search</span>
          </button>
        </div>
      </form>

      {/* Popular Searches */}
      <div className="mt-3 md:mt-4 flex flex-wrap gap-2 mobile-hide">
        <span className="responsive-body-sm text-gray-600 font-medium">Popular:</span>
        {popularSearches.slice(0, 6).map((search, index) => (
          <button
            key={index}
            onClick={() => handleQuickSearch(search)}
            className="responsive-body-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {search}
          </button>
        ))}
      </div>

      {/* Click outside to close dropdown */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default SearchBar;