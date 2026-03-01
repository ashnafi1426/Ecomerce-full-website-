import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 seconds
  validateStatus: function (status) {
    // Accept all status codes to handle them in interceptor
    return status >= 200 && status < 600;
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response received:', {
      status: response.status,
      url: response.config?.url,
      hasData: !!response.data
    });
    
    // Simply return the response data
    return response.data;
  },
  (error) => {
    console.error('🚨 API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    });
    
    // Handle network errors (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('❌ Request timeout');
        toast.error('Request timeout. Please check your connection.');
        return Promise.reject(new Error('Request timeout. Please check your connection.'));
      } else if (error.code === 'ERR_NETWORK') {
        console.error('❌ Network error - Cannot reach server');
        toast.error('Cannot connect to server. Please check if the backend is running.');
        return Promise.reject(new Error('No response from server. Please check your connection.'));
      } else {
        console.error('❌ Network error - No response from server');
        toast.error('Network error. Please check your internet connection.');
        return Promise.reject(new Error('No response from server. Please check your connection.'));
      }
    }
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 502) {
      toast.error('Bad Gateway. The server is temporarily unavailable.');
    } else if (error.response?.status === 503) {
      toast.error('Service Unavailable. Please try again later.');
    } else if (error.response?.status === 504) {
      toast.error('Gateway Timeout. The server took too long to respond.');
    }
    
    // Create a simple error message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An error occurred';
    
    console.error('🔥 Rejecting with error message:', errorMessage);
    
    // Return a rejected promise with just the error message
    return Promise.reject(new Error(errorMessage));
  }
);

