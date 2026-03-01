import { useState, useEffect } from 'react'
import { useAppSelector } from '../../hooks/redux'
import api from '../../config/api'
import { toast } from 'react-toastify'

const CustomerProfilePage = () => {
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'prefer_not_to_say',
    language: 'en_US',
    currency: 'USD'
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        birthday: user.birthday || '',
        gender: user.gender || 'prefer_not_to_say',
        language: user.language || 'en_US',
        currency: user.currency || 'USD'
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await api.put('/auth/profile', {
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender,
        language: formData.language,
        currency: formData.currency
      })
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
      <p className="text-gray-600 mb-8">Manage your personal information and account preferences</p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-center gap-8 mb-8 pb-8 border-b-2 border-gray-100">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amazon-orange to-yellow-600 flex items-center justify-center text-white text-5xl relative">
            👤
            <div className="absolute bottom-0 right-0 bg-white border-2 border-gray-300 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-amazon-orange hover:text-white transition-colors">
              📷
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{user?.name || 'User'}</h2>
            <p className="text-gray-600">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • {user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-100">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2 text-sm">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                />
                <p className="text-sm text-green-600 mt-1">✓ Verified</p>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-100">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2 text-sm">Date of Birth</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-100">Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2 text-sm">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                >
                  <option value="en_US">English (US)</option>
                  <option value="en_GB">English (UK)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2 text-sm">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-amazon-orange focus:ring-2 focus:ring-amazon-orange focus:ring-opacity-20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-amazon-orange text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="px-8 py-3 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-semibold mb-6">Security Settings</h3>
        <div className="bg-gray-50 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <div className="font-semibold">Password</div>
              <div className="text-sm text-gray-600">Last changed 30 days ago</div>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
              Change Password
            </button>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <div className="font-semibold">Two-Factor Authentication</div>
              <div className="text-sm text-green-600">✓ Enabled</div>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
              Manage
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">Login Activity</div>
              <div className="text-sm text-gray-600">Last login: Today at {new Date().toLocaleTimeString()}</div>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm">
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerProfilePage
