import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/redux'
import { logout } from '../store/slices/authSlice'
import { useState, useRef, useEffect } from 'react'
import NotificationCenter from './NotificationCenter'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { items } = useAppSelector((state) => state.cart)
  const guestCart = useAppSelector((state) => state.guestCart)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const accountMenuRef = useRef(null)
  const languageMenuRef = useRef(null)
  const categoryMenuRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false)
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false)
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setShowCategoryMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setShowAccountMenu(false)
  }

  // Calculate cart count based on total quantity
  const cartCount = isAuthenticated 
    ? items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0
    : guestCart.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0

  // Helper function to get category emoji
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
    };
    return emojiMap[categoryName] || '📦';
  };

  // Categories for dropdown
  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: '📱' },
    { name: 'Fashion', slug: 'fashion', icon: '👕' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠' },
    { name: 'Books', slug: 'books', icon: '📚' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: '⚽' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: '💄' },
    { name: 'Toys & Games', slug: 'toys-games', icon: '🎮' },
    { name: 'Automotive', slug: 'automotive', icon: '🚗' }
  ]

  return (
    <header className="bg-gray-800 text-white relative z-[1000] w-full">
      <style>{`
        /* Amazon-Style Full-Width Header */
        header {
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Amazon-Style Responsive Design - Mobile First */
        
        /* Base Mobile Styles (All Mobile Devices) */
        @media (max-width: 768px) {
          /* Header container */
          .mobile-header-container {
            display: flex !important;
            flex-direction: column !important;
            padding: 8px !important;
            gap: 8px !important;
          }
          
          /* Top row with menu, logo, and icons */
          .mobile-top-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
          }
          
          /* Left section (menu + logo) */
          .mobile-left-section {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          
          /* Right section (icons) */
          .mobile-right-section {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
          }
          
          /* Search bar full width on second row */
          .mobile-search-row {
            width: 100% !important;
            display: flex !important;
          }
          
          /* Hide desktop elements */
          .desktop-only { display: none !important; }
          
          /* Mobile menu button */
          .mobile-menu-btn {
            padding: 8px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 20px !important;
          }
          
          /* Logo compact */
          .mobile-logo {
            font-size: 18px !important;
            padding: 4px 8px !important;
            white-space: nowrap !important;
          }
          
          .mobile-logo-icon {
            font-size: 22px !important;
          }
          
          /* Icons sizing */
          .mobile-icon {
            font-size: 24px !important;
            padding: 4px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }
          
          /* Account with username - Always visible */
          .mobile-account-with-name {
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 4px 8px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 4px !important;
          }
          
          .mobile-username {
            display: inline-block !important;
            font-size: 11px !important;
            max-width: 70px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            font-weight: 600 !important;
            color: white !important;
          }
          
          /* Ensure username is visible on all mobile devices */
          .mobile-icon span.text-xs {
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
            font-size: 11px !important;
          }
          
          /* Account icon styling */
          .mobile-account-icon {
            font-size: 20px !important;
            flex-shrink: 0 !important;
          }
          
          /* Cart badge */
          .mobile-cart-badge {
            font-size: 10px !important;
            min-width: 16px !important;
            height: 16px !important;
            top: -4px !important;
            right: -4px !important;
          }
          
          /* Search bar */
          .mobile-search-input {
            font-size: 14px !important;
            padding: 10px 12px !important;
            height: 40px !important;
          }
          
          .mobile-search-btn {
            min-width: 44px !important;
            height: 40px !important;
            font-size: 18px !important;
          }
          
          /* Navigation bar */
          nav {
            padding: 8px !important;
            gap: 8px !important;
          }
          
          nav button, nav a {
            padding: 6px 12px !important;
            font-size: 12px !important;
            min-height: 36px !important;
          }
        }
        
        /* Tablet and larger - Show username */
        @media (min-width: 480px) and (max-width: 768px) {
          .mobile-username {
            display: inline !important;
            font-size: 13px !important;
            max-width: 100px !important;
          }
          
          .mobile-account-with-name {
            padding: 4px 10px !important;
          }
        }
        
        /* iPhone SE Specific (375px and below) */
        @media (max-width: 375px) {
          .mobile-header-container {
            padding: 6px !important;
            gap: 6px !important;
          }
          
          .mobile-top-row {
            gap: 6px !important;
          }
          
          .mobile-left-section {
            gap: 6px !important;
          }
          
          .mobile-right-section {
            gap: 4px !important;
          }
          
          .mobile-menu-btn {
            padding: 6px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 18px !important;
          }
          
          .mobile-logo {
            font-size: 16px !important;
            padding: 2px 6px !important;
          }
          
          .mobile-logo-icon {
            font-size: 20px !important;
          }
          
          .mobile-icon {
            font-size: 20px !important;
            padding: 2px !important;
            min-width: 36px !important;
            min-height: 36px !important;
          }
          
          /* Ensure username is visible on iPhone SE */
          .mobile-icon span.text-xs {
            display: inline-block !important;
            font-size: 10px !important;
            max-width: 55px !important;
            font-weight: 600 !important;
          }
          
          .mobile-account-with-name {
            padding: 3px 6px !important;
            gap: 3px !important;
          }
          
          .mobile-account-icon {
            font-size: 18px !important;
          }
          
          .mobile-cart-badge {
            font-size: 9px !important;
            min-width: 14px !important;
            height: 14px !important;
          }
          
          .mobile-search-input {
            font-size: 13px !important;
            padding: 8px 10px !important;
            height: 36px !important;
          }
          
          .mobile-search-btn {
            min-width: 40px !important;
            height: 36px !important;
            font-size: 16px !important;
          }
          
          nav {
            padding: 6px !important;
            gap: 6px !important;
          }
          
          nav button, nav a {
            padding: 4px 10px !important;
            font-size: 11px !important;
            min-height: 32px !important;
          }
        }
        
        /* Mobile Small (376px - 480px) - Amazon Mobile View */
        @media (min-width: 376px) and (max-width: 480px) {
          .mobile-menu-btn { display: flex !important; }
          .desktop-only { display: none !important; }
          .mobile-search { width: 100% !important; }
          .mobile-compact { padding: 6px 8px !important; }
          .mobile-icon-only { font-size: 18px !important; }
          .mobile-hide-text { display: none !important; }
          .mobile-nav { display: none; }
          .mobile-nav.show { display: block; }
          .mobile-header-row { flex-wrap: wrap !important; gap: 4px !important; }
          .mobile-full-width { width: 100% !important; flex: 1 1 100% !important; margin-top: 8px !important; }
          
          /* Compact header on mobile */
          header > div:first-of-type { padding: 8px 12px !important; }
          
          /* Logo smaller on mobile */
          .mobile-logo { font-size: 16px !important; }
          .mobile-logo-icon { font-size: 20px !important; }
          
          /* Cart and icons compact */
          .mobile-cart-icon { font-size: 24px !important; }
          .mobile-badge { font-size: 10px !important; min-width: 16px !important; height: 16px !important; }
        }
        
        /* Mobile Medium (481px - 640px) - Amazon Tablet Portrait */
        @media (min-width: 481px) and (max-width: 640px) {
          .mobile-menu-btn { display: flex !important; }
          .desktop-only { display: none !important; }
          .tablet-show { display: flex !important; }
          .mobile-search { width: 100% !important; }
          .mobile-nav { display: none; }
          .mobile-nav.show { display: block; }
          .mobile-header-row { flex-wrap: wrap !important; }
          .mobile-full-width { width: 100% !important; flex: 1 1 100% !important; margin-top: 8px !important; }
          
          header > div:first-of-type { padding: 10px 16px !important; }
        }
        
        /* Tablet (641px - 768px) - Amazon Tablet Landscape */
        @media (min-width: 641px) and (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .desktop-only { display: none !important; }
          .tablet-show { display: flex !important; }
          .mobile-nav { display: none; }
          .mobile-nav.show { display: block; }
          
          /* Show some desktop features */
          .tablet-returns { display: flex !important; }
          
          header > div:first-of-type { padding: 12px 20px !important; gap: 8px !important; }
        }
        
        /* Tablet Large (769px - 1024px) - Amazon Desktop Compact */
        @media (min-width: 769px) and (max-width: 1024px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-only { display: none !important; }
          .tablet-compact { padding: 10px 16px !important; }
          .tablet-hide { display: none !important; }
          
          /* Show most desktop features */
          .desktop-only { display: flex !important; }
          
          /* Compact spacing */
          header > div:first-of-type { gap: 8px !important; }
          
          /* Smaller text on compact desktop */
          .tablet-text-sm { font-size: 12px !important; }
        }
        
        /* Desktop Small (1025px - 1280px) - Amazon Standard Desktop */
        @media (min-width: 1025px) and (max-width: 1280px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-only { display: none !important; }
          .desktop-show { display: flex !important; }
          
          header > div:first-of-type { gap: 12px !important; }
        }
        
        /* Desktop Large (1281px+) - Amazon Wide Desktop */
        @media (min-width: 1281px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-only { display: none !important; }
          .desktop-show { display: flex !important; }
          .desktop-wide { display: flex !important; }
          
          header > div:first-of-type { gap: 16px !important; padding: 12px 24px !important; }
        }
        
        /* Sticky Header - Always on top like Amazon */
        header { 
          position: sticky !important; 
          top: 0 !important; 
          z-index: 1000 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Touch-friendly buttons on mobile */
        @media (max-width: 768px) {
          button, a { 
            min-height: 44px !important; 
            min-width: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
        
        /* Desktop interactions */
        @media (min-width: 769px) {
          button, a { 
            cursor: pointer !important; 
            pointer-events: auto !important;
            transition: all 0.2s ease !important;
          }
          
          button:hover, a:hover {
            border-color: white !important;
          }
          
          .desktop-only { 
            display: flex !important; 
            pointer-events: auto !important;
          }
        }
        
        /* Dropdown positioning - Always above content */
        header .fixed {
          position: fixed !important;
          z-index: 99999 !important;
        }
        
        nav .relative {
          position: relative !important;
          z-index: 1001 !important;
        }
        
        /* Smooth transitions */
        * {
          transition: all 0.2s ease;
        }
        
        /* Hide scrollbar on mobile nav */
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        .overflow-x-auto {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Amazon-style focus states */
        button:focus, a:focus {
          outline: 2px solid #FF9900 !important;
          outline-offset: 2px !important;
        }
        
        /* Responsive text sizing */
        @media (max-width: 480px) {
          .responsive-text-xs { font-size: 10px !important; }
          .responsive-text-sm { font-size: 12px !important; }
          .responsive-text-base { font-size: 14px !important; }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .responsive-text-xs { font-size: 11px !important; }
          .responsive-text-sm { font-size: 13px !important; }
          .responsive-text-base { font-size: 15px !important; }
        }
        
        @media (min-width: 769px) {
          .responsive-text-xs { font-size: 12px !important; }
          .responsive-text-sm { font-size: 14px !important; }
          .responsive-text-base { font-size: 16px !important; }
        }
      `}</style>
      
      
      {/* Mobile Header Layout - Amazon Style */}
      <div className="mobile-header-container md:hidden">
        {/* Top Row: Menu + Logo + Account + Wishlist + Cart */}
        <div className="mobile-top-row">
          {/* Left Section: Menu + Logo */}
          <div className="mobile-left-section">
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn text-white hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Open menu"
            >
              ☰
            </button>

            {/* Logo */}
            <Link 
              to="/" 
              className="mobile-logo font-bold flex items-center gap-1 hover:text-orange-400 transition-all flex-shrink-0 border border-transparent hover:border-white rounded"
              aria-label="FastShop Home"
            >
              <span className="mobile-logo-icon">🛒</span>
              <span className="text-orange-400 tracking-tight">FastShop</span>
            </Link>
          </div>

          {/* Right Section: Account + Wishlist + Cart */}
          <div className="mobile-right-section">
            {/* Account Icon with Display Name */}
            {isAuthenticated ? (
              <div 
                ref={accountMenuRef}
                className="mobile-account-with-name relative flex items-center gap-1 border border-transparent rounded hover:border-white cursor-pointer"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
              >
                <span className="mobile-account-icon">👤</span>
                <span className="mobile-username text-xs text-white whitespace-nowrap">
                  {user?.display_name || user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
                
                {showAccountMenu && (
                  <div 
                    className="fixed bg-white text-black rounded shadow-lg w-80 max-w-[90vw]"
                    style={{
                      top: accountMenuRef.current?.getBoundingClientRect().bottom + 'px',
                      right: window.innerWidth - (accountMenuRef.current?.getBoundingClientRect().right || 0) + 'px',
                      zIndex: 99999
                    }}
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-bold text-sm mb-3 text-gray-800">Your Account</h3>
                          <div className="space-y-1">
                            <button onClick={() => { setShowAccountMenu(false); navigate('/account'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Account</button>
                            <button onClick={() => { setShowAccountMenu(false); navigate('/orders'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Orders</button>
                            <button onClick={() => { setShowAccountMenu(false); navigate('/wishlist'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Wish List</button>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm mb-3 text-gray-800">Your Lists</h3>
                          <div className="space-y-1">
                            <button onClick={() => { setShowAccountMenu(false); navigate('/lists/create'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Create a List</button>
                            {user?.role === 'seller' && (
                              <button onClick={() => { setShowAccountMenu(false); navigate('/seller'); }} className="block w-full text-left text-sm text-orange-600 hover:underline font-medium">🏪 Seller Central</button>
                            )}
                            {user?.role === 'admin' && (
                              <button onClick={() => { setShowAccountMenu(false); navigate('/admin'); }} className="block w-full text-left text-sm text-red-600 hover:underline font-medium">⚙️ Admin Dashboard</button>
                            )}
                            {user?.role === 'manager' && (
                              <button onClick={() => { setShowAccountMenu(false); navigate('/manager'); }} className="block w-full text-left text-sm text-blue-600 hover:underline font-medium">📊 Manager Portal</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <hr className="my-3" />
                      <button onClick={handleLogout} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="mobile-icon flex items-center justify-center border border-transparent rounded hover:border-white no-underline text-white"
              >
                <span className="text-2xl">👤</span>
              </Link>
            )}

            {/* Wishlist Icon */}
            {isAuthenticated && (
              <Link 
                to="/wishlist" 
                className="mobile-icon flex items-center justify-center border border-transparent rounded hover:border-white no-underline text-white"
              >
                <span className="text-2xl">❤️</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link 
              to="/cart" 
              className="mobile-icon relative flex items-center justify-center border border-transparent rounded hover:border-white no-underline text-white"
            >
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="mobile-cart-badge absolute bg-orange-400 text-gray-800 rounded-full flex items-center justify-center font-bold px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar Row - Full Width */}
        <div className="mobile-search-row">
          <form onSubmit={handleSearch} className="flex w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input flex-1 border-none text-black outline-none rounded-l"
              placeholder="Search FastShop"
            />
            <button 
              type="submit" 
              className="mobile-search-btn bg-orange-400 border-none rounded-r hover:bg-orange-500 cursor-pointer transition-colors flex items-center justify-center"
            >
              🔍
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Header Layout - Original */}
      <div className="hidden md:flex items-center px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
        {/* 1. Mobile Menu Button - Mobile Only (Hidden on Desktop) */}
        <button 
          className="mobile-menu-btn text-lg sm:text-xl md:text-2xl p-1 sm:p-1.5 md:p-2 hover:bg-gray-700 rounded flex items-center justify-center md:hidden transition-colors"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{ minWidth: '36px', minHeight: '36px' }}
          aria-label="Open menu"
        >
          ☰
        </button>

        {/* 2. Logo with .com - Amazon Style Responsive */}
        <Link 
          to="/" 
          className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold flex items-center gap-0.5 sm:gap-1 hover:text-orange-400 transition-all flex-shrink-0 px-0.5 sm:px-1 md:px-2 border border-transparent hover:border-white rounded py-0.5 sm:py-1"
          aria-label="FastShop Home"
        >
          <span className="text-base sm:text-lg md:text-2xl lg:text-3xl">🛒</span>
          <span className="text-orange-400 tracking-tight whitespace-nowrap">FastShop</span>
          <span className="responsive-text-xs text-gray-300 hidden md:inline">.com</span>
        </Link>

        {/* 3. Deliver To - Desktop Only */}
        <div className="desktop-only hidden lg:flex items-center gap-1 px-2 py-1.5 border border-transparent rounded hover:border-white cursor-pointer">
          <span className="text-lg">�</span>
          <div>
            <div className="text-xs text-gray-300">Deliver to</div>
            <div className="font-bold text-sm">New York 10001</div>
          </div>
        </div>

        {/* 4. Search Bar - Amazon Style */}
        <form onSubmit={handleSearch} className="flex-1 flex h-8 sm:h-9 md:h-10 min-w-0 mobile-full-width order-last sm:order-none">
          <div className="relative hidden md:block">
            <select 
              className="bg-gray-100 border-none px-2.5 rounded-l text-black text-sm cursor-pointer h-full min-w-[60px]"
              onChange={(e) => {
                if (e.target.value !== 'All') {
                  navigate(`/category/${e.target.value.toLowerCase().replace(/\s+/g, '-')}`)
                }
              }}
            >
              <option value="All">All</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-search-input flex-1 border-none px-2 sm:px-3 md:px-4 text-black outline-none text-xs sm:text-sm rounded-l md:rounded-none"
            placeholder="Search FastShop"
            style={{ minWidth: '80px' }}
          />
          <button type="submit" className="mobile-search-btn bg-orange-400 border-none px-2 sm:px-2.5 md:px-5 rounded-r text-base sm:text-lg md:text-xl hover:bg-orange-500 cursor-pointer transition-colors flex items-center justify-center" style={{ minWidth: '36px' }}>
            🔍
          </button>
        </form>

        {/* 5. Language Selector - Desktop Only */}
        <div 
          ref={languageMenuRef}
          className="desktop-only hidden lg:flex relative items-center gap-1 px-2 py-1.5 border border-transparent rounded hover:border-white cursor-pointer"
          onMouseEnter={() => setShowLanguageMenu(true)}
          onMouseLeave={() => setShowLanguageMenu(false)}
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
        >
          <span className="text-lg">🇺🇸</span>
          <span className="text-sm font-bold">EN</span>
          <span className="text-xs">▼</span>
          
          {showLanguageMenu && (
            <div 
              className="fixed bg-white text-black rounded shadow-lg w-48"
              style={{
                top: languageMenuRef.current?.getBoundingClientRect().bottom + 'px',
                left: languageMenuRef.current?.getBoundingClientRect().left + 'px',
                zIndex: 99999
              }}
            >
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                  <span>🇺🇸</span>
                  <span className="text-sm">English - EN</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                  <span>🇪🇸</span>
                  <span className="text-sm">Español - ES</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded cursor-pointer">
                  <span>🇫🇷</span>
                  <span className="text-sm">Français - FR</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Account & Lists - Amazon Style */}
        {isAuthenticated ? (
          <div 
            ref={accountMenuRef}
            className="mobile-account relative flex flex-col px-0.5 sm:px-1 md:px-2.5 py-0.5 sm:py-1 border border-transparent rounded hover:border-white cursor-pointer flex-shrink-0"
            onMouseEnter={() => setShowAccountMenu(true)}
            onMouseLeave={() => setShowAccountMenu(false)}
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            style={{ minWidth: '36px' }}
          >
            <span className="text-xs hidden lg:block">Hello, {user?.display_name || user?.name || user?.email?.split('@')[0] || 'User'}</span>
            <span className="font-bold text-xs sm:text-sm flex items-center gap-0.5 sm:gap-1 justify-center">
              <span className="lg:hidden text-lg sm:text-xl">👤</span>
              <span className="hidden lg:inline">Account & Lists</span>
              <span className="text-xs hidden lg:inline">▼</span>
            </span>
            
            {showAccountMenu && (
              <div 
                className="fixed bg-white text-black rounded shadow-lg w-80"
                style={{
                  top: accountMenuRef.current?.getBoundingClientRect().bottom + 'px',
                  right: window.innerWidth - (accountMenuRef.current?.getBoundingClientRect().right || 0) + 'px',
                  zIndex: 99999
                }}
              >
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-sm mb-3 text-gray-800">Your Account</h3>
                      <div className="space-y-1">
                        <button onClick={() => { setShowAccountMenu(false); navigate('/account'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Account</button>
                        <button onClick={() => { setShowAccountMenu(false); navigate('/orders'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Orders</button>
                        <button onClick={() => { setShowAccountMenu(false); navigate('/wishlist'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Wish List</button>
                        <button onClick={() => { setShowAccountMenu(false); navigate('/recommendations'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Your Recommendations</button>
                        <button onClick={() => { setShowAccountMenu(false); navigate('/browsing-history'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Browsing History</button>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm mb-3 text-gray-800">Your Lists</h3>
                      <div className="space-y-1">
                        <button onClick={() => { setShowAccountMenu(false); navigate('/lists/create'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Create a List</button>
                        <button onClick={() => { setShowAccountMenu(false); navigate('/wishlist'); }} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Find a List or Registry</button>
                        {user?.role === 'seller' && (
                          <button onClick={() => { setShowAccountMenu(false); navigate('/seller'); }} className="block w-full text-left text-sm text-orange-600 hover:underline font-medium">🏪 Seller Central</button>
                        )}
                        {user?.role === 'admin' && (
                          <button onClick={() => { setShowAccountMenu(false); navigate('/admin'); }} className="block w-full text-left text-sm text-red-600 hover:underline font-medium">⚙️ Admin Dashboard</button>
                        )}
                        {user?.role === 'manager' && (
                          <button onClick={() => { setShowAccountMenu(false); navigate('/manager'); }} className="block w-full text-left text-sm text-blue-600 hover:underline font-medium">📊 Manager Portal</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <hr className="my-3" />
                  <button onClick={handleLogout} className="block w-full text-left text-sm text-gray-700 hover:text-orange-600 hover:underline">Sign Out</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <Link to="/login" className="mobile-account flex flex-col px-0.5 sm:px-1 md:px-2.5 py-0.5 sm:py-1 border border-transparent rounded hover:border-white no-underline text-white" style={{ minWidth: '36px' }}>
              <span className="text-xs hidden lg:block">Hello, sign in</span>
              <span className="font-bold text-xs sm:text-sm flex items-center gap-0.5 sm:gap-1 justify-center">
                <span className="lg:hidden text-lg sm:text-xl">👤</span>
                <span className="hidden lg:inline">Account & Lists</span>
                <span className="text-xs hidden lg:inline">▼</span>
              </span>
            </Link>
          </div>
        )}

        {/* 7. Returns & Orders - Amazon Style */}
        <Link to="/orders" className="desktop-only hidden md:flex flex-col px-2 py-1.5 border border-transparent rounded hover:border-white no-underline text-white flex-shrink-0">
          <span className="text-xs">Returns</span>
          <span className="font-bold text-sm">& Orders</span>
        </Link>

        {/* Notifications - Compact */}
        {isAuthenticated && (
          <div className="flex items-center px-0 sm:px-0.5 md:px-2 py-0.5 sm:py-1 flex-shrink-0">
            <NotificationCenter />
          </div>
        )}

        {/* Wishlist - Show icon on mobile */}
        {isAuthenticated && (
          <Link to="/wishlist" className="mobile-wishlist flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 md:px-2 py-0.5 sm:py-1 border border-transparent rounded hover:border-white no-underline text-white flex-shrink-0" style={{ minWidth: '36px' }}>
            <span className="text-base sm:text-xl md:text-2xl">❤️</span>
            <span className="font-bold text-sm hidden lg:inline">Wishlist</span>
          </Link>
        )}

        {/* 8. Cart - Amazon Style */}
        <Link to="/cart" className="flex items-center gap-0.5 sm:gap-1 md:gap-2 px-0.5 sm:px-1 md:px-2 py-0.5 sm:py-1 border border-transparent rounded hover:border-white no-underline text-white flex-shrink-0" style={{ minWidth: '36px' }}>
          <div className="mobile-cart-icon relative text-lg sm:text-xl md:text-3xl">
            🛒
            {cartCount > 0 && (
              <span className="mobile-badge absolute -top-1 -right-2 bg-orange-400 text-gray-800 rounded-full min-w-[14px] sm:min-w-[16px] md:min-w-[20px] h-3.5 sm:h-4 md:h-5 flex items-center justify-center text-[9px] sm:text-xs font-bold px-0.5 sm:px-1">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xs text-orange-400 font-bold">{cartCount}</span>
            <span className="font-bold text-xs sm:text-sm">Cart</span>
          </div>
        </Link>
      </div>

      {/* Mobile Menu Overlay - Enhanced */}
      {showMobileMenu && (
        <div className="md:hidden bg-gray-700 p-3 sm:p-4 border-t border-gray-600">
          <div className="space-y-2 sm:space-y-3">
            {isAuthenticated && (
              <div className="bg-gray-600 p-3 rounded mb-3">
                <div className="text-white font-bold text-sm mb-1">
                  Hello, {user?.display_name || user?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-gray-300 text-xs">{user?.email}</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Link to="/orders" className="flex items-center gap-2 text-white py-2.5 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                <span className="text-lg">📦</span>
                <span>Orders</span>
              </Link>
              {isAuthenticated && (
                <Link to="/wishlist" className="flex items-center gap-2 text-white py-2.5 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                  <span className="text-lg">❤️</span>
                  <span>Wishlist</span>
                </Link>
              )}
              <Link to="/deals" className="flex items-center gap-2 text-white py-2.5 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                <span className="text-lg">🏷️</span>
                <span>Deals</span>
              </Link>
              <Link to="/account" className="flex items-center gap-2 text-white py-2.5 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                <span className="text-lg">⚙️</span>
                <span>Account</span>
              </Link>
            </div>

            <div className="border-t border-gray-600 pt-3">
              <div className="text-gray-300 text-xs font-bold mb-2 uppercase">Shop by Category</div>
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.slug}
                  to={`/category/${category.slug}`}
                  className="flex items-center gap-3 text-white py-2 px-3 hover:bg-gray-600 rounded text-sm no-underline"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="text-lg">{getCategoryEmoji(category.name)}</span>
                  <span>{category.name}</span>
                </Link>
              ))}
              <Link to="/categories" className="flex items-center gap-3 text-orange-400 py-2 px-3 hover:bg-gray-600 rounded text-sm font-medium no-underline" onClick={() => setShowMobileMenu(false)}>
                <span className="text-lg">📂</span>
                <span>See All Categories</span>
              </Link>
            </div>

            <div className="border-t border-gray-600 pt-3">
              <Link to="/customer-service" className="block text-white py-2 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                💬 Customer Service
              </Link>
              <Link to="/sellers" className="block text-white py-2 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                🏪 Browse Sellers
              </Link>
              <Link to="/seller/register" className="block text-white py-2 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileMenu(false)}>
                💼 Sell on FastShop
              </Link>
            </div>

            <div className="border-t border-gray-600 pt-3">
              <div className="text-gray-300 text-xs mb-2">Language</div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 rounded text-white text-sm flex-1 justify-center">
                  🇺🇸 EN
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 rounded text-white text-sm flex-1 justify-center">
                  🇪🇸 ES
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-600 rounded text-white text-sm flex-1 justify-center">
                  🇫🇷 FR
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="border-t border-gray-600 pt-3">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-white py-2.5 px-3 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-600 pt-3 space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center text-white py-2.5 px-3 bg-orange-500 hover:bg-orange-600 rounded text-sm font-medium no-underline"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center text-white py-2.5 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium no-underline"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Bar - Amazon Style */}
      <nav className="bg-gray-700 px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 md:py-2.5 flex items-center gap-1 sm:gap-2 md:gap-5 overflow-x-auto relative z-[1001]">
        <button 
          className="md:hidden text-white px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm border border-transparent rounded hover:border-white flex items-center gap-0.5 sm:gap-1 whitespace-nowrap"
          onClick={() => setShowMobileNav(!showMobileNav)}
          style={{ minHeight: '32px' }}
        >
          ☰ <span className="hidden xs:inline">All</span>
        </button>
        
        <div 
          ref={categoryMenuRef}
          className="relative hidden md:block z-[1002]"
          onMouseEnter={() => setShowCategoryMenu(true)}
          onMouseLeave={() => setShowCategoryMenu(false)}
        >
          <button 
            className="text-white px-2 sm:px-2.5 py-1 text-xs sm:text-sm border border-transparent rounded hover:border-white flex items-center gap-0.5 sm:gap-1 cursor-pointer transition-colors"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            style={{ minHeight: '32px' }}
          >
            ☰ All <span className="text-xs ml-0.5 sm:ml-1">▼</span>
          </button>
          
          {showCategoryMenu && (
            <div 
              className="fixed bg-white text-black rounded shadow-2xl w-64 border border-gray-200"
              style={{
                top: categoryMenuRef.current?.getBoundingClientRect().bottom + 'px',
                left: categoryMenuRef.current?.getBoundingClientRect().left + 'px',
                zIndex: 99999
              }}
            >
              <div className="p-2 max-h-[500px] overflow-y-auto">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/category/${category.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 rounded text-sm text-gray-800 no-underline transition-colors"
                    onClick={() => setShowCategoryMenu(false)}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </Link>
                ))}
                <hr className="my-2 border-gray-200" />
                <Link
                  to="/categories"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 rounded text-sm text-orange-600 font-medium no-underline transition-colors"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <span className="text-lg">📂</span>
                  <span>See All Categories</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-5 flex-wrap">
          <Link to="/deals" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white whitespace-nowrap">
            Today's Deals
          </Link>
          <Link to="/sellers" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white whitespace-nowrap">
            Browse Sellers
          </Link>
          <Link to="/customer-service" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white whitespace-nowrap">
            Customer Service
          </Link>
          <Link to="/registry" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white whitespace-nowrap hidden lg:block">
            Registry
          </Link>
          <Link to="/gift-cards" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white whitespace-nowrap hidden lg:block">
            Gift Cards
          </Link>
          <Link to="/seller/register" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white whitespace-nowrap">
            Sell
          </Link>
        </div>
        
        <div className="md:hidden flex items-center gap-1 sm:gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link to="/deals" className="text-white no-underline px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs border border-transparent rounded hover:border-white whitespace-nowrap">
            🏷️ Deals
          </Link>
          <Link to="/sellers" className="text-white no-underline px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs border border-transparent rounded hover:border-white whitespace-nowrap">
            🏪 Sellers
          </Link>
          <Link to="/customer-service" className="text-white no-underline px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs border border-transparent rounded hover:border-white whitespace-nowrap">
            💬 Help
          </Link>
          <Link to="/seller/register" className="text-white no-underline px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs border border-transparent rounded hover:border-white whitespace-nowrap">
            💼 Sell
          </Link>
        </div>
        
        <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3">
          {!isAuthenticated && (
            <Link 
              to="/register" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-1.5 sm:px-2 md:px-4 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm font-semibold transition-colors no-underline whitespace-nowrap flex items-center gap-0.5 sm:gap-1"
            >
              🚀 <span className="hidden sm:inline">Sign Up</span>
            </Link>
          )}
          
          <Link to="/prime" className="text-white no-underline px-2 lg:px-2.5 py-1 text-xs lg:text-sm border border-transparent rounded hover:border-white hidden lg:block">
            <span className="text-orange-400 font-bold">Prime</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {showMobileNav && (
        <div className="md:hidden bg-gray-700 border-t border-gray-600 max-h-[70vh] overflow-y-auto">
          <div className="p-3 sm:p-4 space-y-2">
            <div className="text-white font-bold text-sm mb-3">Shop by Category</div>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-gray-600 rounded text-sm no-underline"
                onClick={() => setShowMobileNav(false)}
              >
                <span className="text-lg">{getCategoryEmoji(category.name)}</span>
                <span>{category.name}</span>
              </Link>
            ))}
            <hr className="border-gray-600 my-3" />
            <div className="text-white font-bold text-sm mb-3">Quick Links</div>
            <Link to="/deals" className="flex items-center gap-3 text-white py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">🏷️</span>
              <span>Today's Deals</span>
            </Link>
            <Link to="/sellers" className="flex items-center gap-3 text-white py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">🏪</span>
              <span>Browse Sellers</span>
            </Link>
            <Link to="/customer-service" className="flex items-center gap-3 text-white py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">💬</span>
              <span>Customer Service</span>
            </Link>
            <Link to="/registry" className="flex items-center gap-3 text-white py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">🎁</span>
              <span>Registry</span>
            </Link>
            <Link to="/gift-cards" className="flex items-center gap-3 text-white py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">💳</span>
              <span>Gift Cards</span>
            </Link>
            <Link to="/seller/register" className="flex items-center gap-3 text-white py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">💼</span>
              <span>Sell on FastShop</span>
            </Link>
            <Link to="/prime" className="flex items-center gap-3 text-orange-400 font-bold py-2.5 px-3 hover:bg-gray-600 rounded text-sm no-underline" onClick={() => setShowMobileNav(false)}>
              <span className="text-lg">⭐</span>
              <span>Prime</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