// API service object
const api = {
  // GET request
  get: async (url, params = {}) => {
    return await apiClient.get(url, { params });
  },
  
  // POST request
  post: async (url, data = {}) => {
    return await apiClient.post(url, data);
  },
  
  // PUT request
  put: async (url, data = {}) => {
    return await apiClient.put(url, data);
  },
  
  // PATCH request
  patch: async (url, data = {}) => {
    return await apiClient.patch(url, data);
  },
  
  // DELETE request
  delete: async (url) => {
    return await apiClient.delete(url);
  },
  
  // Upload file (multipart/form-data)
  upload: async (url, formData, onUploadProgress = null) => {
    return await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  
  // Download file
  download: async (url, filename) => {
    const response = await apiClient.get(url, {
      responseType: 'blob'
    });
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response;
  }
};

// Admin API endpoints
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // Analytics - Using analytics controller endpoints
  getDashboardAnalytics: () => api.get('/admin/analytics/dashboard'),
  getSalesOverview: (params) => api.get('/admin/analytics/sales/overview', params),
  getSalesByDate: (params) => api.get('/admin/analytics/sales/by-date', params),
  getTopSellingProducts: (params) => api.get('/admin/analytics/sales/top-products', params),
  getRevenueOverview: (params) => api.get('/admin/analytics/revenue/overview', params),
  getRevenueByCategory: (params) => api.get('/admin/analytics/revenue/by-category', params),
  getRevenueTrends: (params) => api.get('/admin/analytics/revenue/trends', params),
  getCustomerStatistics: (params) => api.get('/admin/analytics/customers/statistics', params),
  getCustomerSegmentation: (params) => api.get('/admin/analytics/customers/segmentation', params),
  getCustomerRetention: (params) => api.get('/admin/analytics/customers/retention', params),
  getInventoryOverview: (params) => api.get('/admin/analytics/inventory/overview', params),
  getLowStockProducts: (params) => api.get('/admin/analytics/inventory/low-stock', params),
  getInventoryTurnover: (params) => api.get('/admin/analytics/inventory/turnover', params),
  
  // Legacy analytics endpoints (for backward compatibility)
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', params),
  getOrderAnalytics: (params) => api.get('/admin/analytics/orders', params),
  
  // Products
  getProducts: async (params) => {
    console.log('🔍 adminAPI.getProducts called with params:', params);
    try {
      const result = await api.get('/admin/products', params);
      console.log('✅ adminAPI.getProducts success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.getProducts error:', error);
      throw error;
    }
  },
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getPendingApprovals: () => api.get('/admin/products/approvals'),
  approveProduct: (id) => api.put(`/admin/products/${id}/approve`),
  rejectProduct: (id, reason) => api.put(`/admin/products/${id}/reject`, { reason }),
  
  // Categories & Brands
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getBrands: () => api.get('/admin/brands'),
  createBrand: (data) => api.post('/admin/brands', data),
  
  // Orders
  getOrders: (params) => api.get('/admin/orders', params),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  
  // Users
  getUsers: async (params) => {
    console.log('🔍 adminAPI.getUsers called with params:', params);
    try {
      const result = await api.get('/admin/users', params);
      console.log('✅ adminAPI.getUsers success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.getUsers error:', error);
      throw error;
    }
  },
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  bulkUpdateUsers: (data) => api.put('/admin/users/bulk', data),
  exportUsers: (params) => api.get('/admin/users/export', params),
  exportCustomersPDF: async (params) => {
    console.log('🔍 adminAPI.exportCustomersPDF called with params:', params);
    try {
      const response = await apiClient.get('/admin/customers/export-pdf', {
        params,
        responseType: 'blob' // Important for PDF download
      });
      console.log('✅ adminAPI.exportCustomersPDF success');
      return response;
    } catch (error) {
      console.error('❌ adminAPI.exportCustomersPDF error:', error);
      throw error;
    }
  },
  
  // Sellers - Using seller controller endpoints
  getSellers: (params) => api.get('/sellers', params),
  getSeller: (id) => api.get(`/sellers/${id}`),
  createSeller: (data) => api.post('/sellers', data),
  updateSeller: (id, data) => api.put(`/sellers/${id}`, data),
  deleteSeller: (id) => api.delete(`/sellers/${id}`),
  updateSellerStatus: (id, data) => api.put(`/sellers/${id}/status`, data),
  verifySeller: (id, data) => api.post(`/sellers/${id}/verify`, data),
  
  // Managers - Using manager controller endpoints
  getManagers: (params) => api.get('/managers', params),
  getManager: (id) => api.get(`/managers/${id}`),
  createManager: (data) => api.post('/managers', data),
  updateManager: (id, data) => api.put(`/managers/${id}`, data),
  deleteManager: (id) => api.delete(`/managers/${id}`),
  updateManagerStatus: (id, data) => api.put(`/managers/${id}/status`, data),
  
  getCustomers: (params) => api.get('/admin/customers', params),
  
  // Financial
  getPayments: (params) => api.get('/admin/payments', params),
  getPayouts: (params) => api.get('/admin/payouts', params),
  processPayout: (data) => api.post('/admin/payouts', data),
  getRefunds: (params) => api.get('/refunds', params),
  approveRefund: (id) => api.post(`/refunds/${id}/process-full`),
  rejectRefund: (id, reason) => api.post(`/refunds/${id}/reject`, { reason }),
  processRefund: (id, data) => api.post(`/refunds/${id}/process-full`, data),
  processPartialRefund: (id, data) => api.post(`/refunds/${id}/process-partial`, data),
  issueGoodwillRefund: (data) => api.post('/refunds/goodwill', data),
  getRefundAnalytics: (params) => api.get('/refunds/analytics', params),
  
  // Stripe Admin Payment System
  getStripePayments: async (params) => {
    console.log('🔍 adminAPI.getStripePayments called with params:', params);
    try {
      const result = await api.get('/stripe/admin/payments', params);
      console.log('✅ adminAPI.getStripePayments success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.getStripePayments error:', error);
      throw error;
    }
  },
  getStripeStatistics: async () => {
    console.log('🔍 adminAPI.getStripeStatistics called');
    try {
      const result = await api.get('/stripe/admin/statistics');
      console.log('✅ adminAPI.getStripeStatistics success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.getStripeStatistics error:', error);
      throw error;
    }
  },
  getStripeSellers: async () => {
    console.log('🔍 adminAPI.getStripeSellers called');
    try {
      const result = await api.get('/stripe/admin/sellers');
      console.log('✅ adminAPI.getStripeSellers success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.getStripeSellers error:', error);
      throw error;
    }
  },
  processStripeRefund: async (paymentId, data) => {
    console.log('🔍 adminAPI.processStripeRefund called:', { paymentId, data });
    try {
      const result = await api.post(`/stripe/admin/refund/${paymentId}`, data);
      console.log('✅ adminAPI.processStripeRefund success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.processStripeRefund error:', error);
      throw error;
    }
  },
  processStripePayout: async (data) => {
    console.log('🔍 adminAPI.processStripePayout called:', data);
    try {
      const result = await api.post('/stripe/admin/payout', data);
      console.log('✅ adminAPI.processStripePayout success:', result);
      return result;
    } catch (error) {
      console.error('❌ adminAPI.processStripePayout error:', error);
      throw error;
    }
  },
  
  // System
  getRoles: () => api.get('/admin/roles'),
  createRole: (data) => api.post('/admin/roles', data),
  getCommissions: () => api.get('/admin/commissions'),
  updateCommissions: (data) => api.put('/admin/commissions', data),
  getTaxes: () => api.get('/admin/taxes'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getLogs: (params) => api.get('/admin/logs', params),
  generateReport: (type, params) => api.get(`/admin/reports/${type}`, params),
  
  // PDF Export
  exportAnalyticsReport: async (params) => {
    console.log('🔍 adminAPI.exportAnalyticsReport called with params:', params);
    try {
      const response = await apiClient.get('/admin/analytics/export', {
        params,
        responseType: 'blob' // Important for PDF download
      });
      console.log('✅ adminAPI.exportAnalyticsReport success');
      return response;
    } catch (error) {
      console.error('❌ adminAPI.exportAnalyticsReport error:', error);
      throw error;
    }
  },
  
  // Commission Settings
  getCommissionSettings: async () => {
    console.log('🔍 adminAPI.getCommissionSettings called');
    try {
      // Commission routes are mounted directly, not under /api
      const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const result = await axios.get(`${BASE_URL}/admin/commission-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ adminAPI.getCommissionSettings success:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ adminAPI.getCommissionSettings error:', error);
      throw error;
    }
  },
  updateCommissionSettings: async (data) => {
    console.log('🔍 adminAPI.updateCommissionSettings called:', data);
    try {
      // Commission routes are mounted directly, not under /api
      const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const result = await axios.put(`${BASE_URL}/admin/commission-settings`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ adminAPI.updateCommissionSettings success:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ adminAPI.updateCommissionSettings error:', error);
      throw error;
    }
  },
  getCommissionAnalytics: async (period = '30days') => {
    console.log('🔍 adminAPI.getCommissionAnalytics called');
    try {
      // Commission routes are mounted directly, not under /api
      const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const result = await axios.get(`${BASE_URL}/admin/commission-analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ adminAPI.getCommissionAnalytics success:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ adminAPI.getCommissionAnalytics error:', error);
      throw error;
    }
  }
};

// Authentication API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerSeller: (userData) => api.post('/auth/register/seller', userData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  refreshToken: () => api.post('/auth/refresh-token'),
  getCurrentUser: () => api.get('/auth/me')
};

// Manager API endpoints
export const managerAPI = {
  // Dashboard
  getDashboardStats: async () => {
    console.log('🎯 managerAPI.getDashboardStats called');
    try {
      const result = await api.get('/manager/dashboard');
      console.log('✅ Manager dashboard API success:', result);
      return result;
    } catch (error) {
      console.error('❌ Manager dashboard API error:', error);
      throw error;
    }
  },
  getOverview: () => api.get('/manager/overview'),
  
  // Product Approvals (Amazon-style workflow)
  getApprovalQueue: () => api.get('/manager/products/pending'),
  getApprovalStats: () => api.get('/manager/dashboard'),
  approveProduct: (id, data) => api.post(`/manager/products/${id}/approve`, data),
  rejectProduct: (id, data) => api.post(`/manager/products/${id}/reject`, data),
  requestChanges: (id, data) => api.post(`/manager/products/${id}/revision`, data),
  getApprovalHistory: (id) => api.get(`/manager/products/${id}/history`),
  
  // Legacy endpoints (keep for backward compatibility)
  getPendingProducts: (params) => api.get('/manager/products/pending', params),
  getProductDetails: (id) => api.get(`/manager/products/${id}`),
  
  // Seller Approvals
  getPendingSellers: (params) => api.get('/manager/sellers/pending', params),
  getSellerDetails: (id) => api.get(`/manager/sellers/${id}`),
  approveSeller: (id, data) => api.post(`/manager/sellers/${id}/approve`, data),
  rejectSeller: (id, data) => api.post(`/manager/sellers/${id}/reject`, data),
  
  // Orders
  getOrdersWithIssues: (params) => api.get('/manager/orders/issues', params),
  getOrderDetails: (id) => api.get(`/manager/orders/${id}`),
  resolveOrderIssue: (id, data) => api.post(`/manager/orders/${id}/resolve`, data),
  
  // Returns
  getPendingReturns: (params) => api.get('/manager/returns/pending', params),
  getReturnDetails: (id) => api.get(`/manager/returns/${id}`),
  approveReturn: (id, data) => api.post(`/manager/returns/${id}/approve`, data),
  rejectReturn: (id, data) => api.post(`/manager/returns/${id}/reject`, data),

  // Replacements (manager perspective - approve/reject/analytics)
  getReplacements: (params) => api.get('/replacements', params),
  getReplacement: (id) => api.get(`/replacements/${id}`),
  approveReplacement: (id) => api.put(`/replacements/${id}/approve`),
  rejectReplacement: (id, reason) => api.put(`/replacements/${id}/reject`, { reason }),
  getReplacementAnalytics: (params) => api.get('/replacements/analytics', params),

  // Disputes
  getDisputes: (params) => api.get('/manager/disputes', params),
  getDisputeDetails: (id) => api.get(`/manager/disputes/${id}`),
  resolveDispute: (id, data) => api.post(`/manager/disputes/${id}/resolve`, data),
  escalateDispute: (id, data) => api.post(`/manager/disputes/${id}/escalate`, data),
  
  // Refunds
  getPendingRefunds: (params) => api.get('/refunds', { ...params, status: 'pending' }),
  getRefundDetails: (id) => api.get(`/refunds/${id}`),
  getAllRefunds: (params) => api.get('/refunds', params),
  processRefund: (id, data) => api.post(`/refunds/${id}/process-full`, data),
  processPartialRefund: (id, data) => api.post(`/refunds/${id}/process-partial`, data),
  processFullRefund: (id) => api.post(`/refunds/${id}/process-full`),
  rejectRefund: (id, reason) => api.post(`/refunds/${id}/reject`, { reason }),
  issueGoodwillRefund: (data) => api.post('/refunds/goodwill', data),
  getRefundAnalytics: (params) => api.get('/refunds/analytics', params),
  
  // Support Tickets
  getSupportTickets: (params) => api.get('/manager/support/tickets', params),
  getTicketDetails: (id) => api.get(`/manager/support/tickets/${id}`),
  respondToTicket: (id, data) => api.post(`/manager/support/tickets/${id}/respond`, data),
  closeTicket: (id) => api.post(`/manager/support/tickets/${id}/close`),
  
  // Escalations
  getEscalations: (params) => api.get('/manager/escalations', params),
  getEscalationDetails: (id) => api.get(`/manager/escalations/${id}`),
  assignEscalation: (id, data) => api.post(`/manager/escalations/${id}/assign`, data),
  
  // Performance
  getPerformanceMetrics: () => api.get('/manager/performance'),
  getSellerPerformance: (params) => api.get('/manager/performance/sellers', params),
  getSellerPerformanceDetails: (id) => api.get(`/manager/performance/sellers/${id}`),
  
  // Review Moderation
  getFlaggedReviews: (params) => api.get('/manager/reviews/flagged', params),
  getReviewDetails: (id) => api.get(`/manager/reviews/${id}`),
  approveReview: (id) => api.post(`/manager/reviews/${id}/approve`),
  removeReview: (id, data) => api.post(`/manager/reviews/${id}/remove`, data),
  editReview: (id, data) => api.put(`/manager/reviews/${id}`, data),
  
  // Customer Feedback
  getCustomerFeedback: (params) => api.get('/manager/feedback/customers', params),
  getFeedbackDetails: (id) => api.get(`/manager/feedback/${id}`),
  respondToFeedback: (id, data) => api.post(`/manager/feedback/${id}/respond`, data)
};

// Seller API endpoints
export const sellerAPI = {
  // Dashboard
  getDashboardStats: async () => {
    console.log('🔍 sellerAPI.getDashboardStats called');
    try {
      const result = await api.get('/seller/dashboard');
      console.log('✅ sellerAPI.getDashboardStats success:', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getDashboardStats error:', error);
      throw error;
    }
  },
  getRevenueAnalytics: (params) => api.get('/seller/analytics/revenue', params),
  getSalesAnalytics: (params) => api.get('/seller/analytics/sales', params),
  getPerformanceMetrics: () => api.get('/seller/performance'),
  
  // Products
  getProducts: async (params) => {
    console.log('🔍 sellerAPI.getProducts called with params:', params);
    try {
      const result = await api.get('/seller/products', params);
      console.log('✅ sellerAPI.getProducts success:', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getProducts error:', error);
      throw error;
    }
  },
  getProduct: (id) => api.get(`/seller/products/${id}`),
  createProduct: (data) => api.post('/seller/products', data),
  updateProduct: (id, data) => api.put(`/seller/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/seller/products/${id}`),
  bulkUpload: (formData, onProgress) => api.upload('/seller/products/bulk-upload', formData, onProgress),
  getInventory: (params) => api.get('/seller/inventory', params),
  updateStock: (id, quantity) => api.put(`/seller/inventory/${id}`, { quantity }),
  
  // Orders (using sub-orders endpoint)
  getOrders: async (params) => {
    console.log('🔍 sellerAPI.getOrders called with params:', params);
    try {
      const result = await api.get('/seller/sub-orders', params);
      console.log('✅ sellerAPI.getOrders success:', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getOrders error:', error);
      throw error;
    }
  },
  getOrder: (id) => api.get(`/sub-orders/${id}`),
  markAsShipped: (id, data) => api.patch(`/seller/sub-orders/${id}/fulfillment`, { ...data, status: 'shipped' }),
  getShippingQueue: (params) => api.get('/seller/sub-orders', { ...params, fulfillment_status: 'pending' }),
  generateLabel: (orderId) => api.post('/seller/shipping/label', { orderId }),
  getReturns: (params) => api.get('/seller/returns', params),
  approveReturn: (id) => api.put(`/seller/returns/${id}/approve`),
  rejectReturn: (id, reason) => api.put(`/seller/returns/${id}/reject`, { reason }),

  // Replacements (seller perspective)
  getReplacements: (params) => api.get('/replacements', params),
  getReplacement: (id) => api.get(`/replacements/${id}`),
  updateReplacementShipment: (id, data) => api.put(`/replacements/${id}/shipment`, data),
  confirmReturnReceived: (id) => api.put(`/replacements/${id}/confirm-return`),
  
  // Financial
  getPayouts: (params) => api.get('/seller/payouts', params),
  getBalance: () => api.get('/seller/payouts/balance'),
  requestWithdrawal: (amount) => api.post('/seller/payouts/request', { amount }),
  getCommissions: () => api.get('/seller/commissions'),
  getInvoices: (params) => api.get('/seller/invoices', params),
  downloadInvoice: (id) => api.download(`/seller/invoices/${id}/download`, `invoice-${id}.pdf`),
  
  // Customer Service
  getMessages: (params) => api.get('/seller/messages', params),
  replyToMessage: (id, message) => api.post(`/seller/messages/${id}/reply`, { message }),
  getReviews: (params) => api.get('/seller/reviews', params),
  replyToReview: (id, reply) => api.post(`/seller/reviews/${id}/reply`, { reply }),
  getDisputes: (params) => api.get('/seller/disputes', params),
  respondToDispute: (id, response) => api.post(`/seller/disputes/${id}/respond`, response),
  
  // Account
  getProfile: () => api.get('/seller/profile'),
  updateProfile: (data) => api.put('/seller/profile', data),
  getSettings: () => api.get('/seller/settings'),
  updateSettings: (data) => api.put('/seller/settings', data)
};

// Customer API endpoints
export const customerAPI = {
  // Products & Browse
  getProducts: (params) => api.get('/products', params),
  getProduct: (id) => api.get(`/products/${id}`),
  searchProducts: (params) => api.get('/products/search', params),
  getCategories: () => api.get('/categories'),
  getCategoryProducts: (id, params) => api.get(`/categories/${id}/products`, params),
  
  // Cart
  getCart: () => api.get('/cart'),
  getCartSummary: () => api.get('/cart/summary'),
  getCartCount: () => api.get('/cart/count'),
  addToCart: (data) => api.post('/cart/items', data),
  updateCartItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
  removeFromCart: (productId) => api.delete(`/cart/items/${productId}`),
  clearCart: () => api.delete('/cart'),
  validateCart: () => api.post('/cart/validate'),
  
  // Orders
  createOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', params),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
  getOrderRefunds: (id) => api.get(`/orders/${id}/refunds`),
  getOrderWithRefunds: (id) => api.get(`/orders/${id}/with-refunds`),
  checkRefundEligibility: (id) => api.get(`/orders/${id}/refund-eligibility`),
  
  // Profile & Account
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  getStatistics: () => api.get('/users/me/statistics'),
  deleteAccount: () => api.delete('/users/me'),
  
  // Addresses
  getAddresses: () => api.get('/addresses'),
  getDefaultAddress: () => api.get('/addresses/default'),
  getAddressCount: () => api.get('/addresses/count'),
  getAddress: (id) => api.get(`/addresses/${id}`),
  createAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  setDefaultAddress: (id) => api.patch(`/addresses/${id}/default`),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  
  // Reviews
  getMyReviews: () => api.get('/reviews/my-reviews'),
  getProductReviews: (productId, params) => api.get(`/products/${productId}/reviews`, params),
  getProductRatingStats: (productId) => api.get(`/products/${productId}/rating-stats`),
  createReview: (data) => api.post('/reviews', data),
  getReview: (id) => api.get(`/reviews/${id}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  
  // Returns
  getReturns: () => api.get('/returns/user/me'),
  getReturn: (id) => api.get(`/returns/${id}`),
  getReturnsByOrder: (orderId) => api.get(`/returns/order/${orderId}`),
  createReturn: (data) => api.post('/returns', data),

  // Replacements
  getReplacements: (params) => api.get('/replacements', params),
  getReplacement: (id) => api.get(`/replacements/${id}`),
  createReplacement: (data) => api.post('/replacements', data),
  updateReturnTracking: (id, tracking_number) =>
    api.put(`/replacements/${id}/return-tracking`, { return_tracking_number: tracking_number }),
  cancelReplacement: (id) => api.put(`/replacements/${id}/cancel`),

  // Refunds
  getRefunds: (params) => api.get('/refunds', params),
  getRefund: (id) => api.get(`/refunds/${id}`),
  createRefund: (data) => api.post('/refunds', data),
  
  // Wishlist
  getWishlist: () => api.get('/wishlist'),
  getWishlistCount: () => api.get('/wishlist/count'),
  addToWishlist: (productId) => api.post('/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  clearWishlist: () => api.delete('/wishlist/clear'),
  checkWishlistStatus: (productId) => api.get(`/wishlist/check/${productId}`),
  
  // Notifications (placeholder - needs backend implementation)
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/read-all')
};
// ==========================================
// GUEST API - Amazon-Style Guest Checkout
// ==========================================
export const guestAPI = {
  // Guest Cart Management (NO AUTH REQUIRED)
  createGuestCart: () => api.post('/guest/cart/create'),
  getGuestCart: (sessionId) => api.get(`/guest/cart/${sessionId}`),
  addToGuestCart: (sessionId, productId, quantity) => 
    api.post(`/guest/cart/${sessionId}/add`, { productId, quantity }),
  updateGuestCartItem: (sessionId, productId, quantity) => 
    api.patch(`/guest/cart/${sessionId}/update`, { productId, quantity }),
  removeFromGuestCart: (sessionId, productId) => 
    api.delete(`/guest/cart/${sessionId}/remove/${productId}`),
  clearGuestCart: (sessionId) => 
    api.delete(`/guest/cart/${sessionId}/clear`),

  // Guest Checkout Flow
  validateGuestEmail: (email) => 
    api.post('/guest/checkout/validate-email', { email }),
  createGuestUser: (email, fullName, phone) => 
    api.post('/guest/checkout/create-guest-user', { email, fullName, phone }),
  saveGuestAddress: (addressData) => 
    api.post('/guest/checkout/save-address', addressData),
  placeGuestOrder: (orderData) => 
    api.post('/guest/checkout/place-order', orderData),

  // Guest Order Tracking
  trackGuestOrder: (email, orderId) => 
    api.get('/guest/orders/track', { email, orderId }),
  trackOrderByToken: (token) => 
    api.get('/guest/orders/track', { token }),
  sendTrackingLink: (email, orderId) => 
    api.post('/guest/orders/send-tracking-link', { email, orderId }),

  // Guest to Registered Conversion
  convertToRegistered: (email, password, fullName) => 
    api.post('/guest/convert-to-registered', { email, password, fullName })
};
export default api;
