import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../services/api.service'
import { toast } from 'react-toastify'

const SellerRegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    businessName: '',
    registrationNumber: '',
    taxId: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Format data to match backend expectations
      const registrationData = {
        email: formData.email,
        password: formData.password,
        displayName: formData.businessName,
        businessName: formData.businessName,
        phone: formData.phone,
        businessInfo: {
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
          taxId: formData.taxId,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        }
      }

      // Use registerSeller method for seller registration
      await authAPI.registerSeller(registrationData)
      toast.success('Registration successful! Your account is pending approval. Please login to continue.')
      navigate('/login')
    } catch (error) {
      console.error('Error registering:', error)
      const errorMessage = error.message || 'Registration failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="seller-register">
      <style>{`
        .top-header { background: #131921; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.8em; font-weight: bold; color: white; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .nav-links { display: flex; gap: 20px; }
        .nav-links a { color: white; text-decoration: none; padding: 8px 12px; border-radius: 4px; }
        .nav-links a:hover { background: rgba(255,255,255,0.1); }
        .container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .registration-card { background: white; padding: 40px; border-radius: 8px; border: 1px solid #D5D9D9; }
        h1 { font-size: 2em; margin-bottom: 10px; text-align: center; }
        .subtitle { color: #565959; margin-bottom: 30px; text-align: center; }
        .progress-bar { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .progress-step { flex: 1; text-align: center; position: relative; }
        .progress-step::before { content: ''; position: absolute; top: 15px; left: 50%; right: -50%; height: 2px; background: #D5D9D9; z-index: -1; }
        .progress-step:last-child::before { display: none; }
        .progress-step.active .step-number { background: #FF9900; color: white; }
        .progress-step.completed .step-number { background: #067D62; color: white; }
        .step-number { width: 30px; height: 30px; border-radius: 50%; background: #F7F8F8; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 8px; }
        .step-label { font-size: 0.85em; color: #565959; }
        .section-title { font-size: 1.3em; font-weight: 600; margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 2px solid #F7F8F8; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 0.95em; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .btn-primary { background: #FF9900; color: white; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1em; width: 100%; }
        .btn-primary:hover { background: #F08804; }
        .help-text { font-size: 0.85em; color: #565959; margin-top: 5px; }
      `}</style>

      <div className="top-header">
        <Link to="/" className="logo">🛒 <span>FastShop</span></Link>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Customer Sign Up</Link>
        </div>
      </div>

      <div className="container">
        <div className="registration-card">
          <h1>Become a FastShop Seller</h1>
          <p className="subtitle">Join thousands of successful sellers on our platform</p>

          {error && (
            <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
              <strong>Error:</strong> {error}
              <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
            </div>
          )}

          <div className="progress-bar">
            <div className="progress-step active">
              <div className="step-number">1</div>
              <div className="step-label">Account Info</div>
            </div>
            <div className="progress-step">
              <div className="step-number">2</div>
              <div className="step-label">Business Info</div>
            </div>
            <div className="progress-step">
              <div className="step-number">3</div>
              <div className="step-label">Bank Details</div>
            </div>
            <div className="progress-step">
              <div className="step-number">4</div>
              <div className="step-label">Verification</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Account Information</h2>
            
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} required />
              <div className="help-text">This will be your login email</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input type="password" name="password" placeholder="Minimum 8 characters" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input type="password" name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <h2 className="section-title">Business Information</h2>

            <div className="form-group">
              <label>Business Type *</label>
              <select name="businessType" value={formData.businessType} onChange={handleChange} required>
                <option value="">Select business type</option>
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="partnership">Partnership</option>
                <option value="corporation">Corporation</option>
                <option value="llc">LLC</option>
              </select>
            </div>

            <div className="form-group">
              <label>Business Name *</label>
              <input type="text" name="businessName" placeholder="Your business name" value={formData.businessName} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Business Registration Number</label>
                <input type="text" name="registrationNumber" placeholder="If applicable" value={formData.registrationNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Tax ID / EIN *</label>
                <input type="text" name="taxId" placeholder="XX-XXXXXXX" value={formData.taxId} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Business Address *</label>
              <input type="text" name="street" placeholder="Street address" value={formData.street} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ZIP Code *</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <select name="country" value={formData.country} onChange={handleChange} required>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" name="phone" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal'}}>
                <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} required style={{width: 'auto'}} />
                I agree to the <a href="#">Seller Agreement</a>, <a href="#">Privacy Policy</a>, and <a href="#">Commission Structure</a>
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Continue to Next Step'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SellerRegisterPage
