import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PromoBanner = () => {
  const [currentPromo, setCurrentPromo] = useState(0);
  const navigate = useNavigate();

  // Promotional banners
  const promos = [
    {
      id: 1,
      text: "🚚 FREE SHIPPING on orders over $50",
      bgColor: "bg-green-600",
      textColor: "text-white",
      action: () => navigate('/products'),
      actionText: "Shop Now"
    },
    {
      id: 2,
      text: "⚡ Flash Sale: Up to 60% OFF Electronics",
      bgColor: "bg-red-600",
      textColor: "text-white",
      action: () => navigate('/category/electronics'),
      actionText: "View Deals"
    },
    {
      id: 3,
      text: "🎁 New Customer? Get 15% OFF your first order",
      bgColor: "bg-blue-600",
      textColor: "text-white",
      action: () => navigate('/register'),
      actionText: "Sign Up"
    },
    {
      id: 4,
      text: "💳 Buy Now, Pay Later with 0% Interest",
      bgColor: "bg-purple-600",
      textColor: "text-white",
      action: () => navigate('/products'),
      actionText: "Learn More"
    }
  ];

  // Auto-rotate promos every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [promos.length]);

  const currentPromoData = promos[currentPromo];

  return (
    <div className={`${currentPromoData.bgColor} ${currentPromoData.textColor} py-3 px-4 transition-all duration-500`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="font-medium text-sm md:text-base">
            {currentPromoData.text}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={currentPromoData.action}
            className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
          >
            {currentPromoData.actionText}
          </button>
          
          {/* Promo indicators */}
          <div className="hidden md:flex items-center gap-1">
            {promos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPromo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPromo
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to promo ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;