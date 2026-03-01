import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { customerAPI } from '../../services/api.service';

const HomePageAmazonStyle = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [todaysDeals, setTodaysDeals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleDeals, setVisibleDeals] = useState(12);
  const [visibleBestSellers, setVisibleBestSellers] = useState(12);
  const [visibleNewArrivals, setVisibleNewArrivals] = useState(12);

  // Amazon-style carousel slides with high-quality images
  const carouselSlides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop&q=80",
      title: "Electronics Sale",
      subtitle: "Up to 50% off on latest gadgets",
      buttonText: "Shop Electronics",
      categoryName: 'Electronics',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.9))'
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=600&fit=crop&q=80",
      title: "Fashion Trends",
      subtitle: "Discover the latest fashion collections",
      buttonText: "Shop Fashion",
      categoryName: 'Fashion',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(239, 68, 68, 0.9))'
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=600&fit=crop&q=80",
      title: "Home & Living",
      subtitle: "Transform your space with style",
      buttonText: "Shop Home",
      categoryName: 'Home & Kitchen',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(59, 130, 246, 0.9))'
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=600&fit=crop&q=80",
      title: "Books & More",
      subtitle: "Expand your knowledge today",
      buttonText: "Shop Books",
      categoryName: 'Books',
      gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.9), rgba(234, 179, 8, 0.9))'
    }
  ];

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, allProducts]);

  // Carousel auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
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

      const [categoriesRes, productsRes] = await Promise.all([
        customerAPI.getCategories(),
        customerAPI.getProducts({ limit: 100 })
      ]);

      const categoryList = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];
      setCategories(categoryList);

      const productList = Array.isArray(productsRes) ? productsRes : productsRes?.data || [];
      const approvedProducts = productList.filter(product => 
        product.approval_status === 'approved' && product.status === 'active'
      );
      
      setAllProducts(approvedProducts);

      const shuffledProducts = [...approvedProducts].sort(() => 0.5 - Math.random());
      setFeaturedProducts(shuffledProducts.slice(0, 8));
      
      const dealsProducts = approvedProducts.filter(product => 
        product.original_price && product.original_price > product.price
      ).slice(0, 12);
      setTodaysDeals(dealsProducts);
      
      const bestSellerProducts = approvedProducts
        .filter(product => (product.average_rating || product.rating || 0) >= 4)
        .sort((a, b) => (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0))
        .slice(0, 12);
      setBestSellers(bestSellerProducts);
      
      const newArrivalProducts = [...approvedProducts]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 12);
      setNewArrivals(newArrivalProducts);

    } catch (err) {
      setError(err.message || 'Failed to load home page');
      toast.error('Failed to load home page data');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (selectedCategory === 'all') {
      setFilteredProducts(allProducts);
    } else {
      setFilteredProducts(allProducts.filter(product => product.category_id === selectedCategory));
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategoryClick = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (category) {
      handleCategoryFilter(category.id);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  const goToSlide = (index) => setCurrentSlide(index);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  
  const loadMoreDeals = () => setVisibleDeals(prev => Math.min(prev + 12, todaysDeals.length));
  const loadMoreBestSellers = () => setVisibleBestSellers(prev => Math.min(prev + 12, bestSellers.length));
  const loadMoreNewArrivals = () => setVisibleNewArrivals(prev => Math.min(prev + 12, newArrivals.length));

  const handleProductClick = (productId) => navigate(`/product/${productId}`);
  const renderStars = (rating) => '★'.repeat(Math.floor(rating || 0)) + '☆'.repeat(5 - Math.floor(rating || 0));
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  const getCategoryImage = (categoryName) => {
    const imageMap = {
      'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop&q=80',
      'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop&q=80',
      'Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80',
      'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
      'Home & Garden': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&q=80',
      'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&q=80',
      'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&q=80',
      'Sports & Outdoors': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
      'Toys': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop&q=80',
      'Toys & Games': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop&q=80',
      'Gold': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop&q=80'
    };
    return imageMap[categoryName] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&q=80';
  };

  const getCategoryEmoji = (categoryName) => {
    const emojiMap = {
      'Electronics': '💻', 'Fashion': '👗', 'Clothing': '👕',
      'Home & Kitchen': '🏠', 'Home & Garden': '🏡', 'Books': '📚',
      'Sports': '⚽', 'Sports & Outdoors': '🏃', 'Toys': '🧸',
      'Toys & Games': '🎮', 'Gold': '💍'
    };
    return emojiMap[categoryName] || '📦';
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#EAEDED', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div style={{ height: '600px', background: '#fff', borderRadius: '8px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ backgroundColor: '#fff', height: '300px', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#EAEDED', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '48px', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '4em', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#0F1111', marginBottom: '10px' }}>Something went wrong</h2>
          <p style={{ color: '#565959', marginBottom: '24px' }}>{error}</p>
          <button onClick={fetchHomeData} style={{ backgroundColor: '#FF9900', color: '#0F1111', padding: '12px 32px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Amazon Ember, Arial, sans-serif', backgroundColor: '#EAEDED', minHeight: '100vh' }}>
      {/* AMAZON-STYLE HERO CAROUSEL */}
      <section style={{ position: 'relative', height: '600px', overflow: 'hidden', marginBottom: '-150px' }}>
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
              backgroundPosition: 'center'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: slide.gradient }}></div>
            <div style={{ position: 'relative', maxWidth: '1500px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', padding: '0 40px' }}>
              <div style={{ maxWidth: '600px', color: '#fff' }}>
                <h1 style={{ fontSize: '3.5em', fontWeight: '700', marginBottom: '20px', textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}>
                  {slide.title}
                </h1>
                <p style={{ fontSize: '1.5em', marginBottom: '30px', textShadow: '1px 1px 4px rgba(0,0,0,0.3)' }}>
                  {slide.subtitle}
                </p>
                <button
                  onClick={() => handleCategoryClick(slide.categoryName)}
                  style={{
                    backgroundColor: '#FF9900',
                    color: '#0F1111',
                    padding: '16px 48px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1em',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  {slide.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button onClick={prevSlide} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '4px', width: '50px', height: '50px', fontSize: '2em', cursor: 'pointer', zIndex: 10 }}>‹</button>
        <button onClick={nextSlide} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '4px', width: '50px', height: '50px', fontSize: '2em', cursor: 'pointer', zIndex: 10 }}>›</button>

        {/* Slide Indicators */}
        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10 }}>
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2px solid #fff',
                backgroundColor: currentSlide === index ? '#FF9900' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {/* AMAZON-STYLE CATEGORY CARDS */}
        {categories.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {categories.slice(0, 4).map((category) => {
              const productCount = allProducts.filter(p => p.category_id === category.id).length;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.id)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  <h3 style={{ fontSize: '1.3em', fontWeight: '700', marginBottom: '15px', color: '#0F1111' }}>
                    {category.name}
                  </h3>
                  <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
                    <img
                      src={getCategoryImage(category.name)}
                      alt={category.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:5em;">${getCategoryEmoji(category.name)}</div>`;
                      }}
                    />
                  </div>
                  <p style={{ color: '#007185', fontSize: '0.9em', fontWeight: '500' }}>
                    Shop now ({productCount} items)
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Product sections continue... */}
        {/* Rest of the product sections remain the same */}
      </main>

      {/* BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            backgroundColor: '#FF9900',
            color: '#0F1111',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: 'none',
            fontSize: '1.5em',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#e88900';
            e.target.style.transform = 'translateY(-3px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#FF9900';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ↑
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default HomePageAmazonStyle;
