import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { useState } from 'react'
import NotificationCenter from '../components/NotificationCenter'
import ChatWidget from '../components/chat/ChatWidget'

const ManagerLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F8F8]">
      <style>{`
        .mobile-menu-btn { display: none; background: transparent; border: 1px solid #FFFFFF; color: #FFFFFF; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 1.2em; }
        .sidebar-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; }
        .sidebar-overlay.show { display: block; }
        
        /* Desktop styles */
        .manager-sidebar { width: 256px; background: white; border-right: 1px solid #D5D9D9; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        
        @media (min-width: 1280px) {
          .main-content-wrapper { padding: 32px; }
        }
        
        @media (max-width: 1024px) {
          .user-avatar-desktop { display: none; }
          .logout-btn-text { display: none; }
          .main-content-wrapper { padding: 20px; }
        }
        
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block; }
          .manager-sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 280px; max-width: 85vw; z-index: 1000; transform: translateX(-100%); transition: transform 0.3s ease; height: 100vh; overflow-y: auto; }
          .manager-sidebar.show { transform: translateX(0); }
          .main-content-wrapper { padding: 16px; }
        }
        
        @media (max-width: 480px) {
          .header-title { font-size: 1.2em; }
          .header-title-text { display: none; }
          .main-content-wrapper { padding: 12px; }
        }
      `}</style>

      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${showMobileSidebar ? 'show' : ''}`}
        onClick={closeMobileSidebar}
      ></div>

      {/* Top Header */}
      <header className="bg-gradient-to-r from-[#F08804] to-[#FF9900] text-white py-4 px-4 md:px-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-btn" onClick={() => setShowMobileSidebar(!showMobileSidebar)}>
              ☰
            </button>
            <Link to="/manager" className="text-xl md:text-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity header-title">
              🛒 <span className="header-title-text">FastShop Manager</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <NotificationCenter />
            <div className="w-9 h-9 rounded-full bg-white text-[#FF9900] flex items-center justify-center font-bold user-avatar-desktop">
              👤
            </div>
            <button
              onClick={handleLogout}
              className="bg-[#C7511F] hover:bg-[#b04619] px-3 md:px-4 py-2 rounded transition-colors text-sm md:text-base"
            >
              <span className="logout-btn-text">Logout</span>
              <span className="md:hidden">🚪</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className={`w-64 bg-white border-r border-[#D5D9D9] manager-sidebar ${showMobileSidebar ? 'show' : ''}`}>
          <nav className="py-6">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/manager"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">📊</span>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/product-approvals"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/product-approvals')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">✅</span>
                  <span>Product Approvals</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/seller-approvals"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/seller-approvals')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">🏪</span>
                  <span>Seller Approvals</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/orders"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/orders')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">🛍️</span>
                  <span>Orders</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/returns"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/returns')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">↩️</span>
                  <span>Returns</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/disputes"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/disputes')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">⚠️</span>
                  <span>Disputes</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/refunds"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/refunds')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">💰</span>
                  <span>Refunds</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/support-tickets"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/support-tickets')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">🎫</span>
                  <span>Support</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/escalations"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/escalations')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">🚨</span>
                  <span>Escalations</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/performance"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/performance')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">📈</span>
                  <span>Performance</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/seller-performance"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/seller-performance')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">🏪</span>
                  <span>Seller Performance</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/review-moderation"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/review-moderation')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">⭐</span>
                  <span>Review Moderation</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/manager/customer-feedback"
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive('/manager/customer-feedback')
                      ? 'bg-[#FFF4E5] border-l-4 border-[#FF9900] font-semibold text-[#0F1111]'
                      : 'text-[#0F1111] hover:bg-[#F7F8F8]'
                  }`}
                  onClick={closeMobileSidebar}
                >
                  <span className="text-xl">💬</span>
                  <span>Customer Feedback</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 main-content-wrapper">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}

export default ManagerLayout
