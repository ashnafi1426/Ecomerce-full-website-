import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerProfilePage = () => {
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: 'LLC',
    taxId: '',
    registrationNumber: ''
  });

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
    alternativeEmail: ''
  });

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getProfile();
      
      setBusinessInfo({
        businessName: response.businessName || '',
        businessType: response.businessType || 'LLC',
        taxId: response.taxId || '',
        registrationNumber: response.registrationNumber || ''
      });
      
      setContactInfo({
        email: response.email || '',
        phone: response.phone || '',
        alternativeEmail: response.alternativeEmail || ''
      });
      
      setAddress({
        street: response.address?.street || '',
        city: response.address?.city || '',
        state: response.address?.state || '',
        zipCode: response.address?.zipCode || '',
        country: response.address?.country || 'United States'
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBusinessInfo = async () => {
    try {
      await sellerAPI.updateProfile({ businessInfo });
      toast.success('Business information updated successfully');
    } catch (err) {
      toast.error('Failed to update business information');
    }
  };

  const handleUpdateContactInfo = async () => {
    try {
      await sellerAPI.updateProfile({ contactInfo });
      toast.success('Contact information updated successfully');
    } catch (err) {
      toast.error('Failed to update contact information');
    }
  };

  const handleUpdateAddress = async () => {
    try {
      await sellerAPI.updateProfile({ address });
      toast.success('Address updated successfully');
    } catch (err) {
      toast.error('Failed to update address');
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
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load profile</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchProfile} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Business Profile</h1>
      <p style={styles.subtitle}>Manage your business information and credentials</p>

      {/* Profile Header */}
      <div style={styles.section}>
        <div style={styles.profileHeader}>
          <div style={styles.profileLogo}>🏪</div>
          <div>
            <h2>{businessInfo.businessName || 'Business Name'}</h2>
            <p style={{ color: '#565959' }}>Member since January 2025</p>
            <p style={{ color: '#565959' }}>Seller ID: SELL-12345</p>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Business Information</h2>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Name</label>
            <input
              type="text"
              value={businessInfo.businessName}
              onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Type</label>
            <select
              value={businessInfo.businessType}
              onChange={(e) => setBusinessInfo({ ...businessInfo, businessType: e.target.value })}
              style={styles.input}
            >
              <option>Individual / Sole Proprietor</option>
              <option>LLC</option>
              <option>Corporation</option>
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tax ID / EIN</label>
            <input
              type="text"
              value={businessInfo.taxId}
              disabled
              style={{ ...styles.input, background: '#F7F8F8' }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Registration Number</label>
            <input
              type="text"
              value={businessInfo.registrationNumber}
              disabled
              style={{ ...styles.input, background: '#F7F8F8' }}
            />
          </div>
        </div>

        <button onClick={handleUpdateBusinessInfo} style={styles.primaryButton}>
          Update Business Info
        </button>
      </div>

      {/* Contact Information */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Contact Information</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={contactInfo.email}
            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Alternative Email</label>
            <input
              type="email"
              value={contactInfo.alternativeEmail}
              onChange={(e) => setContactInfo({ ...contactInfo, alternativeEmail: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        <button onClick={handleUpdateContactInfo} style={styles.primaryButton}>
          Update Contact Info
        </button>
      </div>

      {/* Business Address */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Business Address</h2>
        <div style={styles.formGroup}>
          <label style={styles.label}>Street Address</label>
          <input
            type="text"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>City</label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>State</label>
            <input
              type="text"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>ZIP Code</label>
            <input
              type="text"
              value={address.zipCode}
              onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Country</label>
            <select
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              style={styles.input}
            >
              <option>United States</option>
              <option>Canada</option>
              <option>United Kingdom</option>
            </select>
          </div>
        </div>

        <button onClick={handleUpdateAddress} style={styles.primaryButton}>
          Update Address
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
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px'
  },
  profileLogo: {
    width: '100px',
    height: '100px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3em'
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
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
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

export default SellerProfilePage;
