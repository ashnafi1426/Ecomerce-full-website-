import { useState } from 'react';

const ExportModal = ({ onExport, onClose, filters }) => {
    const [exportFormat, setExportFormat] = useState('csv');
    const [exportOptions, setExportOptions] = useState({
        includePersonalInfo: true,
        includeContactInfo: true,
        includeAccountInfo: true,
        includeActivityInfo: false
    });
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            await onExport(exportFormat);
        } finally {
            setLoading(false);
        }
    };

    const getFilterSummary = () => {
        const summary = [];
        if (filters.search) summary.push(`Search: "${filters.search}"`);
        if (filters.role !== 'all') summary.push(`Role: ${filters.role}`);
        if (filters.status !== 'all') summary.push(`Status: ${filters.status}`);
        return summary.length > 0 ? summary.join(', ') : 'All users';
    };

    return (
        <div className="modal-overlay">
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                
                .modal-content {
                    background: #FFFFFF;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    padding: 24px 24px 0 24px;
                    border-bottom: 1px solid #D5D9D9;
                    margin-bottom: 24px;
                }
                
                .modal-title {
                    font-size: 1.5em;
                    font-weight: 600;
                    color: #0F1111;
                    margin: 0 0 8px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .modal-subtitle {
                    color: #565959;
                    margin: 0 0 16px 0;
                    line-height: 1.5;
                }
                
                .modal-body {
                    padding: 0 24px 24px 24px;
                }
                
                .section {
                    margin-bottom: 24px;
                }
                
                .section-title {
                    font-size: 1.1em;
                    font-weight: 600;
                    color: #0F1111;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .format-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .format-option {
                    padding: 16px;
                    border: 2px solid #D5D9D9;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                    background: #FFFFFF;
                }
                
                .format-option:hover {
                    border-color: #FF9900;
                    background: #FFF4E5;
                }
                
                .format-option.selected {
                    border-color: #FF9900;
                    background: #FF9900;
                    color: #FFFFFF;
                }
                
                .format-icon {
                    font-size: 2em;
                    margin-bottom: 8px;
                }
                
                .format-name {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .format-description {
                    font-size: 0.8em;
                    opacity: 0.8;
                }
                
                .export-info {
                    background: #F7F8F8;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .info-row:last-child {
                    margin-bottom: 0;
                }
                
                .info-label {
                    font-weight: 500;
                    color: #565959;
                }
                
                .info-value {
                    font-weight: 600;
                    color: #0F1111;
                }
                
                .checkbox-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border: 1px solid #D5D9D9;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                
                .checkbox-item:hover {
                    background: #F7F8F8;
                }
                
                .checkbox-item input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .checkbox-content {
                    flex: 1;
                }
                
                .checkbox-title {
                    font-weight: 500;
                    color: #0F1111;
                    margin-bottom: 2px;
                }
                
                .checkbox-description {
                    font-size: 0.85em;
                    color: #565959;
                }
                
                .modal-footer {
                    padding: 0 24px 24px 24px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    border-top: 1px solid #D5D9D9;
                    padding-top: 20px;
                }
                
                .btn {
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    font-size: 0.9em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-primary {
                    background: #FF9900;
                    color: #FFFFFF;
                }
                
                .btn-primary:hover:not(:disabled) {
                    background: #E88B00;
                    transform: translateY(-1px);
                }
                
                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .btn-secondary {
                    background: #FFFFFF;
                    color: #0F1111;
                    border: 2px solid #D5D9D9;
                }
                
                .btn-secondary:hover {
                    background: #F7F8F8;
                    border-color: #B7B7B7;
                }
                
                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .warning-box {
                    background: #FFF4E5;
                    border: 1px solid #F08804;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }
                
                .warning-icon {
                    color: #F08804;
                    font-size: 1.2em;
                    margin-top: 2px;
                }
                
                .warning-content {
                    flex: 1;
                }
                
                .warning-title {
                    font-weight: 600;
                    color: #F08804;
                    margin-bottom: 4px;
                }
                
                .warning-text {
                    font-size: 0.9em;
                    color: #B8860B;
                    line-height: 1.4;
                }
                
                @media (max-width: 768px) {
                    .modal-overlay {
                        padding: 10px;
                    }
                    
                    .modal-content {
                        max-height: 95vh;
                    }
                    
                    .modal-header,
                    .modal-body,
                    .modal-footer {
                        padding-left: 16px;
                        padding-right: 16px;
                    }
                    
                    .format-options {
                        grid-template-columns: 1fr;
                    }
                    
                    .modal-footer {
                        flex-direction: column-reverse;
                    }
                    
                    .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">
                        📊 Export Users
                    </h2>
                    <p className="modal-subtitle">
                        Export user data in your preferred format. The export will include users matching your current filters.
                    </p>
                </div>

                <div className="modal-body">
                    <div className="section">
                        <h3 className="section-title">
                            📄 Export Format
                        </h3>
                        <div className="format-options">
                            <div 
                                className={`format-option ${exportFormat === 'csv' ? 'selected' : ''}`}
                                onClick={() => setExportFormat('csv')}
                            >
                                <div className="format-icon">📊</div>
                                <div className="format-name">CSV</div>
                                <div className="format-description">
                                    Spreadsheet compatible
                                </div>
                            </div>
                            <div 
                                className={`format-option ${exportFormat === 'json' ? 'selected' : ''}`}
                                onClick={() => setExportFormat('json')}
                            >
                                <div className="format-icon">🔧</div>
                                <div className="format-name">JSON</div>
                                <div className="format-description">
                                    Developer friendly
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">
                            ℹ️ Export Information
                        </h3>
                        <div className="export-info">
                            <div className="info-row">
                                <span className="info-label">Export Scope:</span>
                                <span className="info-value">{getFilterSummary()}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Format:</span>
                                <span className="info-value">{exportFormat.toUpperCase()}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">File Name:</span>
                                <span className="info-value">
                                    users-export-{new Date().toISOString().split('T')[0]}.{exportFormat}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">
                            🔧 Data Options
                        </h3>
                        <div className="checkbox-group">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includePersonalInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includePersonalInfo: e.target.checked
                                    }))}
                                />
                                <div className="checkbox-content">
                                    <div className="checkbox-title">Personal Information</div>
                                    <div className="checkbox-description">
                                        Name, email, and basic profile data
                                    </div>
                                </div>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeContactInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeContactInfo: e.target.checked
                                    }))}
                                />
                                <div className="checkbox-content">
                                    <div className="checkbox-title">Contact Information</div>
                                    <div className="checkbox-description">
                                        Phone numbers and addresses
                                    </div>
                                </div>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeAccountInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeAccountInfo: e.target.checked
                                    }))}
                                />
                                <div className="checkbox-content">
                                    <div className="checkbox-title">Account Information</div>
                                    <div className="checkbox-description">
                                        Role, status, join date, and last login
                                    </div>
                                </div>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeActivityInfo}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeActivityInfo: e.target.checked
                                    }))}
                                />
                                <div className="checkbox-content">
                                    <div className="checkbox-title">Activity Information</div>
                                    <div className="checkbox-description">
                                        Login history and usage statistics
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="warning-box">
                        <div className="warning-icon">⚠️</div>
                        <div className="warning-content">
                            <div className="warning-title">Privacy Notice</div>
                            <div className="warning-text">
                                Exported data may contain sensitive personal information. 
                                Please ensure you comply with your organization's data protection policies 
                                and applicable privacy laws when handling this data.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        {loading && <div className="loading-spinner"></div>}
                        {loading ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;