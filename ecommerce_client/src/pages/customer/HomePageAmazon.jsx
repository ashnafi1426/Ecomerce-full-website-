import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { customerAPI } from '../../services/api.service';

const HomePageAmazon = () => {
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
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1500&h=600&fit=crop",
      title: "Latest Electronics",
      subtitle: "Discover cutting-edge technology at unbeatable prices",
      buttonText: "Shop Electronics",
      categoryName: 'Electronics',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.9))'
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1500&h=600&fit=crop",
      title: "Fashion Trends 2024",
      subtitle: "Style meets comfort - Up to 70% off on premium brands",
      buttonText: "Explore Fashion",
      categoryName: 'Fashion',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(239, 68, 68, 0.9))'
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1500&h=600&fit=crop",
      title: "Home & Living",
      subtitle: "Transform your space with our curated collection",
      buttonText: "Shop Home",
      categoryName: 'Home & Kitchen',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(59, 130, 246, 0.9))'
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1500&h=600&fit=crop",
      title: "Sports & Fitness",
      subtitle: "Gear up for your active lifestyle",
      buttonText: "Shop Sports",
      categoryName: 'Sports',
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

  const handleC