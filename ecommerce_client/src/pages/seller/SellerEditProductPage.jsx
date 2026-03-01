import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sellerAPI } from '../../services/api.service'
import { toast } from 'react-toastify'

const SellerEditProductPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    description: '',
    sku: '',
    price: '',
    salePrice: '',
    stock: '',
    lowStockAlert: 5,
    weight: '',
    shippingClass: 'standard',
    status: 'active'
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const product = await sellerAPI.getProduct(id)
      setFormData({
        name: product.name || '',
        category: product.category || '',
        brand: product.brand || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || '',
        salePrice: product.salePrice || '',
        stock: product.stock || product.quantity || '',
        lowStockAlert: product.lowStockAlert || 5,
        weight: product.weight || '',
        shippingClass: product.shippingClass || 'standard',
        status: product.status || 'active'
      })
      setImages(product.images || [])
    } catch (error) {
      console.error('Error fetching product:', error)
      const errorMessage = error.message || 'Failed to load product'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      await sellerAPI.updateProduct(id, { ...formData, images })
      toast.success('Product updated successfully!')
      navigate('/seller/products')
    } catch (error) {
      console.error('Error updating product:', error)
      const errorMessage = error.message || 'Failed to update product'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      setError(null)
      await sellerAPI.deleteProduct(id)
      toast.success('Product deleted successfully')
      navigate('/seller/products')
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete product'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '80px 20px'}}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={{fontSize: '1.2em', color: '#565959'}}>Loading product...</div>
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div style={{textAlign: 'center', padding: '80px 20px'}}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
        <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
        <button onClick={fetchProduct} style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="seller-edit-product">
      <style>{`
        h1 { font-size: 2.2em; margin-bottom: 10px; }
        .subtitle { color: #565959; margin-bottom: 30px; font-size: 1.05em; }
        .alert { padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; display: flex; align-items: center; gap: 12px; }
        .alert-warning { background: #FFF4E5; border-left: 4px solid #F08804; color: #7A5A00; }
        .section { background: white; padding: 30px; border-radius: 12px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
        .section-title { font-size: 1.4em; font-weight: 600; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.95em; }
        .required { color: #C7511F; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 10px 12px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 0.95em; font-family: inherit; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #FF9900; box-shadow: 0 0 0 3px rgba(255,153,0,0.1); }
        .form-textarea { min-height: 120px; resize: vertical; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 0.9em; font-weight: bold; }
        .status-active { background: #E6F4F1; color: #067D62; }
        .status-pending { background: #FFF4E5; color: #F08804; }
        .image-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; }
        .image-preview { position: relative; aspect-ratio: 1; border: 1px solid #D5D9D9; border-radius: 8px; overflow: hidden; }
        .image-remove { position: absolute; top: 5px; right: 5px; background: #C7511F; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; }
        .form-actions { display: flex; justify-content: space-between; gap: 15px; margin-top: 30px; padding-top: 30px; border-top: 2px solid #F7F8F8; }
        .btn { padding: 12px 30px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1em; transition: all 0.2s; }
        .btn-primary { background: #FF9900; color: white; }
        .btn-primary:hover { background: #F08804; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(255,153,0,0.3); }
        .btn-secondary { background: white; color: #0F1111; border: 1px solid #D5D9D9; }
        .btn-secondary:hover { background: #F7F8F8; }
        .btn-danger { background: #C7511F; color: white; }
        .btn-danger:hover { background: #A33F1A; }
      `}</style>

      <h1>Edit Product</h1>
      <p className="subtitle">Update product information - {formData.sku}</p>

      {error && (
        <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
        </div>
      )}

      <div className="alert alert-warning">
        <span style={{fontSize: '1.5em'}}>⚠️</span>
        <div><strong>Pending Approval:</strong> Changes will be reviewed by admin before going live</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 className="section-title" style={{margin: 0, padding: 0, border: 'none'}}>Product Status</h2>
            <span className={`status-badge status-${formData.status}`}>{formData.status}</span>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Product Name <span className="required">*</span></label>
              <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input type="text" name="sku" className="form-input" value={formData.sku} readOnly style={{background: '#F7F8F8'}} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description <span className="required">*</span></label>
            <textarea name="description" className="form-textarea" value={formData.description} onChange={handleChange} required></textarea>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Garden</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input type="text" name="brand" className="form-input" value={formData.brand} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Product Images</h2>
          <div className="image-preview-grid">
            {images.map((img, idx) => (
              <div key={idx} className="image-preview">
                <img src={img} alt={`Product ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                <button type="button" className="image-remove" onClick={() => setImages(images.filter((_, i) => i !== idx))}>×</button>
              </div>
            ))}
            <div className="image-preview" style={{border: '2px dashed #D5D9D9', background: '#F7F8F8', cursor: 'pointer'}}>
              <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#565959'}}>
                <div style={{fontSize: '2em'}}>+</div>
                <div style={{fontSize: '0.8em'}}>Add Image</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Pricing & Stock</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Regular Price <span className="required">*</span></label>
              <input type="number" name="price" className="form-input" value={formData.price} onChange={handleChange} step="0.01" required />
            </div>
            <div className="form-group">
              <label className="form-label">Sale Price</label>
              <input type="number" name="salePrice" className="form-input" value={formData.salePrice} onChange={handleChange} step="0.01" />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Stock Quantity <span className="required">*</span></label>
              <input type="number" name="stock" className="form-input" value={formData.stock} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Alert</label>
              <input type="number" name="lowStockAlert" className="form-input" value={formData.lowStockAlert} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Shipping Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" name="weight" className="form-input" value={formData.weight} onChange={handleChange} step="0.01" />
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
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Product</button>
          <div style={{display: 'flex', gap: '15px'}}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/seller/products')}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Product</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SellerEditProductPage
