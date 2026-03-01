import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service.minimal';

const SellerInventoryPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getInventory();
      console.log('📦 Inventory API response:', response);
      
      // Extract products array from response
      const responseData = response?.data || response || {};
      const products = responseData.products || [];
      
      console.log('📦 Extracted products:', products);
      
      // Map products to inventory format
      const inventoryData = products.map(product => ({
        id: product.id,
        name: product.title || product.name,
        sku: product.sku || 'N/A',
        price: product.price || 0,
        currentStock: product.inventory?.available_quantity || product.inventory?.quantity || 0,
        reservedStock: product.inventory?.reserved_quantity || 0,
        totalStock: product.inventory?.quantity || 0,
        lowStockThreshold: product.inventory?.low_stock_threshold || 10,
        category: product.category || 'Uncategorized',
        status: product.status || 'active',
        image: product.image_url || product.image,
        lastUpdated: product.inventory?.updated_at || product.updated_at
      }));
      
      console.log('📦 Mapped inventory data:', inventoryData);
      
      setInventory(inventoryData);
      
      // Calculate stats
      setStats({
        totalProducts: inventoryData.length,
        inStock: inventoryData.filter(item => item.currentStock > 10).length,
        lowStock: inventoryData.filter(item => item.currentStock > 0 && item.currentStock <= 10).length,
        outOfStock: inventoryData.filter(item => item.currentStock === 0).length
      });
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to load inventory');
      toast.error(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      await sellerAPI.updateStock(productId, newStock);
      setInventory(inventory.map(item => 
        item.id === productId ? { ...item, currentStock: newStock } : item
      ));
      toast.success('Stock updated successfully');
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const handleBulkUpdate = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to update');
      return;
    }
    toast.success(`Bulk update for ${selectedItems.length} items`);
  };

  const handleExportCSV = () => {
    toast.success('Exporting inventory to CSV...');
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return 'out';
    if (stock <= 10) return 'low';
    return 'good';
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'instock' && item.currentStock > 10) ||
                         (statusFilter === 'lowstock' && item.currentStock > 0 && item.currentStock <= 10) ||
                         (statusFilter === 'outofstock' && item.currentStock === 0);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load inventory</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchInventory} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Inventory Management</h1>
      <p style={styles.subtitle}>Track and manage your product stock levels</p>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue}>{stats.totalProducts}</div>
          <div style={styles.statLabel}>Total Products</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statValue}>{stats.inStock}</div>
          <div style={styles.statLabel}>In Stock</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚠️</div>
          <div style={styles.statValue}>{stats.lowStock}</div>
          <div style={styles.statLabel}>Low Stock</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>
          <div style={styles.statValue}>{stats.outOfStock}</div>
          <div style={styles.statLabel}>Out of Stock</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <div style={styles.alert}>
          <span style={{ fontSize: '1.5em' }}>⚠️</span>
          <div>
            <strong>Low Stock Alert:</strong> {stats.lowStock} products are running low on inventory
          </div>
        </div>
      )}

      {/* Inventory Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Stock Levels</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportCSV} style={styles.secondaryButton}>
              Export CSV
            </button>
            <button onClick={handleBulkUpdate} style={styles.primaryButton}>
              Bulk Update
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.filterInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="instock">In Stock</option>
            <option value="lowstock">Low Stock</option>
            <option value="outofstock">Out of Stock</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home & Garden">Home & Garden</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredInventory.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Current Stock</th>
                <th style={styles.th}>Reserved</th>
                <th style={styles.th}>Available</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id || item._id}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id || item._id)}
                        onChange={(e) => {
                          const itemId = item.id || item._id;
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, itemId]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== itemId));
                          }
                        }}
                      />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.productThumb}>{item.icon || '📦'}</div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{item.sku}</td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        value={item.currentStock || item.stock || 0}
                        onChange={(e) => handleStockUpdate(item.id || item._id, parseInt(e.target.value) || 0)}
                        style={styles.stockInput}
                      />
                    </td>
                    <td style={styles.td}>{item.reserved || 0}</td>
                    <td style={styles.td}>{(item.currentStock || item.stock || 0) - (item.reserved || 0)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stockBadge,
                        ...(getStockStatus(item.currentStock || item.stock || 0) === 'good' ? styles.stockGood :
                            getStockStatus(item.currentStock || item.stock || 0) === 'low' ? styles.stockLow :
                            styles.stockOut)
                      }}>
                        {getStockStatus(item.currentStock || item.stock || 0) === 'good' ? 'In Stock' :
                         getStockStatus(item.currentStock || item.stock || 0) === 'low' ? 'Low Stock' :
                         'Out of Stock'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <button onClick={() => toast.success('Stock updated')} style={styles.btnSm}>
                          Update
                        </button>
                        <button onClick={() => toast.info('Stock history')} style={styles.btnSm}>
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px'
  },
  spinner: {
    fontSize: '1.2em',
    color: '#565959'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: '40px'
  },
  retryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
  },
  title: {
    fontSize: '2.2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px',
    fontSize: '1.05em'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9'
  },
  statIcon: {
    fontSize: '2em',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '2em',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#0F1111'
  },
  statLabel: {
    fontSize: '0.9em',
    color: '#565959'
  },
  alert: {
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#FFE5E5',
    borderLeft: '4px solid #C7511F',
    color: '#8B0000'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #F7F8F8'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    color: '#0F1111'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  secondaryButton: {
    background: '#FFFFFF',
    color: '#0F1111',
    border: '1px solid #D5D9D9',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  filterBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    flex: 1,
    minWidth: '200px'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    background: '#F7F8F8',
    padding: '14px 12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #D5D9D9',
    fontSize: '0.9em',
    color: '#0F1111'
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #D5D9D9',
    color: '#0F1111'
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  productThumb: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5em'
  },
  stockInput: {
    width: '80px',
    padding: '6px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    textAlign: 'center'
  },
  stockBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  stockGood: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  stockLow: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  stockOut: {
    background: '#FFE5E5',
    color: '#C7511F'
  },
  actionBtns: {
    display: 'flex',
    gap: '8px'
  },
  btnSm: {
    padding: '6px 14px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em'
  }
};

export default SellerInventoryPage;
