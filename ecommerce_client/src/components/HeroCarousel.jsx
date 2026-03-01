import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Amazon-style promotional slides with high-quality images
  const slides = [
    {
      id: 1,
      title: "Electronics Sale",
      subtitle: "Up to 70% off on Electronics",
      description: "Smartphones, Laptops, Headphones & More",
      buttonText: "Shop Electronics",
      buttonLink: "/category/electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      gradient: "from-blue-600/80 to-purple-600/80",
      bgColor: "bg-blue-50"
    },
    {
      id: 2,
      title: "Fashion Week",
      subtitle: "Trending Fashion & Accessories",
      description: "Latest styles for men, women & kids",
      buttonText: "Shop Fashion",
      buttonLink: "/category/fashion",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      gradient: "from-pink-500/80 to-rose-500/80",
      bgColor: "bg-pink-50"
    },
    {
      id: 3,
      title: "Home & Kitchen",
      subtitle: "Transform Your Living Space",
      description: "Furniture, Decor, Appliances & More",
      buttonText: "Shop Home",
      buttonLink: "/category/home",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2058&q=80",
      gradient: "from-green-500/80 to-teal-500/80",
      bgColor: "bg-green-50"
    },
    {
      id: 4,
      title: "Sports & Fitness",
      subtitle: "Gear Up for Your Active Lifestyle",
      description: "Equipment, Apparel, Supplements & More",
      buttonText: "Shop Sports",
      buttonLink: "/category/sports",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      gradient: "from-orange-500/80 to-red-500/80",
      bgColor: "bg-orange-50"
    }
  ];

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isAutoPlaying]);

  const goToSlide = (index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume autoplay after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
    setTimeout(() => setIsTransitioning(false), 700);
  };

  // Touch handlers for swipe functionality
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key >= '1' && e.key <= '4') {
        goToSlide(parseInt(e.key) - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Pause on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const handleShopNow = (link) => {
    navigate(link);
  };

  return (
    <div 
      className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-xl shadow-2xl bg-white"
      ref={carouselRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`min-w-full h-full relative flex items-center ${slide.bgColor}`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 w-full">
              <div className="max-w-2xl text-white">
                <div className="mb-4">
                  <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    Limited Time Offer
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-lg">
                  {slide.title}
                </h1>
                <h2 className="text-xl md:text-3xl mb-4 font-semibold drop-shadow-md">
                  {slide.subtitle}
                </h2>
                <p className="text-lg md:text-xl mb-8 opacity-95 drop-shadow-sm">
                  {slide.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleShopNow(slide.buttonLink)}
                    className="bg-white text-gray-800 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
                  >
                    {slide.buttonText}
                  </button>
                  <button
                    onClick={() => handleShopNow('/products')}
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-gray-800 transition-all duration-300 backdrop-blur-sm"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 text-white/30">
              <div className="text-6xl">
                {index === 0 && '📱'}
                {index === 1 && '👗'}
                {index === 2 && '🏠'}
                {index === 3 && '⚽'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 hover:scale-110"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 hover:scale-110"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 h-3 bg-white rounded-full scale-110'
                : 'w-3 h-3 bg-white/50 hover:bg-white/75 rounded-full hover:scale-110'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter & Auto-play Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="bg-black/30 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/20">
          {currentSlide + 1} / {slides.length}
        </div>
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          isAutoPlaying ? 'bg-green-400' : 'bg-gray-400'
        }`} title={isAutoPlaying ? 'Auto-playing' : 'Paused'} />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default HeroCarousel;