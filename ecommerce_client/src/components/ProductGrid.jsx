import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductGrid = ({ products = [], title = "Products", showFilters = false }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    // Add to cart logic here
    console.log('Adding to cart:', product);
  };

  const handleAddToWishlist = (e, product) => {
    e.stopPropagation();
    // Add to wishlist logic here
    console.log('Adding to wishlist:', product);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300">☆</span>
        ))}
      </div>
    );
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'newest', label: 'Newest Arrivals' }
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-25', label: 'Under $25' },
    { value: '25-50', label: '$25 - $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-200', label: '$100 - $200' },
    { value: '200+', label: '$200 & Above' }
  ];

  return (
    <div className="w-full">
      {/* Header with Title and Filters */}
      <div className="responsive-flex-col justify-between items-start md:items-center mb-6 responsive-gap">
        <div>
          <h2 className="responsive-heading-lg text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-1 responsive-body-sm">{products.length} products found</p>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row responsive-gap w-full md:w-auto">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="responsive-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Price Range Dropdown */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="responsive-select"
            >
              {priceRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="responsive-product-grid">{products.map((product) => {
            const discount = calculateDiscount(product.price, product.original_price);
            const rating = product.average_rating || product.rating || 0;
            const reviewCount = product.total_reviews || product.reviews_count || 0;

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title || product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                      📦
                    </div>
                  )}

                  {/* Discount Badge */}
                  {discount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{discount}%
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleAddToWishlist(e, product)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-4 h-4 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Quick Add to Cart */}
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                  >
                    Add to Cart
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Product Title */}
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title || product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(rating)}
                    <span className="text-sm text-gray-600">
                      ({reviewCount})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </div>

                  {/* Seller Info */}
                  {(product.seller_name || product.seller?.display_name) && (
                    <p className="text-xs text-gray-500 mb-2">
                      by {product.seller_name || product.seller?.display_name}
                    </p>
                  )}

                  {/* Shipping Info */}
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Free shipping</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {products.length > 0 && (
        <div className="text-center mt-8">
          <button className="responsive-btn bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;