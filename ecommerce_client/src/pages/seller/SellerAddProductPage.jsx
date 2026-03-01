import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sellerAPI } from '../../services/api.service.minimal'
import { toast } from 'react-hot-toast'
import { PLACEHOLDERS } from '../../utils/imagePlaceholder'

const SellerAddProductPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    description: '',
    sku: '',
    barcode: '',
    price: '',
    salePrice: '',
    stock: '',
    lowStockAlert: 5,
    weight: '',
    shippingClass: 'standard',
    length: '',
    width: '',
    height: ''
  })
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      // Map frontend field names to backend expected names
      const productData = {
        title: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageUrl: imageUrl || PLACEHOLDERS.product,
        categoryId: null, // Categories not implemented yet, always null
        initialQuantity: parseInt(formData.stock) || 0,
        lowStockThreshold: parseInt(formData.lowStockAlert) || 5
      }
      
      await sellerAPI.createProduct(productData)
      toast.success('Product submitted for approval!')
      navigate('/seller/products')
    } catch (error) {
      console.error('Error creating product:', error)
      const errorMessage = error.message || 'Failed to create product'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setError(null)
      
      // Map frontend field names to backend expected names
      const productData = {
        title: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        imageUrl: imageUrl || 'https://placehold.co/400x400/667eea/ffffff?text=Draft',
        categoryId: null, // Categories not implemented yet, always null
        initialQuantity: parseInt(formData.stock) || 0,
        lowStockThreshold: parseInt(formData.lowStockAlert) || 5,
        status: 'draft'
      }
      
      await sellerAPI.createProduct(productData)
      toast.success('Product saved as draft')
      navigate('/seller/products')
    } catch (error) {
      const errorMessage = error.message || 'Failed to save draft'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <div className="seller-add-product">
      <style>{`
        h1 { font-size: 2.2em; margin-bottom: 10px; }
        .subtitle { color: #565959; margin-bottom: 30px; font-size: 1.05em; }
        .progress-steps { display: flex; justify-content: space-between; margin-bottom: 40px; position: relative; }
        .progress-steps::before { content: ''; position: absolute; top: 20px; left: 0; right: 0; height: 2px; background: #D5D9D9; z-index: 0; }
        .step { display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 1; }
        .step-circle { width: 40px; height: 40px; border-radius: 50%; background: white; border: 2px solid #D5D9D9; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .step.active .step-circle { background: #FF9900; color: white; border-color: #FF9900; }
        .step-label { font-size: 0.85em; color: #565959; }
        .step.active .step-label { color: #FF9900; font-weight: 600; }
        .section { background: white; padding: 30px; border-radius: 12px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
        .section-title { font-size: 1.4em; font-weight: 600; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.95em; }
        .required { color: #C7511F; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 0.95em; font-family: inherit; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #FF9900; box-shadow: 0 0 0 3px rgba(255,153,0,0.1); }
        .form-textarea { min-height: 120px; resize: vertical; }
        .form-hint { font-size: 0.85em; color: #565959; margin-top: 5px; }
        .image-upload-area { border: 2px dashed #D5D9D9; border-radius: 8px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .image-upload-area:hover { border-color: #FF9900; background: #FFF9F0; }
        .image-upload-icon { font-size: 3em; margin-bottom: 15px; }
        .form-actions { display: flex; justify-content: space-between; gap: 15px; margin-top: 30px; padding-top: 30px; border-top: 2px solid #F7F8F8; }
        .btn { padding: 12px 30px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1em; transition: all 0.2s; }
        .btn-primary { background: #FF9900; color: white; }
        .btn-primary:hover { background: #F08804; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(255,153,0,0.3); }
        .btn-secondary { background: white; color: #0F1111; border: 1px solid #D5D9D9; }
        .btn-secondary:hover { background: #F7F8F8; }
      `}</style>

      <h1>Add New Product</h1>
      <p className="subtitle">Create a new product listing for your store</p>

      {error && (
        <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
        </div>
      )}

      <div className="progress-steps">
        <div className="step active">
          <div className="step-circle">1</div>
          <div className="step-label">Basic Info</div>
        </div>
        <div className="step">
          <div className="step-circle">2</div>
          <div className="step-label">Images</div>
        </div>
        <div className="step">
          <div className="step-circle">3</div>
          <div className="step-label">Pricing</div>
        </div>
        <div className="step">
          <div className="step-circle">4</div>
          <div className="step-label">Inventory</div>
        </div>
        <div className="step">
          <div className="step-circle">5</div>
          <div className="step-label">Review</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section">
          <h2 className="section-title">Basic Information</h2>
          <div className="form-group">
            <label className="form-label">Product Name <span className="required">*</span></label>
            <input type="text" name="name" className="form-input" placeholder="Enter product name" value={formData.name} onChange={handleChange} required />
            <div className="form-hint">Use a clear, descriptive name that customers will search for</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                <option value="">Select category (optional)</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="books">Books</option>
              </select>
              <div className="form-hint">Category is optional for now</div>
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input type="text" name="brand" className="form-input" placeholder="Enter brand name" value={formData.brand} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Product Description <span className="required">*</span></label>
            <textarea name="description" className="form-textarea" placeholder="Describe your product in detail..." value={formData.description} onChange={handleChange} required></textarea>
            <div className="form-hint">Include key features, specifications, and benefits</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input type="text" name="sku" className="form-input" placeholder="e.g., SKU-12345 (optional)" value={formData.sku} onChange={handleChange} />
              <div className="form-hint">Leave blank to auto-generate</div>
            </div>
            <div className="form-group">
              <label className="form-label">Barcode/UPC</label>
              <input type="text" name="barcode" className="form-input" placeholder="Enter barcode" value={formData.barcode} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Product Images</h2>
          <div className="form-group">
            <label className="form-label">Product Image URL</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="https://example.com/image.jpg" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
            />
            <div className="form-hint">Enter a direct URL to your product image (or leave blank for placeholder)</div>
          </div>
          {imageUrl && (
            <div style={{marginTop: '20px', textAlign: 'center'}}>
              <img 
                src={imageUrl} 
                alt="Product preview" 
                style={{maxWidth: '300px', maxHeight: '300px', border: '1px solid #D5D9D9', borderRadius: '8px'}}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x400/667eea/ffffff?text=Invalid+URL'
                }}
              />
              <p style={{color: '#565959', fontSize: '0.85em', marginTop: '10px'}}>Image Preview</p>
            </div>
          )}
        </div>

        <div className="section">
          <h2 className="section-title">Pricing & Inventory</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Regular Price <span className="required">*</span></label>
              <input type="number" name="price" className="form-input" placeholder="0.00" step="0.01" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Price</label>
              <input type="number" name="salePrice" className="form-input" placeholder="0.00" step="0.01" value={formData.salePrice} onChange={handleChange} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Stock Quantity <span className="required">*</span></label>
              <input type="number" name="stock" className="form-input" placeholder="0" value={formData.stock} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Alert</label>
              <input type="number" name="lowStockAlert" className="form-input" placeholder="5" value={formData.lowStockAlert} onChange={handleChange} />
              <div className="form-hint">Get notified when stock falls below this number</div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Shipping Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" name="weight" className="form-input" placeholder="0.00" step="0.01" value={formData.weight} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Class</label>
              <select name="shippingClass" className="form-select" value={formData.shippingClass} onChange={handleChange}>
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="heavy">Heavy/Bulky</option>
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Length (cm)</label>
              <input type="number" name="length" className="form-input" placeholder="0" value={formData.length} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Width (cm)</label>
              <input type="number" name="width" className="form-input" placeholder="0" value={formData.width} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input type="number" name="height" className="form-input" placeholder="0" value={formData.height} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>Save as Draft</button>
          <div style={{display: 'flex', gap: '15px'}}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/seller/products')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SellerAddProductPage
