import { useState, useEffect } from 'react';

const UserModal = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        phone: '',
        role: 'customer',
        status: 'active'
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                password: '', // Never pre-fill password
                displayName: user.display_name || '',
                phone: user.phone || '',
                role: user.role || 'customer',
                status: user.status || 'active'
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation (only for new users)
        if (!user && !formData.password) {
            newErrors.password = 'Password is required for new users';
        } else if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        // Display name validation
        if (!formData.displayName) {
            newErrors.displayName = 'Display name is required';
        }

        // Phone validation (optional but format check if provided)
        if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
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
                }
                
                .modal-subtitle {
                    color: #565959;
                    margin: 0 0 16px 0;
                }
                
                .modal-body {
                    padding: 0 24px 24px 24px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-label {
                    display: block;
                    font-weight: 600;
                    color: #0F1111;
                    margin-bottom: 6px;
                    font-size: 0.9em;
                }
                
                .form-label.required::after {
                    content: ' *';
                    color: #C7511F;
                }
                
                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #D5D9D9;
                    border-radius: 6px;
                    font-size: 1em;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #FF9900;
                    box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
                }
                
                .form-input.error {
                    border-color: #C7511F;
                }
                
                .form-select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #D5D9D9;
                    border-radius: 6px;
                    font-size: 1em;
                    background: #FFFFFF;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                    box-sizing: border-box;
                }
                
                .form-select:focus {
                    outline: none;
                    border-color: #FF9900;
                }
                
                .password-container {
                    position: relative;
                }
                
                .password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #565959;
                    font-size: 1.1em;
                    padding: 4px;
                }
                
                .error-message {
                    color: #C7511F;
                    font-size: 0.85em;
                    margin-top: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
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
                
                .role-description {
                    font-size: 0.8em;
                    color: #565959;
                    margin-top: 4px;
                    padding: 8px 12px;
                    background: #F7F8F8;
                    border-radius: 4px;
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
                    
                    .form-row {
                        grid-template-columns: 1fr;
                        gap: 12px;
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
                        {user ? 'Edit User' : 'Add New User'}
                    </h2>
                    <p className="modal-subtitle">
                        {user ? 'Update user information and settings' : 'Create a new user account'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label required">Email Address</label>
                            <input
                                type="email"
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="user@example.com"
                                disabled={loading}
                            />
                            {errors.email && (
                                <div className="error-message">
                                    ⚠️ {errors.email}
                                </div>
                            )}
                        </div>

                        {!user && (
                            <div className="form-group">
                                <label className="form-label required">Password</label>
                                <div className="password-container">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input ${errors.password ? 'error' : ''}`}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Enter a secure password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="error-message">
                                        ⚠️ {errors.password}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label required">Display Name</label>
                            <input
                                type="text"
                                className={`form-input ${errors.displayName ? 'error' : ''}`}
                                value={formData.displayName}
                                onChange={(e) => handleInputChange('displayName', e.target.value)}
                                placeholder="Full name or display name"
                                disabled={loading}
                            />
                            {errors.displayName && (
                                <div className="error-message">
                                    ⚠️ {errors.displayName}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className={`form-input ${errors.phone ? 'error' : ''}`}
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                                disabled={loading}
                            />
                            {errors.phone && (
                                <div className="error-message">
                                    ⚠️ {errors.phone}
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label required">Role</label>
                                <select
                                    className="form-select"
                                    value={formData.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="customer">Customer</option>
                                    <option value="seller">Seller</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <div className="role-description">
                                    {formData.role === 'customer' && '🛍️ Can browse and purchase products'}
                                    {formData.role === 'seller' && '🏪 Can sell products on the platform'}
                                    {formData.role === 'manager' && '👔 Can manage products and sellers'}
                                    {formData.role === 'admin' && '⚡ Full system access and control'}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Status</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="pending">Pending</option>
                                </select>
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
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading && <div className="loading-spinner"></div>}
                            {user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;