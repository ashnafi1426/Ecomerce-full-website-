import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const AdminBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getBrands();
      setBrands(data || mockBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      const errorMessage = error.message || 'Failed to load brands';
      setError(errorMessage);
      toast.error(errorMessage);
      setBrands(mockBrands);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        setError(null);
        await adminAPI.deleteBrand(brandId);
        toast.success('Brand deleted successfully');
        fetchBrands();
      } catch (error) {
        const errorMessage = error.message || 'Failed to delete brand';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={{fontSize: '1.2em', color: '#565959'}}>Loading brands...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '2.2em', marginBottom: '10px' }}>Brand Management</h1>
      <p style={{ color: '#565959', marginBottom: '30px' }}>
        Manage product brands and manufacturers
      </p>

      {error && (
        <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
        </div>
      )}

      <div style={{
        background: '#FFFFFF',
        padding: '25px',
        borderRadius: '12px',
        border: '1px solid #D5D9D9'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #F7F8F8'
        }}>
          <h2>All Brands</h2>
          <button
            onClick={() => toast.success('Add Brand feature coming soon')}
            style={{
              background: '#FF9900',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Add Brand
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {brands.map((brand) => (
            <div key={brand.id} style={{
              background: '#FFFFFF',
              border: '2px solid #D5D9D9',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#FF9900';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#D5D9D9';
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3em'
              }}>
                {brand.icon}
              </div>
              <div style={{ fontSize: '1.3em', fontWeight: '600', marginBottom: '10px' }}>
                {brand.name}
              </div>
              <div style={{ fontSize: '0.9em', color: '#565959', marginBottom: '15px' }}>
                {brand.productCount} Products
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => toast.success(`Edit ${brand.name}`)}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid #D5D9D9',
                    background: '#FFFFFF',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85em'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(brand.id)}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid #D5D9D9',
                    background: '#FFFFFF',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85em'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const mockBrands = [
  { id: 1, name: 'Apple', icon: '🍎', productCount: 847 },
  { id: 2, name: 'Samsung', icon: '📱', productCount: 623 },
  { id: 3, name: 'Dell', icon: '💻', productCount: 412 },
  { id: 4, name: 'Nike', icon: '👟', productCount: 1245 },
  { id: 5, name: 'Adidas', icon: '👕', productCount: 987 },
  { id: 6, name: 'Sony', icon: '🎮', productCount: 534 },
  { id: 7, name: 'LG', icon: '📺', productCount: 389 },
  { id: 8, name: 'HP', icon: '🖨️', productCount: 456 }
];

export default AdminBrandsPage;
