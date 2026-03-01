import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerSettingsPage = () => {
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    storeDescription: '',
    categories: []
  });

  const [shippingSettings, setShippingSettings] = useState({
    processingTime: '2-3 business days',
    originAddress: ''
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    customerMessages: true,
    productReviews: false,
    lowStockAlerts: true
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getSettings();
      
      setStoreInfo({
        storeName: response.storeName || '',
        storeDescription: response.storeDescription || '',
        categories: response.categories || []
      });
      
      setShippingSettings({
        processingTime: response.shippingSettings?.processingTime || '2-3 business days',
        originAddress: response.shippingSettings?.originAddress || ''
      });
      
      setNotifications({
        newOrders: response.notifications?.newOrders ?? true,
        customerMessages: response.notifications?.customerMessages ?? true,
        productReviews: response.notifications?.productReviews ?? false,
        lowStockAlerts: response.notifications?.lowStockAlerts ?? true
      });
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStoreInfo = async () => {
    try {
      await sellerAPI.updateSettings({ storeInfo });
      toast.success('Store information saved successfully');
    } catch (err) {
      toast.error('Failed to save store information');
    }
  };

  const handleSaveShippingSettings = async () => {
    try {
      await sellerAPI.updateSettings({ shippingSettings });
      toast.success('Shipping settings saved successfully');
    } catch (err) {
      toast.error('Failed to save shipping settings');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await sellerAPI.updateSettings({ notifications });
      toast.success('Notification preferences saved successfully');
    } catch (err) {
      toast.error('Failed to save notification preferences');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load settings</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchSettings} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Store Settings</h1>
      <p style={styles.subtitle}>Configure your store preferences and settings</p>

      {/* Store Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Store Information</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>Store Name</label>
          <input
            type="text"
            value={storeInfo.storeName}
            onChange={(e) => setStoreInfo({ ...storeInfo, storeName: e.target.value })}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Store Description</label>
          <textarea
            value={storeInfo.storeDescription}
            onChange={(e) => setStoreInfo({ ...storeInfo, storeDescription: e.target.value })}
            style={styles.textarea}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Store Categories</label>
          <select
            multiple
            value={storeInfo.categories}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setStoreInfo({ ...storeInfo, categories: selected });
            }}
            style={{ ...styles.input, height: '100px' }}
          >
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
            <option value="Wearables">Wearables</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports & Outdoors">Sports & Outdoors</option>
          </select>
        </div>
        <button onClick={handleSaveStoreInfo} style={styles.primaryButton}>
          Save Changes
        </button>
      </div>

      {/* Shipping Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Shipping Settings</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>Default Processing Time</label>
          <select
            value={shippingSettings.processingTime}
            onChange={(e) => setShippingSettings({ ...shippingSettings, processingTime: e.target.value })}
            style={styles.input}
          >
            <option>1-2 business days</option>
            <option>2-3 business days</option>
            <option>3-5 business days</option>
            <option>5-7 business days</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Shipping Origin Address</label>
          <input
            type="text"
            value={shippingSettings.originAddress}
            onChange={(e) => setShippingSettings({ ...shippingSettings, originAddress: e.target.value })}
            style={styles.input}
          />
        </div>
        <button onClick={handleSaveShippingSettings} style={styles.primaryButton}>
          Save Changes
        </button>
      </div>

      {/* Notification Preferences */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Notification Preferences</h2>
        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={notifications.newOrders}
              onChange={(e) => setNotifications({ ...notifications, newOrders: e.target.checked })}
              style={styles.checkbox}
            />
            Email notifications for new orders
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={notifications.customerMessages}
              onChange={(e) => setNotifications({ ...notifications, customerMessages: e.target.checked })}
              style={styles.checkbox}
            />
            Email notifications for customer messages
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={notifications.productReviews}
              onChange={(e) => setNotifications({ ...notifications, productReviews: e.target.checked })}
              style={styles.checkbox}
            />
            Email notifications for product reviews
          </label>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={notifications.lowStockAlerts}
              onChange={(e) => setNotifications({ ...notifications, lowStockAlerts: e.target.checked })}
              style={styles.checkbox}
            />
            Email notifications for low stock alerts
          </label>
        </div>
        <button onClick={handleSaveNotifications} style={styles.primaryButton}>
          Save Preferences
        </button>
      </div>
    </div>
  );
};

const styles = {
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px',
    textAlign: 'center'
  },
  container: {
    padding: '30px'
  },
  title: {
    fontSize: '2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#0F1111'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#0F1111'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.95em'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.95em',
    minHeight: '100px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#0F1111'
  },
  checkbox: {
    marginRight: '10px',
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default SellerSettingsPage;
