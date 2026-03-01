import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/redux'
import { login } from '../../store/slices/authSlice'
import { toast } from 'react-hot-toast'

const LoginPage = () => {
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
      console.log('Attempting login with:', formData.email);
      
      const result = await dispatch(login({ email: formData.email, password: formData.password })).unwrap()
      
      console.log('Login result:', result)
      console.log('User object:', result.user)
      console.log('User role:', result.user?.role)
      
      toast.success('Login successful!')
      
      // Redirect based on user role
      const userRole = result.user?.role || result.role
      console.log('Detected role:', userRole)
      
      // Additional debugging
      console.log('=== ROLE DETECTION DEBUG ===');
      console.log('result.user:', result.user);
      console.log('result.user?.role:', result.user?.role);
      console.log('result.role:', result.role);
      console.log('userRole:', userRole);
      console.log('userRole type:', typeof userRole);
      console.log('Is manager?:', userRole === 'manager');
      console.log('Is admin?:', userRole === 'admin');
      console.log('Is seller?:', userRole === 'seller');
      console.log('Is customer?:', userRole === 'customer');
      console.log('===========================');
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        if (userRole === 'seller') {
          console.log('Redirecting to seller dashboard')
          navigate('/seller', { replace: true })
        } else if (userRole === 'admin') {
          console.log('Redirecting to admin dashboard')
          navigate('/admin', { replace: true })
        } else if (userRole === 'manager') {
          console.log('Redirecting to manager dashboard')
          navigate('/manager', { replace: true })
        } else {
          console.log('Redirecting to home (role:', userRole, ')')
          navigate('/', { replace: true })
        }
      }, 100)
      
    } catch (error) {
      console.error('Login error:', error)
      console.error('Error type:', typeof error)
      console.error('Error message:', error.message || error)
      
      // Show user-friendly error message
      const errorMessage = error.message || error || 'Login failed. Please try again.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 px-5 bg-white min-h-screen">
      {/* FastShop Logo - Clickable to go to Home */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Link 
          to="/" 
          className="flex flex-col items-center text-center hover:opacity-80 transition-opacity duration-200"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-4xl">🛒</span>
            <h1 className="text-4xl font-bold text-blue-600" style={{ margin: 0 }}>FastShop</h1>
          </div>
          <p className="text-gray-600 text-sm" style={{ margin: 0 }}>Your trusted marketplace</p>
        </Link>
      </div>

      <div className="w-full max-w-[350px]">
        <div className="border border-gray-300 rounded-lg p-8 bg-white">
          <h2 className="text-3xl font-normal mb-5">Sign in</h2>
          
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
                className="w-full p-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-amazon-orange focus:shadow-[0_0_3px_2px_rgba(255,153,0,0.2)]"
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
                className="w-full p-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-amazon-orange focus:shadow-[0_0_3px_2px_rgba(255,153,0,0.2)]"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-gradient-to-b from-[#F7DFA5] to-[#F0C14B] border border-[#A88734] rounded text-base cursor-pointer hover:from-[#F5D78E] hover:to-[#EDB932] disabled:opacity-50"
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
      </div>
    </div>
  )
}

export default LoginPage
