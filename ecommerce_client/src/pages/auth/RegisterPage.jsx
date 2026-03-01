import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../hooks/redux'
import { register } from '../../store/slices/authSlice'
import { toast } from 'react-toastify'

const RegisterPage = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState([])

  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    return errors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validate password in real-time
    if (name === 'password') {
      setPasswordErrors(validatePassword(value))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate password strength
    const passwordValidationErrors = validatePassword(formData.password)
    if (passwordValidationErrors.length > 0) {
      toast.error(`Password must have: ${passwordValidationErrors.join(', ')}`)
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      await dispatch(register({
        displayName: formData.name, // Send as displayName to match backend expectation
        email: formData.email,
        password: formData.password
      })).unwrap()
      toast.success('Registration successful!')
      navigate('/')
    } catch (error) {
      toast.error(error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-10 px-5 bg-white min-h-screen">
      {/* Logo */}
      <div className="mb-8">
        <Link to="/">
          <h1 className="text-5xl font-bold text-blue-600 cursor-pointer hover:text-blue-700">FastShop</h1>
        </Link>
      </div>

      <div className="w-full max-w-[350px]">
        <div className="border border-gray-300 rounded-lg p-8 bg-white">
          <h2 className="text-3xl font-normal mb-5">Create account</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="name" className="block font-bold text-sm mb-1">
                Your name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-amazon-orange focus:shadow-[0_0_3px_2px_rgba(255,153,0,0.2)]"
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="email" className="block font-bold text-sm mb-1">
                Email
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
                minLength="8"
                className="w-full p-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-amazon-orange focus:shadow-[0_0_3px_2px_rgba(255,153,0,0.2)]"
              />
              <div className="text-xs text-gray-600 mt-1">
                <p className="mb-1">Password requirements:</p>
                <ul className="list-none space-y-1">
                  <li className={passwordErrors.includes('At least 8 characters') ? 'text-red-600' : 'text-green-600'}>
                    {passwordErrors.includes('At least 8 characters') ? '✗' : '✓'} At least 8 characters
                  </li>
                  <li className={passwordErrors.includes('One uppercase letter') ? 'text-red-600' : 'text-green-600'}>
                    {passwordErrors.includes('One uppercase letter') ? '✗' : '✓'} One uppercase letter
                  </li>
                  <li className={passwordErrors.includes('One lowercase letter') ? 'text-red-600' : 'text-green-600'}>
                    {passwordErrors.includes('One lowercase letter') ? '✗' : '✓'} One lowercase letter
                  </li>
                  <li className={passwordErrors.includes('One number') ? 'text-red-600' : 'text-green-600'}>
                    {passwordErrors.includes('One number') ? '✗' : '✓'} One number
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mb-5">
              <label htmlFor="confirmPassword" className="block font-bold text-sm mb-1">
                Re-enter password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {loading ? 'Creating account...' : 'Create your FastShop account'}
            </button>
            
            <div className="text-sm text-gray-600 mt-4 leading-6">
              By creating an account, you agree to FastShop's{' '}
              <Link to="/conditions" className="text-blue-600 no-underline hover:underline">
                Conditions of Use
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 no-underline hover:underline">
                Privacy Notice
              </Link>.
            </div>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 no-underline hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Want to sell on FastShop?</p>
            <Link
              to="/seller-register"
              className="inline-block w-full p-3 bg-white border border-gray-300 rounded text-base text-center no-underline text-gray-800 hover:bg-gray-50"
            >
              Register as a Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
