import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/redux'
import { logout } from '../store/slices/authSlice'
import { toast } from 'react-toastify'
import { useState } from 'react'
import NotificationCenter from '../components/NotificationCenter'
import ChatWidget from '../components/chat/ChatWidget'

const AdminLayout = () => {
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
    <div className="admin-layout-container">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .admin-layout-container { min-height: 100vh; background: #F7F8F8; }
        
        /* Top Header */
        .top-header { background: linear-gradient(135deg, #131921 0%, #232F3E 100%); color: #FFFFFF; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); position: sticky; top: 0; z-index: 100; }
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
        .sidebar { width: 260px; background: #FFFFFF; border-right: 1px solid #D5D9D9; padding: 20px 0; box-shadow: 2px 0 8px rgba(0,0,0,0.05); position: sticky; top: 60px; height: calc(100vh - 60px); overflow-y: auto; transition: transform 0.3s ease; }
        .sidebar-section { margin-bottom: 25px; }
        .sidebar-section-title { padding: 0 20px; font-size: 0.75em; text-transform: uppercase; color: #565959; font-weight: 700; margin-bottom: 10px; }
        .sidebar-menu { list-style: none; }
        .sidebar-menu li { margin-bottom: 3px; }
        .sidebar-menu a { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #0F1111; text-decoration: none; transition: all 0.2s; }
        .sidebar-menu a:hover { background: #F7F8F8; border-left: 3px solid #FF9900; }
        .sidebar-menu a.active { background: linear-gradient(90deg, #FFF4E5 0%, transparent 100%); border-left: 3px solid #FF9900; font-weight: 600; color: #FF9900; }
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
          <Link to="/" className="logo">🛒 <span>FastShop Admin</span></Link>
        </div>
        <div className="user-menu">
          <NotificationCenter />
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div>
              <div style={{ fontSize: '0.85em' }}>Administrator</div>
              <div style={{ fontWeight: 'bold' }}>{user?.displayName || user?.email || 'Admin User'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* DASHBOARD LAYOUT */}
      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <aside className={`sidebar ${showMobileSidebar ? 'show' : ''}`}>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main</div>
            <ul className="sidebar-menu">
              <li>
                <Link to="/admin" className={isActive('/admin') && location.pathname === '/admin' ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">📊</span> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className={isActive('/admin/analytics') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">📈</span> Analytics
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-section-title">Management</div>
            <ul className="sidebar-menu">
              <li>
                <Link to="/admin/users" className={isActive('/admin/users') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">👥</span> Users
                </Link>
              </li>
              <li>
                <Link to="/admin/customers" className={isActive('/admin/customers') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">🛍️</span> Customers
                </Link>
              </li>
              <li>
                <Link to="/admin/sellers" className={isActive('/admin/sellers') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">🏪</span> Sellers
                </Link>
              </li>
              <li>
                <Link to="/admin/managers" className={isActive('/admin/managers') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">👔</span> Managers
                </Link>
              </li>
              <li>
                <Link to="/admin/roles" className={isActive('/admin/roles') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">🔐</span> Roles
                </Link>
              </li>
              <li>
                <Link to="/admin/products" className={isActive('/admin/products') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">📦</span> Products
                </Link>
              </li>
              <li>
                <Link to="/admin/product-approvals" className={isActive('/admin/product-approvals') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">✅</span> Product Approvals
                </Link>
              </li>
              <li>
                <Link to="/admin/orders" className={isActive('/admin/orders') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">🛒</span> Orders
                </Link>
              </li>
              <li>
                <Link to="/admin/refunds" className={isActive('/admin/refunds') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">💸</span> Refunds
                </Link>
              </li>
              <li>
                <Link to="/admin/categories" className={isActive('/admin/categories') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">📂</span> Categories
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-section-title">Financial</div>
            <ul className="sidebar-menu">
              <li>
                <Link to="/admin/payments" className={isActive('/admin/payments') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">💰</span> Payments
                </Link>
              </li>
              <li>
                <Link to="/admin/seller-earnings" className={isActive('/admin/seller-earnings') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">💵</span> Seller Earnings
                </Link>
              </li>
              <li>
                <Link to="/admin/commission-settings" className={isActive('/admin/commission-settings') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">⚙️</span> Commission Settings
                </Link>
              </li>
              <li>
                <Link to="/admin/payouts" className={isActive('/admin/payouts') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">💳</span> Payouts
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <div className="sidebar-section-title">System</div>
            <ul className="sidebar-menu">
              <li>
                <Link to="/admin/settings" className={isActive('/admin/settings') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">⚙️</span> Settings
                </Link>
              </li>
              <li>
                <Link to="/admin/logs" className={isActive('/admin/logs') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">📋</span> Audit Logs
                </Link>
              </li>
              <li>
                <Link to="/admin/reports" className={isActive('/admin/reports') ? 'active' : ''} onClick={closeMobileSidebar}>
                  <span className="menu-icon">📄</span> Reports
                </Link>
              </li>
            </ul>
          </div>
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

export default AdminLayout
