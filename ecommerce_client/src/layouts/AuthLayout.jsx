import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center responsive-padding">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <span className="text-3xl md:text-4xl">🛒</span>
              <span className="text-2xl md:text-3xl font-bold text-gray-800">FastShop</span>
            </div>
          </Link>
        </div>
        
        {/* Auth Form Container */}
        <div className="bg-white rounded-lg shadow-lg responsive-padding">
          <Outlet />
        </div>
        
        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">© 2024 FastShop. All rights reserved.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/help" className="hover:text-[#FF9900] transition-colors">Help</Link>
            <Link to="/privacy" className="hover:text-[#FF9900] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#FF9900] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout