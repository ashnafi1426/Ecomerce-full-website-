import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/redux'
import { login } from '../../store/slices/authSlice'
import { toast } from 'react-hot-toast'

const LoginPageSimple = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepSignedIn: false
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      console.log('🔐 Attempting login with:', formData.email)
      
      const result = await dispatch(login({ 
        email: formData.email, 
        password: formData.password 
      })).unwrap()
      
      console.log('✅ Login result:', result)
      console.log('👤 User:', result.user)
      console.log('🎭 Role:', result.user?.role)
      
      toast.success('Login successful!')
      
      // Get user role
      const userRole = result.user?.role || result.role
      console.log('🎯 Detected role:', userRole)
      
      // Redirect based on role
      if (userRole === 'admin') {
        console.log('➡️ Redirecting to admin dashboard')
        navigate('/admin', { replace: true })
      } else if (userRole === 'manager') {
        console.log('➡️ Redirecting to manager dashboard')
        navigate('/manager', { replace: true })
      } else if (userRole === 'seller') {
        console.log('➡️ Redirecting to seller dashboard')
        navigate('/seller', { replace: true })
      } else {
        console.log('➡️ Redirecting to home')
        navigate('/', { replace: true })
      }
      
    } catch (error) {
      console.error('❌ Login error:', error)
      const errorMessage = error?.message || 'Login failed. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex justify-center items-center py-10 px-5 bg-white">
      <div className="w-full max-w-[350px]">
        <div className="border border-gray-300 rounded-lg p-8 bg-white">
          <h1 className="text-3xl font-normal mb-5">Sign in</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block font-bold text-sm mb-1">
                Email or mobile phone number
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-orange-400 focus:shadow-[0_0_3px_2px_rgba(255,153,0,0.2)]"
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="password" className="block font-bold text-sm mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-orange-400 focus:shadow-[0_0_3px_2px_rgba(255,153,0,0.2)]"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-gradient-to-b from-yellow-200 to-yellow-400 border border-yellow-600 rounded text-base cursor-pointer hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <div className="flex items-center gap-2 my-4">
              <input
                type="checkbox"
                id="keepSignedIn"
                name="keepSignedIn"
                checked={formData.keepSignedIn}
                onChange={handleChange}
                className="w-auto"
              />
              <label htmlFor="keepSignedIn" className="font-normal m-0">
                Keep me signed in
              </label>
            </div>
            
            <div className="text-sm text-gray-600 mt-4 leading-6">
              By continuing, you agree to FastShop's{' '}
              <Link to="/conditions" className="text-blue-600 no-underline hover:underline">
                Conditions of Use
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 no-underline hover:underline">
                Privacy Notice
              </Link>.
            </div>
          </form>
          
          <div className="mt-5">
            <Link to="/forgot-password" className="text-blue-600 no-underline text-sm hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>
        
        <div className="relative text-center my-8">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>
          <span className="relative bg-white px-2.5 text-gray-600 text-sm">
            New to FastShop?
          </span>
        </div>
        
        <Link to="/register">
          <button className="w-full p-3 bg-white border border-gray-300 rounded text-base cursor-pointer hover:bg-gray-100">
            Create your FastShop account
          </button>
        </Link>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mt-5">
            Are you a seller?{' '}
            <Link to="/seller-register" className="text-blue-600 no-underline hover:underline">
              Register as a seller
            </Link>
          </p>
        </div>

        {/* Test Credentials */}
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
          <h3 className="font-bold mb-2">Test Credentials:</h3>
          <div className="space-y-1">
            <div>Customer: customer@test.com / Test123!@#</div>
            <div>Seller: seller@test.com / Test123!@#</div>
            <div>Manager: manager@fastshop.com / Manager123!@#</div>
            <div>Admin: admin@fastshop.com / Admin123!@#</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPageSimple