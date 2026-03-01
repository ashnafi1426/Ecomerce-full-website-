// Minimal API service to bypass ArrayBuffer error
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple fetch-based API calls
const simpleAPI = {
  get: async (url, params = {}) => {
    const token = localStorage.getItem('token');
    
    // Build query string from params
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    
    const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  post: async (url, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  put: async (url, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
};

// Minimal auth API
export const authAPI = {
  login: (credentials) => simpleAPI.post('/auth/login', credentials),
  register: (userData) => simpleAPI.post('/auth/register', userData),
  registerSeller: (userData) => simpleAPI.post('/auth/register/seller', userData)
};

// Minimal manager API
export const managerAPI = {
  getDashboardStats: () => simpleAPI.get('/manager/dashboard'),
  getApprovalQueue: () => simpleAPI.get('/manager/products/pending'),
  getApprovalStats: () => simpleAPI.get('/manager/dashboard'),
  approveProduct: (id, data) => simpleAPI.post(`/manager/products/${id}/approve`, data),
  rejectProduct: (id, data) => simpleAPI.post(`/manager/products/${id}/reject`, data),
  requestChanges: (id, data) => simpleAPI.post(`/manager/products/${id}/revision`, data)
};

// Minimal seller API
export const sellerAPI = {
  getDashboardStats: async () => {
    console.log('🔍 sellerAPI.getDashboardStats called (minimal)');
    try {
      const result = await simpleAPI.get('/seller/dashboard');
      console.log('✅ sellerAPI.getDashboardStats success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getDashboardStats error (minimal):', error);
      throw error;
    }
  },
  
  getOrders: async (params = {}) => {
    console.log('🔍 sellerAPI.getOrders called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/seller/orders', params);
      console.log('✅ sellerAPI.getOrders success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getOrders error (minimal):', error);
      throw error;
    }
  },
  
  getProducts: async (params = {}) => {
    console.log('🔍 sellerAPI.getProducts called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/seller/products', params);
      console.log('✅ sellerAPI.getProducts success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getProducts error (minimal):', error);
      throw error;
    }
  },
  
  createProduct: async (productData) => {
    console.log('🔍 sellerAPI.createProduct called (minimal) with data:', productData);
    try {
      const result = await simpleAPI.post('/seller/products', productData);
      console.log('✅ sellerAPI.createProduct success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.createProduct error (minimal):', error);
      throw error;
    }
  },
  
  updateProduct: async (id, productData) => {
    console.log('🔍 sellerAPI.updateProduct called (minimal) with id:', id, 'data:', productData);
    try {
      const result = await simpleAPI.put(`/seller/products/${id}`, productData);
      console.log('✅ sellerAPI.updateProduct success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.updateProduct error (minimal):', error);
      throw error;
    }
  },
  
  getProduct: async (id) => {
    console.log('🔍 sellerAPI.getProduct called (minimal) with id:', id);
    try {
      const result = await simpleAPI.get(`/seller/products/${id}`);
      console.log('✅ sellerAPI.getProduct success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getProduct error (minimal):', error);
      throw error;
    }
  },
  
  getReviews: async (params = {}) => {
    console.log('🔍 sellerAPI.getReviews called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/seller/reviews', params);
      console.log('✅ sellerAPI.getReviews success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getReviews error (minimal):', error);
      throw error;
    }
  },
  
  getInventory: async (params = {}) => {
    console.log('🔍 sellerAPI.getInventory called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/seller/inventory', params);
      console.log('✅ sellerAPI.getInventory success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getInventory error (minimal):', error);
      throw error;
    }
  },
  
  getReturns: async (params = {}) => {
    console.log('🔍 sellerAPI.getReturns called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/seller/returns', params);
      console.log('✅ sellerAPI.getReturns success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getReturns error (minimal):', error);
      throw error;
    }
  },
  
  getMessages: async (params = {}) => {
    console.log('🔍 sellerAPI.getMessages called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/seller/messages', params);
      console.log('✅ sellerAPI.getMessages success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getMessages error (minimal):', error);
      throw error;
    }
  },
  
  getSettings: async () => {
    console.log('🔍 sellerAPI.getSettings called (minimal)');
    try {
      const result = await simpleAPI.get('/seller/settings');
      console.log('✅ sellerAPI.getSettings success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getSettings error (minimal):', error);
      throw error;
    }
  },
  
  updateSettings: async (settingsData) => {
    console.log('🔍 sellerAPI.updateSettings called (minimal) with data:', settingsData);
    try {
      const result = await simpleAPI.put('/seller/settings', settingsData);
      console.log('✅ sellerAPI.updateSettings success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.updateSettings error (minimal):', error);
      throw error;
    }
  },
  
  deleteProduct: async (id) => {
    console.log('🔍 sellerAPI.deleteProduct called (minimal) with id:', id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/seller/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ sellerAPI.deleteProduct success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.deleteProduct error (minimal):', error);
      throw error;
    }
  },
  
  // Order Management Methods
  getOrderById: async (id) => {
    console.log('🔍 sellerAPI.getOrderById called (minimal) with id:', id);
    try {
      const result = await simpleAPI.get(`/seller/orders/${id}`);
      console.log('✅ sellerAPI.getOrderById success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.getOrderById error (minimal):', error);
      throw error;
    }
  },
  
  updateOrderStatus: async (id, data) => {
    console.log('🔍 sellerAPI.updateOrderStatus called (minimal) with id:', id, 'data:', data);
    try {
      const result = await simpleAPI.put(`/seller/orders/${id}/status`, data);
      console.log('✅ sellerAPI.updateOrderStatus success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.updateOrderStatus error (minimal):', error);
      throw error;
    }
  },
  
  addShippingInfo: async (id, shippingData) => {
    console.log('🔍 sellerAPI.addShippingInfo called (minimal) with id:', id, 'data:', shippingData);
    try {
      const result = await simpleAPI.put(`/seller/orders/${id}/shipping`, shippingData);
      console.log('✅ sellerAPI.addShippingInfo success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ sellerAPI.addShippingInfo error (minimal):', error);
      throw error;
    }
  }
};

// Minimal customer API
export const customerAPI = {
  getProducts: async (params = {}) => {
    console.log('🔍 customerAPI.getProducts called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/products', params);
      console.log('✅ customerAPI.getProducts success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.getProducts error (minimal):', error);
      throw error;
    }
  },
  
  getProduct: async (id) => {
    console.log('🔍 customerAPI.getProduct called (minimal) with id:', id);
    try {
      const result = await simpleAPI.get(`/products/${id}`);
      console.log('✅ customerAPI.getProduct success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.getProduct error (minimal):', error);
      throw error;
    }
  },
  
  addToCart: async (productId, quantity) => {
    console.log('🔍 customerAPI.addToCart called (minimal) with productId:', productId, 'quantity:', quantity);
    try {
      const result = await simpleAPI.post('/cart/items', { productId, quantity });
      console.log('✅ customerAPI.addToCart success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.addToCart error (minimal):', error);
      throw error;
    }
  },
  
  getCart: async () => {
    console.log('🔍 customerAPI.getCart called (minimal)');
    try {
      const result = await simpleAPI.get('/cart');
      console.log('✅ customerAPI.getCart success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.getCart error (minimal):', error);
      throw error;
    }
  },
  
  createOrder: async (orderData) => {
    console.log('🔍 customerAPI.createOrder called (minimal) with data:', orderData);
    try {
      const result = await simpleAPI.post('/orders', orderData);
      console.log('✅ customerAPI.createOrder success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.createOrder error (minimal):', error);
      throw error;
    }
  },
  
  getOrders: async (params = {}) => {
    console.log('🔍 customerAPI.getOrders called (minimal) with params:', params);
    try {
      const result = await simpleAPI.get('/orders', params);
      console.log('✅ customerAPI.getOrders success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.getOrders error (minimal):', error);
      throw error;
    }
  },
  
  createReview: async (reviewData) => {
    console.log('🔍 customerAPI.createReview called (minimal) with data:', reviewData);
    try {
      const result = await simpleAPI.post('/reviews', reviewData);
      console.log('✅ customerAPI.createReview success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.createReview error (minimal):', error);
      throw error;
    }
  },
  
  getProductReviews: async (productId, params = {}) => {
    console.log('🔍 customerAPI.getProductReviews called (minimal) with productId:', productId, 'params:', params);
    try {
      const result = await simpleAPI.get(`/products/${productId}/reviews`, params);
      console.log('✅ customerAPI.getProductReviews success (minimal):', result);
      return result;
    } catch (error) {
      console.error('❌ customerAPI.getProductReviews error (minimal):', error);
      throw error;
    }
  }
};

export default simpleAPI;