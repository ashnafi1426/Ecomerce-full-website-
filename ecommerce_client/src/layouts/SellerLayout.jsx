import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/redux'
import { logout } from '../store/slices/authSlice'
import { toast } from 'react-toastify'
import { useState } from 'react'
import NotificationCenter from '../components/NotificationCenter'
import ChatWidget from '../components/chat/ChatWidget'

const SellerLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false)
  }

  return (
    <div className="seller-layout-container">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .seller-layout-container { min-height: 100vh; background: #F7F8F8; }
        
        /* Top Header */
        .top-header { background: #131921; color: #FFFFFF; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
        .logo { font-size: 1.5em; font-weight: bold; color: #FFFFFF; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .logo:hover { color: #FF9900; }
        .user-menu { display: flex; align-items: center; gap: 15px; }
        .user-info { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 12px; border: 1px solid transparent; border-radius: 4px; }
        .user-info:hover { border-color: #FFFFFF; }
        .user-avatar { width: 35px; height: 35px; border-radius: 50%; background: #FF9900; display: flex; align-items: center; justify-content: center; font-size: 1.2em; }
        .btn-logout { background: #C7511F; color: #FFFFFF; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background 0.2s; }
        .btn-logout:hover { background: #A33F1A; }
        .mobile-menu-btn { display: none; background: transparent; border: 1px solid #FFFFFF; color: #FFFFFF; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 1.2em; }
        
        /* Dashboard Layout */
        .dashboard-layout { display: flex; min-height: calc(100vh - 60px); }
        
        /* Sidebar */
        .sidebar { width: 250px; background: #FFFFFF; border-right: 1px solid #D5D9D9; padding: 20px 0; position: sticky; top: 60px; height: calc(100vh - 60px); overflow-y: auto; transition: transform 0.3s ease; }
        .sidebar-menu { list-style: none; }
        .sidebar-menu li { margin-bottom: 5px; }
        .sidebar-menu a { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #0F1111; text-decoration: none; transition: all 0.2s; border-left: 3px solid transparent; }
        .sidebar-menu a:hover { background: #F7F8F8; border-left-color: #FF9900; }
        .sidebar-menu a.active { background: #FFF4E5; border-left-color: #FF9900; font-weight: 600; }
        .menu-icon { font-size: 1.3em; width: 25px; text-align: center; }
        
        /* Main Content */
        .main-content { flex: 1; padding: 20px; overflow-y: auto; max-width: 100%; }
        
        /* Responsive utilities */
        @media (min-width: 1280px) {
          .main-content { padding: 30px; }
        }
        
        /* Mobile Sidebar Overlay */
        .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; }
        .sidebar-overlay.show { display: block; }
        
        @media (max-width: 1024px) {
          .logo { font-size: 1.3em; }
          .user-info { gap: 5px; padding: 6px 8px; }
          .user-info > div { display: none; }
          .btn-logout { padding: 6px 12px; font-size: 0.85em; }
        }
        
        @media (max-width: 768px) {
          .top-header { padding: 12px 15px; flex-wrap: wrap; }
          .logo { font-size: 1.2em; }
          .mobile-menu-btn { display: block; }
          .user-menu { gap: 10px; }
          .user-info { display: none; }
          .btn-logout { padding: 6px 10px; font-size: 0.8em; }
          
          .dashboard-layout { flex-direction: column; }
          .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 280px; max-width: 85vw; z-index: 1000; transform: translateX(-100%); height: 100vh; }
          .sidebar.show { transform: translateX(0); }
          .main-content { padding: 15px; width: 100%; }
        }
        
        @media (max-width: 480px) {
          .top-header { padding: 10px; }
          .logo { font-size: 1em; }
          .logo span { display: none; }
          .user-menu { gap: 8px; }
          .btn-logout { padding: 5px 8px; font-size: 0.75em; }
          .main-content { padding: 10px; }
        }
      `}</style>

      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${showMobileSidebar ? 'show' : ''}`}
        onClick={closeMobileSidebar}
      ></div>

      {/* TOP HEADER */}
      <div className="top-header">
        <div className="flex items-center gap-3">
          <button className="mobile-menu-btn" onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
            ☰
          </button>
          <Link to="/" className="logo">🛒 <span>FastShop Seller</span></Link>
        </div>
        <div className="user-menu">
          <NotificationCenter />
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div>
              <div style={{ fontSize: '0.85em' }}>Seller Account</div>
              <div style={{ fontWeight: 'bold' }}>{user?.displayName || user?.businessName || 'TechStore Pro'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* DASHBOARD LAYOUT */}
      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <aside className={`sidebar ${showMobileSidebar ? 'show' : ''}`}>
          <ul className="sidebar-menu">
            <li>
              <Link to="/seller" className={isActive('/seller') && location.pathname === '/seller' ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">📊</span> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/seller/products" className={isActive('/seller/products') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">📦</span> Products
              </Link>
            </li>
            <li>
              <Link to="/seller/orders" className={isActive('/seller/orders') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">🛍️</span> Orders
              </Link>
            </li>
            <li>
              <Link to="/seller/inventory" className={isActive('/seller/inventory') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">📋</span> Inventory
              </Link>
            </li>
            <li>
              <Link to="/seller/payments" className={isActive('/seller/payments') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">💰</span> Payments
              </Link>
            </li>
            <li>
              <Link to="/seller/analytics" className={isActive('/seller/analytics') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">📈</span> Analytics
              </Link>
            </li>
            <li>
              <Link to="/seller/reviews" className={isActive('/seller/reviews') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">⭐</span> Reviews
              </Link>
            </li>
            <li>
              <Link to="/seller/settings" className={isActive('/seller/settings') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">⚙️</span> Settings
              </Link>
            </li>
            <li>
              <Link to="/seller/messages" className={isActive('/seller/messages') ? 'active' : ''} onClick={closeMobileSidebar}>
                <span className="menu-icon">💬</span> Support
              </Link>
            </li>
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}

export default SellerLayout
