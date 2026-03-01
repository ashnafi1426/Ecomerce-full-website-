import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerBulkUploadPage = () => {
  const [uploadHistory, setUploadHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: This endpoint would need to be added to the API
      // For now, we'll use a placeholder
      setUploadHistory([]);
    } catch (err) {
      setError(err.message || 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    toast.success('Downloading CSV template...');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      toast.loading(`Uploading ${file.name}...`);
      
      await sellerAPI.bulkUpload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      });
      
      toast.dismiss();
      toast.success('File uploaded successfully! Processing...');
      fetchUploadHistory();
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to upload file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bulk Product Upload</h1>
      <p style={styles.subtitle}>Upload multiple products at once using CSV file</p>

      {/* How It Works */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <ol style={styles.stepList}>
          <li style={styles.stepItem}>
            <span style={styles.stepNumber}>1</span>
            <span>Download the CSV template file</span>
          </li>
          <li style={styles.stepItem}>
            <span style={styles.stepNumber}>2</span>
            <span>Fill in your product information</span>
          </li>
          <li style={styles.stepItem}>
            <span style={styles.stepNumber}>3</span>
            <span>Upload the completed CSV file</span>
          </li>
          <li style={styles.stepItem}>
            <span style={styles.stepNumber}>4</span>
            <span>Review and confirm the import</span>
          </li>
        </ol>
        <div style={{ marginTop: '25px' }}>
          <button onClick={handleDownloadTemplate} style={styles.secondaryButton}>
            📥 Download CSV Template
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Upload CSV File</h2>
        <div
          style={{
            ...styles.uploadArea,
            ...(dragActive ? styles.uploadAreaActive : {})
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div style={styles.uploadIcon}>📤</div>
          <h3 style={{ marginBottom: '15px' }}>Drag and drop your CSV file here</h3>
          <p style={{ color: '#565959', marginBottom: '20px' }}>or</p>
          <label htmlFor="file-upload">
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              style={styles.primaryButton}
            >
              Browse Files
            </button>
          </label>
          <p style={{ color: '#565959', fontSize: '0.9em', marginTop: '20px' }}>
            Maximum file size: 10MB
          </p>
        </div>
      </div>

      {/* CSV Format Requirements */}
      <div style={styles.infoBox}>
        <h3 style={{ marginBottom: '15px' }}>📋 CSV Format Requirements</h3>
        <ul style={styles.requirementsList}>
          <li>File must be in CSV format (.csv)</li>
          <li>First row must contain column headers</li>
          <li>Required columns: Product Name, SKU, Price, Stock Quantity, Category</li>
          <li>Optional columns: Description, Brand, Weight, Images</li>
          <li>Use semicolon (;) to separate multiple images</li>
          <li>Maximum 1000 products per upload</li>
        </ul>
      </div>

      {/* Recent Uploads */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Uploads</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>File Name</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Products</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploadHistory.length > 0 ? (
                uploadHistory.map((upload, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{upload.fileName}</td>
                    <td style={styles.td}>{upload.date}</td>
                    <td style={styles.td}>{upload.products}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(upload.status === 'Completed' ? styles.badgeCompleted : styles.badgeProcessing)
                      }}>
                        {upload.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No upload history available
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
    padding: '30px',
    maxWidth: '1000px'
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
  section: {
    background: '#FFFFFF',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#0F1111'
  },
  stepList: {
    listStyle: 'none',
    counterReset: 'step-counter',
    padding: 0
  },
  stepItem: {
    counterIncrement: 'step-counter',
    marginBottom: '15px',
    paddingLeft: '40px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  stepNumber: {
    position: 'absolute',
    left: 0,
    background: '#FF9900',
    color: '#FFFFFF',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.9em'
  },
  secondaryButton: {
    background: '#FFFFFF',
    color: '#0F1111',
    border: '1px solid #D5D9D9',
    padding: '12px 30px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  uploadArea: {
    border: '3px dashed #D5D9D9',
    borderRadius: '12px',
    padding: '60px 40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  uploadAreaActive: {
    borderColor: '#FF9900',
    background: '#FFF9F0'
  },
  uploadIcon: {
    fontSize: '4em',
    marginBottom: '20px'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  infoBox: {
    background: '#E7F3FF',
    borderLeft: '4px solid #146EB4',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0'
  },
  requirementsList: {
    marginLeft: '20px',
    lineHeight: 1.8
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
    padding: '12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #D5D9D9',
    color: '#0F1111'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #D5D9D9',
    color: '#0F1111'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  badgeCompleted: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeProcessing: {
    background: '#FFF4E5',
    color: '#F08804'
  }
};

export default SellerBulkUploadPage;
