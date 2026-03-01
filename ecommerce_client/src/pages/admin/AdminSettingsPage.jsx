import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const AdminSettingsPage = () => {
    const [settings, setSettings] = useState({
        siteName: 'FastShop',
        siteEmail: 'admin@fastshop.com',
        currency: 'USD',
        taxRate: 8.5,
        shippingFee: 5.99,
        commissionRate: 15,
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true
    });

    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminAPI.getSettings();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            const errorMessage = error.message || 'Failed to load settings';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            setError(null);
            await adminAPI.updateSettings(settings);
            setSaved(true);
            toast.success('Settings saved successfully!');
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            const errorMessage = error.message || 'Failed to save settings';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="admin-settings-page">
            <style>{`
                h1 { font-size: 2em; margin-bottom: 10px; }
                .subtitle { color: #565959; margin-bottom: 30px; }
                
                .section { background: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
                .section-title { font-size: 1.4em; font-weight: 600; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #F7F8F8; }
                
                .form-group { margin-bottom: 20px; }
                .form-label { display: block; font-weight: 600; margin-bottom: 8px; color: #0F1111; }
                .form-input { width: 100%; padding: 10px 12px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 1em; }
                .form-input:focus { outline: none; border-color: #FF9900; }
                .form-description { font-size: 0.85em; color: #565959; margin-top: 5px; }
                
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                
                .toggle-switch { position: relative; display: inline-block; width: 50px; height: 24px; }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
                .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .toggle-slider { background-color: #067D62; }
                input:checked + .toggle-slider:before { transform: translateX(26px); }
                
                .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1em; }
                .btn-primary:hover { background: #F08804; }
                .btn-secondary { background: #FFFFFF; color: #0F1111; border: 1px solid #D5D9D9; padding: 12px 30px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 10px; }
                
                .save-message { background: #E6F4F1; color: #067D62; padding: 12px 20px; border-radius: 4px; margin-bottom: 20px; }
                
                @media (max-width: 768px) {
                    .form-row { grid-template-columns: 1fr; }
                }
            `}</style>

            <h1>System Settings</h1>
            <p className="subtitle">Configure platform-wide settings and preferences</p>

            {error && (
                <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
                </div>
            )}

            {saved && (
                <div className="save-message">
                    ✓ Settings saved successfully!
                </div>
            )}

            <div className="section">
                <h2 className="section-title">General Settings</h2>
                
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Site Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={settings.siteName}
                            onChange={(e) => handleChange('siteName', e.target.value)}
                        />
                        <div className="form-description">The name of your e-commerce platform</div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Site Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={settings.siteEmail}
                            onChange={(e) => handleChange('siteEmail', e.target.value)}
                        />
                        <div className="form-description">Primary contact email address</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">Financial Settings</h2>
                
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Default Currency</label>
                        <select
                            className="form-input"
                            value={settings.currency}
                            onChange={(e) => handleChange('currency', e.target.value)}
                        >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Tax Rate (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={settings.taxRate}
                            onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                        />
                        <div className="form-description">Default tax rate for orders</div>
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Default Shipping Fee ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={settings.shippingFee}
                            onChange={(e) => handleChange('shippingFee', parseFloat(e.target.value))}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Commission Rate (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={settings.commissionRate}
                            onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                        />
                        <div className="form-description">Platform commission on seller sales</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">System Settings</h2>
                
                <div className="form-group">
                    <label className="form-label">Maintenance Mode</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode}
                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>{settings.maintenanceMode ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="form-description">When enabled, only admins can access the site</div>
                </div>
                
                <div className="form-group">
                    <label className="form-label">Allow User Registration</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.allowRegistration}
                                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>{settings.allowRegistration ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
                
                <div className="form-group">
                    <label className="form-label">Require Email Verification</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.requireEmailVerification}
                                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span>{settings.requireEmailVerification ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button className="btn-secondary">Cancel</button>
                <button className="btn-primary" onClick={handleSave}>Save Settings</button>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
