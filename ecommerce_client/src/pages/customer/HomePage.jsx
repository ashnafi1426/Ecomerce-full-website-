import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { customerAPI } from '../../services/api.service';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [todaysDeals, setTodaysDeals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleDeals, setVisibleDeals] = useState(12);
  const [visibleBestSellers, setVisibleBestSellers] = useState(12);
  const [visibleNewArrivals, setVisibleNewArrivals] = useState(12);
  const [visibleRecommended, setVisibleRecommended] = useState(12);
  const [visibleTrending, setVisibleTrending] = useState(12);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  // Helper functions - defined before use
  const getCategoryImage = (categoryName) => {
    const imageMap = {
      'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=500&fit=crop&crop=center',
      'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=500&fit=crop&crop=center',
      'Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop&crop=center',
      'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=500&fit=crop&crop=center',
      'Home & Garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=500&fit=crop&crop=center',
      'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=500&fit=crop&crop=center',
      'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=500&fit=crop&crop=center',
      'Sports & Outdoors': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=500&fit=crop&crop=center',
      'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=1200&h=500&fit=crop&crop=center',
      'Toys & Games': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&h=500&fit=crop&crop=center',
      'Gold': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=500&fit=crop&crop=center',
      'Test Review Category': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=500&fit=crop&crop=center'
    };
    return imageMap[categoryName] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=500&fit=crop&crop=center';
  };

  const getCategoryCardImage = (categoryName) => {
    const imageMap = {
      'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&crop=center',
      'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&crop=center',
      'Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
      'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center',
      'Home & Garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center',
      'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
      'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
      'Sports & Outdoors': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
      'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop&crop=center',
      'Toys & Games': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop&crop=center',
      'Gold': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop&crop=center',
      'Test Review Category': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center'
    };
    return imageMap[categoryName] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center';
  };

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
      'Gold': '💍'
    };
    return emojiMap[categoryName] || '📦';
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // Create dynamic carousel slides based on available categories (using useMemo to avoid re-creation)
  const carouselSlides = React.useMemo(() => {
    if (categories.length === 0) {
      return [
        {
          id: 1,
          image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
          title: "Fashion Sale",
          subtitle: "Up to 70% off on trending fashion",
          buttonText: "Shop Fashion",
          categoryName: 'Fashion'
        },
        {
          id: 2,
          image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=400&fit=crop",
          title: "Electronics Deal",
          subtitle: "Latest gadgets at best prices",
          buttonText: "Shop Electronics",
          categoryName: 'Electronics'
        },
        {
          id: 3,
          image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop",
          title: "Home & Kitchen",
          subtitle: "Transform your home today",
          buttonText: "Shop Home",
          categoryName: 'Home & Kitchen'
        },
        {
          id: 4,
          image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=400&fit=crop",
          title: "Books & More",
          subtitle: "Expand your knowledge",
          buttonText: "Shop Books",
          categoryName: 'Books'
        }
      ];
    }

    // Create slides from actual categories
    return categories.slice(0, 4).map((category) => {
      const productCount = allProducts.filter(p => p.category_id === category.id).length;
      return {
        id: category.id,
        image: getCategoryImage(category.name),
        title: `${category.name} Collection`,
        subtitle: `Discover ${productCount} amazing products`,
        buttonText: `Shop ${category.name}`,
        categoryName: category.name,
        categoryId: category.id
      };
    });
  }, [categories, allProducts]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, allProducts, sortBy, priceRange]);

  // Carousel auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏠 Fetching home page data...');

      // Fetch all data in parallel
      const [categoriesRes, productsRes] = await Promise.all([
        customerAPI.getCategories(),
        customerAPI.getProducts({ limit: 100 }) // Fetch more products for filtering
      ]);

      console.log('📂 Categories response:', categoriesRes);
      console.log('📦 Products response:', productsRes);

      // Set categories
      const categoryList = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || categoriesRes?.categories || [];
      setCategories(categoryList);

      // Set products - ensure only approved products are shown
      const productList = Array.isArray(productsRes) ? productsRes : productsRes?.data || productsRes?.products || [];
      
      // Filter to only approved products (extra safety check)
      const approvedProducts = productList.filter(product => 
        product.approval_status === 'approved' && product.status === 'active'
      );
      
      setAllProducts(approvedProducts);

      // Create product sections for Amazon-style layout
      const shuffledProducts = [...approvedProducts].sort(() => 0.5 - Math.random());
      
      // Featured Products (first 8 products)
      setFeaturedProducts(shuffledProducts.slice(0, 8));
      
      // Today's Deals (products with discounts)
      const dealsProducts = approvedProducts.filter(product => 
        product.original_price && product.original_price > product.price
      ).slice(0, 12);
      setTodaysDeals(dealsProducts);
      
      // Best Sellers (products with high ratings)
      const bestSellerProducts = approvedProducts
        .filter(product => (product.average_rating || product.rating || 0) >= 4)
        .sort((a, b) => (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0))
        .slice(0, 12);
      setBestSellers(bestSellerProducts);
      
      // New Arrivals (latest products)
      const newArrivalProducts = [...approvedProducts]
        .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
        .slice(0, 12);
      setNewArrivals(newArrivalProducts);

      // Recommended Products (random selection for personalization simulation)
      const recommendedSelection = [...approvedProducts]
        .sort(() => 0.5 - Math.random())
        .slice(0, 12);
      setRecommendedProducts(recommendedSelection);

      // Trending Products (products with good ratings and recent activity)
      const trendingSelection = approvedProducts
        .filter(product => (product.average_rating || product.rating || 0) >= 3.5)
        .sort(() => 0.5 - Math.random())
        .slice(0, 12);
      setTrendingProducts(trendingSelection);

      console.log('✅ Home data loaded successfully');
      console.log(`📊 Found ${categoryList.length} categories and ${approvedProducts.length} approved products`);
    } catch (err) {
      console.error('❌ Failed to load home data:', err);
      setError(err.message || 'Failed to load home page');
      toast.error('Failed to load home page data');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = selectedCategory === 'all' 
      ? allProducts 
      : allProducts.filter(product => product.category_id === selectedCategory);

    // Apply price range filter
    filtered = filtered.filter(product => {
      const price = Number(product.price);
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        break;
      default:
        // featured - keep original order
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleCategoryFilter = (categoryId) => {
    console.log('🔍 Filtering by category:', categoryId);
    setSelectedCategory(categoryId);
    // Smooth scroll to products section
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategoryClick = (categoryName) => {
    console.log('🔍 Filtering by category name:', categoryName);
    const category = categories.find(cat => cat.name === categoryName);
    if (category) {
      setSelectedCategory(category.id);
      // Smooth scroll to products section
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMoreDeals = () => {
    setVisibleDeals(prev => Math.min(prev + 12, todaysDeals.length));
  };

  const loadMoreBestSellers = () => {
    setVisibleBestSellers(prev => Math.min(prev + 12, bestSellers.length));
  };

  const loadMoreNewArrivals = () => {
    setVisibleNewArrivals(prev => Math.min(prev + 12, newArrivals.length));
  };

  const loadMoreRecommended = () => {
    setVisibleRecommended(prev => Math.min(prev + 12, recommendedProducts.length));
  };

  const loadMoreTrending = () => {
    setVisibleTrending(prev => Math.min(prev + 12, trendingProducts.length));
  };

  const handleRetry = () => {
    fetchHomeData();
  };

  const handleProductClick = (productId) => {
    console.log('🔗 Navigating to product:', productId);
    navigate(`/product/${productId}`);
  };

  // Loading State
  if (loading) {
    return (
      <div style={{ backgroundColor: '#F7F8F8', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '20px' }}>
          <div style={{ height: '400px', background: '#E3E6E6', borderRadius: '8px', marginBottom: '20px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '250px', background: '#E3E6E6', borderRadius: '4px', marginBottom: '15px' }}></div>
                <div style={{ height: '20px', background: '#E3E6E6', borderRadius: '4px', width: '60%' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={{ backgroundColor: '#F7F8F8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', textAlign: 'center', padding: '48px 32px', maxWidth: '28rem', margin: '0 16px' }}>
          <div style={{ fontSize: '3.75rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0F1111', marginBottom: '8px' }}>Oops! Something went wrong</h2>
          <p style={{ color: '#565959', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={handleRetry}
            style={{ backgroundColor: '#146EB4', color: '#fff', padding: '12px 32px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 leading-normal bg-gray-100 min-h-screen" style={{ margin: 0, padding: 0 }}>
      
      {/* AMAZON-STYLE HERO CAROUSEL - FULL WIDTH EDGE-TO-EDGE */}
      <section className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden mb-0 bg-gray-800" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, marginBottom: 0 }}>
        {carouselSlides.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Overlay for better text visibility */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
            }}></div>
            
            {/* Slide Content - MOBILE RESPONSIVE */}
            <div className="relative z-10 max-w-7xl w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-center h-full">
              <div className="max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6" style={{
                  textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                  lineHeight: '1.2'
                }}>
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white mb-4 sm:mb-5 md:mb-6 lg:mb-8" style={{
                  textShadow: '1px 1px 4px rgba(0,0,0,0.5)'
                }}>
                  {slide.subtitle}
                </p>
                <button
                  onClick={() => handleCategoryClick(slide.categoryName)}
                  className="bg-amazon-orange hover:bg-amazon-orange-dark text-gray-900 px-4 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: '#FF9900',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e88900';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FF9900';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }}
                >
                  {slide.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - MOBILE RESPONSIVE */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-none text-lg sm:text-xl md:text-2xl cursor-pointer z-10 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
          aria-label="Previous slide"
        >
          ‹
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-none text-lg sm:text-xl md:text-2xl cursor-pointer z-10 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Slide Indicators - MOBILE RESPONSIVE */}
        <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="transition-all duration-300 rounded-full border-none cursor-pointer shadow-md touch-manipulation"
              style={{
                width: currentSlide === index ? '24px' : '8px',
                height: '8px',
                backgroundColor: currentSlide === index ? '#FF9900' : 'rgba(255,255,255,0.6)'
              }}
              aria-label={`Go to slide ${index + 1}`}
              onMouseEnter={(e) => {
                if (currentSlide !== index) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentSlide !== index) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.6)';
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* MAIN CONTENT - AMAZON STYLE: Edge-to-edge with internal padding */}
      <main style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, maxWidth: '100%', width: '100%', backgroundColor: '#F7F8F8' }}>
        
        {/* CATEGORY SHOWCASE CARDS - RESPONSIVE - Full width section with centered content */}
        {categories.length > 0 && (
          <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
            <div style={{ padding: '0 20px' }}>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold text-gray-900">
                Shop by Category
              </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {categories.map((category) => {
                const categoryProductCount = allProducts.filter(p => p.category_id === category.id).length;
                return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                  className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
                  style={{ border: '1px solid #E3E6E6' }}
                >
                  <h3 className="text-base sm:text-lg md:text-xl mb-3 sm:mb-4 text-gray-900 font-semibold">
                    {getCategoryEmoji(category.name)} {category.name}
                  </h3>
                  <div className="w-full h-40 sm:h-48 md:h-52 lg:h-56 rounded-lg mb-3 sm:mb-4 overflow-hidden relative">
                    <img
                      src={getCategoryCardImage(category.name)}
                      alt={category.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div style="
                            width: 100%; 
                            height: 100%; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            font-size: 4em;
                            border-radius: 8px;
                          ">
                            ${getCategoryEmoji(category.name)}
                          </div>
                        `;
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2">
                    {categoryProductCount} products available
                  </p>
                  <span className="text-blue-600 text-sm sm:text-base font-semibold flex items-center gap-1">
                    Shop now 
                    <span className="text-lg">→</span>
                  </span>
                </div>
              );
            })}
          </div>
            </div>
          </section>
        )}
        
        {/* AMAZON-STYLE PRODUCT SECTIONS */}
        {!loading && selectedCategory === 'all' && (
          <>
            {/* TODAY'S DEALS SECTION - Full width with centered content */}
            {todaysDeals.length > 0 && (
              <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
                <div style={{ padding: '0 20px' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Today's Deals
                  </h2>
                  <button
                    onClick={() => navigate('/deals')}
                    className="text-blue-600 bg-transparent border-none text-sm sm:text-base cursor-pointer hover:underline"
                  >
                    See all deals →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
                  {todaysDeals.slice(0, visibleDeals).map((product) => {
                    const discount = calculateDiscount(product.price, product.original_price);
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="cursor-pointer transition-all duration-200 p-2 sm:p-3 rounded relative active:bg-gray-50 hover:shadow-lg border border-gray-100"
                      >
                        {/* PRODUCT IMAGE - Mobile-First with aspect-square */}
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-400 to-pink-600 rounded flex items-center justify-center mb-2 overflow-hidden relative">
                          {product.image_url && product.image_url.startsWith('http') ? (
                            <img
                              src={product.image_url}
                              alt={product.title || product.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                                fallback.textContent = '📦';
                                e.target.parentElement.appendChild(fallback);
                              }}
                            />
                          ) : (
                            <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                          )}
                          {discount && (
                            <div className="absolute top-1 left-1 bg-red-700 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                              -{discount}%
                            </div>
                          )}
                        </div>
                        
                        {/* PRODUCT TITLE - Mobile Optimized */}
                        <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                          {product.title || product.name}
                        </div>
                        
                        {/* PRICE - Bold and Clear with Block Display */}
                        <div className="mb-1">
                          <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                            ${Number(product.price).toFixed(2)}
                          </div>
                          {product.original_price && (
                            <div className="text-[10px] sm:text-xs text-gray-500 line-through mt-0.5">
                              ${Number(product.original_price).toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        {/* RATING - Separate Row on Mobile */}
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                          {renderStars(product.average_rating || product.rating)}
                          <span className="text-blue-600">({product.total_reviews || product.reviews_count || 0})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {visibleDeals < todaysDeals.length && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={loadMoreDeals}
                      style={{
                        backgroundColor: '#fff',
                        color: '#0F1111',
                        padding: '12px 32px',
                        border: '1px solid #D5D9D9',
                        borderRadius: '8px',
                        fontSize: '0.95em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F7F8F8';
                        e.target.style.borderColor = '#FF9900';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#D5D9D9';
                      }}
                    >
                      View More Deals ({todaysDeals.length - visibleDeals} remaining)
                    </button>
                  </div>
                )}
                </div>
              </section>
            )}

            {/* FEATURED PRODUCTS SECTION - Full width with centered content */}
            {featuredProducts.length > 0 && (
              <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
                <div style={{ padding: '0 20px' }}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Featured Products
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
                  {featuredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer transition-all duration-200 p-2 sm:p-3 rounded relative active:bg-gray-50 hover:shadow-lg border border-gray-100"
                    >
                      {/* PRODUCT IMAGE - Mobile-First with aspect-square */}
                      <div className="w-full aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {product.image_url && product.image_url.startsWith('http') ? (
                          <img
                            src={product.image_url}
                            alt={product.title || product.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                              fallback.textContent = '📦';
                              e.target.parentElement.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                        )}
                      </div>
                      
                      {/* PRODUCT TITLE - Mobile Optimized */}
                      <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                        {product.title || product.name}
                      </div>
                      
                      {/* PRICE - Bold and Clear with Block Display */}
                      <div className="mb-1">
                        <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* RATING - Separate Row on Mobile */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                        {renderStars(product.average_rating || product.rating)}
                        <span className="text-blue-600">({product.total_reviews || product.reviews_count || 0})</span>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </section>
            )}

            {/* BEST SELLERS SECTION - Full width with centered content */}
            {bestSellers.length > 0 && (
              <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
                <div style={{ padding: '0 20px' }}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Best Sellers
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
                  {bestSellers.slice(0, visibleBestSellers).map((product, index) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer transition-all duration-200 p-2 sm:p-3 rounded relative active:bg-gray-50 hover:shadow-lg border border-gray-100"
                    >
                      {/* RANK BADGE */}
                      <div className="absolute top-1 left-1 bg-yellow-500 text-gray-900 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold z-10">
                        #{index + 1}
                      </div>
                      
                      {/* PRODUCT IMAGE - Mobile-First with aspect-square */}
                      <div className="w-full aspect-square bg-gradient-to-br from-blue-400 to-cyan-400 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {product.image_url && product.image_url.startsWith('http') ? (
                          <img
                            src={product.image_url}
                            alt={product.title || product.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                              fallback.textContent = '📦';
                              e.target.parentElement.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                        )}
                      </div>
                      
                      {/* PRODUCT TITLE - Mobile Optimized */}
                      <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                        {product.title || product.name}
                      </div>
                      
                      {/* PRICE - Bold and Clear with Block Display */}
                      <div className="mb-1">
                        <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* RATING - Separate Row on Mobile */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                        {renderStars(product.average_rating || product.rating)}
                        <span className="text-blue-600">({product.total_reviews || product.reviews_count || 0})</span>
                      </div>
                    </div>
                  ))}
                </div>
                {visibleBestSellers < bestSellers.length && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={loadMoreBestSellers}
                      style={{
                        backgroundColor: '#fff',
                        color: '#0F1111',
                        padding: '12px 32px',
                        border: '1px solid #D5D9D9',
                        borderRadius: '8px',
                        fontSize: '0.95em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F7F8F8';
                        e.target.style.borderColor = '#FF9900';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#D5D9D9';
                      }}
                    >
                      View More Best Sellers ({bestSellers.length - visibleBestSellers} remaining)
                    </button>
                  </div>
                )}
                </div>
              </section>
            )}

            {/* NEW ARRIVALS SECTION - Full width with centered content */}
            {newArrivals.length > 0 && (
              <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
                <div style={{ padding: '0 20px' }}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    New Arrivals
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
                  {newArrivals.slice(0, visibleNewArrivals).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer transition-all duration-200 p-2 sm:p-3 rounded relative active:bg-gray-50 hover:shadow-lg border border-gray-100"
                    >
                      {/* NEW BADGE */}
                      <div className="absolute top-1 right-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold z-10">
                        NEW
                      </div>
                      
                      {/* PRODUCT IMAGE - Mobile-First with aspect-square */}
                      <div className="w-full aspect-square bg-gradient-to-br from-pink-400 to-yellow-300 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {product.image_url && product.image_url.startsWith('http') ? (
                          <img
                            src={product.image_url}
                            alt={product.title || product.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                              fallback.textContent = '📦';
                              e.target.parentElement.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                        )}
                      </div>
                      
                      {/* PRODUCT TITLE - Mobile Optimized */}
                      <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                        {product.title || product.name}
                      </div>
                      
                      {/* PRICE - Bold and Clear */}
                      <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                        ${Number(product.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                {visibleNewArrivals < newArrivals.length && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={loadMoreNewArrivals}
                      style={{
                        backgroundColor: '#fff',
                        color: '#0F1111',
                        padding: '12px 32px',
                        border: '1px solid #D5D9D9',
                        borderRadius: '8px',
                        fontSize: '0.95em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F7F8F8';
                        e.target.style.borderColor = '#FF9900';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#D5D9D9';
                      }}
                    >
                      View More New Arrivals ({newArrivals.length - visibleNewArrivals} remaining)
                    </button>
                  </div>
                )}
                </div>
              </section>
            )}

            {/* RECOMMENDED FOR YOU SECTION - Full width with centered content */}
            {recommendedProducts.length > 0 && (
              <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
                <div style={{ padding: '0 20px' }}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Recommended for You
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
                  {recommendedProducts.slice(0, visibleRecommended).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer transition-all duration-200 p-2 sm:p-3 rounded active:bg-gray-50 hover:shadow-lg border border-gray-100"
                    >
                      {/* PRODUCT IMAGE - Mobile-First with aspect-square */}
                      <div className="w-full aspect-square bg-gradient-to-br from-teal-300 to-pink-200 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {product.image_url && product.image_url.startsWith('http') ? (
                          <img
                            src={product.image_url}
                            alt={product.title || product.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                              fallback.textContent = '📦';
                              e.target.parentElement.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                        )}
                      </div>
                      
                      {/* PRODUCT TITLE - Mobile Optimized */}
                      <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                        {product.title || product.name}
                      </div>
                      
                      {/* PRICE - Bold and Clear with Block Display */}
                      <div className="mb-1">
                        <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* RATING - Separate Row on Mobile */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                        {renderStars(product.average_rating || product.rating)}
                        <span className="text-blue-600">({product.total_reviews || product.reviews_count || 0})</span>
                      </div>
                    </div>
                  ))}
                </div>
                {visibleRecommended < recommendedProducts.length && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={loadMoreRecommended}
                      style={{
                        backgroundColor: '#fff',
                        color: '#0F1111',
                        padding: '12px 32px',
                        border: '1px solid #D5D9D9',
                        borderRadius: '8px',
                        fontSize: '0.95em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F7F8F8';
                        e.target.style.borderColor = '#FF9900';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#D5D9D9';
                      }}
                    >
                      View More Recommendations ({recommendedProducts.length - visibleRecommended} remaining)
                    </button>
                  </div>
                )}
                </div>
              </section>
            )}

            {/* TRENDING NOW SECTION - Full width with centered content */}
            {trendingProducts.length > 0 && (
              <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
                <div style={{ padding: '0 20px' }}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    🔥 Trending Now
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
                  {trendingProducts.slice(0, visibleTrending).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="cursor-pointer transition-all duration-200 p-2 sm:p-3 rounded relative active:bg-gray-50 hover:shadow-lg border border-gray-100"
                    >
                      {/* HOT BADGE */}
                      <div className="absolute top-1 left-1 bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold z-10">
                        🔥 HOT
                      </div>
                      
                      {/* PRODUCT IMAGE - Mobile-First with aspect-square */}
                      <div className="w-full aspect-square bg-gradient-to-br from-pink-400 to-purple-400 rounded flex items-center justify-center mb-2 overflow-hidden">
                        {product.image_url && product.image_url.startsWith('http') ? (
                          <img
                            src={product.image_url}
                            alt={product.title || product.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                              fallback.textContent = '📦';
                              e.target.parentElement.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                        )}
                      </div>
                      
                      {/* PRODUCT TITLE - Mobile Optimized */}
                      <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                        {product.title || product.name}
                      </div>
                      
                      {/* PRICE - Bold and Clear with Block Display */}
                      <div className="mb-1">
                        <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* RATING - Separate Row on Mobile */}
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                        {renderStars(product.average_rating || product.rating)}
                        <span className="text-blue-600">({product.total_reviews || product.reviews_count || 0})</span>
                      </div>
                    </div>
                  ))}
                </div>
                {visibleTrending < trendingProducts.length && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={loadMoreTrending}
                      style={{
                        backgroundColor: '#fff',
                        color: '#0F1111',
                        padding: '12px 32px',
                        border: '1px solid #D5D9D9',
                        borderRadius: '8px',
                        fontSize: '0.95em',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#F7F8F8';
                        e.target.style.borderColor = '#FF9900';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.borderColor = '#D5D9D9';
                      }}
                    >
                      View More Trending ({trendingProducts.length - visibleTrending} remaining)
                    </button>
                  </div>
                )}
                </div>
              </section>
            )}
          </>
        )}
        
        {/* FILTERED PRODUCTS - Full width with centered content */}
        {filteredProducts.length > 0 && (
          <section id="products-section" style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '24px 0', marginBottom: '16px' }}>
            <div style={{ padding: '0 20px' }}>
            {/* HEADER WITH TITLE AND CONTROLS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4">
              <div className="w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                  {selectedCategory === 'all' ? 'All Products' : 
                   `${categories.find(c => c.id === selectedCategory)?.name || 'Category'} Products`}
                </h2>
                <span className="text-xs sm:text-sm md:text-base text-gray-600">
                  {filteredProducts.length} results
                </span>
              </div>
              
              {/* SORTING AND FILTERING CONTROLS */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs sm:text-sm cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                
                <div className="flex gap-2 items-center px-2 sm:px-3 py-2 border border-gray-300 rounded-lg bg-white">
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Price:</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                    className="w-14 sm:w-16 md:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-600 text-xs sm:text-sm">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || 10000 }))}
                    className="w-14 sm:w-16 md:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {/* PRODUCTS GRID - iPhone SE Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-6 sm:mb-8 md:mb-10">
              {filteredProducts.map((product) => {
                const discount = calculateDiscount(product.price, product.original_price);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="bg-white p-2 sm:p-3 md:p-4 rounded border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer active:bg-gray-50"
                  >
                    {/* PRODUCT IMAGE - Optimized for iPhone SE */}
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-400 to-pink-500 rounded flex items-center justify-center mb-2 overflow-hidden relative">
                      {product.image_url && product.image_url.startsWith('http') ? (
                        <img
                          src={product.image_url}
                          alt={product.title || product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'text-3xl sm:text-4xl md:text-5xl';
                            fallback.textContent = '📦';
                            e.target.parentElement.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="text-3xl sm:text-4xl md:text-5xl">📦</div>
                      )}
                      {discount && (
                        <div className="absolute top-1 left-1 bg-red-700 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold z-10">
                          -{discount}%
                        </div>
                      )}
                    </div>
                    
                    {/* PRODUCT TITLE - iPhone SE Optimized */}
                    <div className="text-[11px] sm:text-xs md:text-sm leading-tight mb-2 h-8 sm:h-9 overflow-hidden line-clamp-2 text-gray-900">
                      {product.title || product.name}
                    </div>
                    
                    {/* PRICE - Bold and Clear with Block Display */}
                    <div className="mb-1">
                      <div className="text-sm sm:text-base md:text-lg font-bold text-red-700">
                        ${Number(product.price).toFixed(2)}
                      </div>
                      {product.original_price && (
                        <div className="text-[10px] sm:text-xs text-gray-500 line-through mt-0.5">
                          ${Number(product.original_price).toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {/* RATING - Separate Row on Mobile */}
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-500">
                      {renderStars(product.average_rating || product.rating)}
                      <span className="text-blue-600">({product.total_reviews || product.reviews_count || 0})</span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </section>
        )}

        {/* NO PRODUCTS MESSAGE - Full width with centered content */}
        {!loading && filteredProducts.length === 0 && (
          <section style={{ width: '100%', backgroundColor: '#FFFFFF', padding: '48px 0', marginBottom: '16px' }}>
            <div style={{ padding: '0 20px' }}>
          <div className="text-center py-10 sm:py-12 md:py-16 px-4 sm:px-6 bg-white rounded-lg shadow-md" style={{ border: '1px solid #E3E6E6' }}>
            <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">📦</div>
            <h3 className="text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 text-gray-900 font-semibold">
              {selectedCategory === 'all' ? 'No products available' : 'No products in this category'}
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6">
              {selectedCategory === 'all' 
                ? 'Check back later for new products.' 
                : 'Try browsing other categories or view all products.'}
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => handleCategoryFilter('all')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors duration-200 min-h-[44px] touch-manipulation"
              >
                View All Products
              </button>
            )}
          </div>
            </div>
          </section>
        )}
      </main>

      {/* BACK TO TOP BUTTON - MOBILE RESPONSIVE */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 bg-amazon-orange hover:bg-amazon-orange-dark text-gray-900 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-none text-lg sm:text-xl md:text-2xl cursor-pointer shadow-lg hover:shadow-xl z-[1000] transition-all duration-300 flex items-center justify-center font-bold hover:-translate-y-1 active:translate-y-0 touch-manipulation"
          style={{
            backgroundColor: '#FF9900'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e88900';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FF9900';
          }}
          title="Back to top"
          aria-label="Scroll back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default HomePage;