import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: localStorage.getItem('guestSessionId') || null,
  items: [],
  expiresAt: null,
  loading: false,
  error: null
};

const guestCartSlice = createSlice({
  name: 'guestCart',
  initialState,
  reducers: {
    setGuestSession: (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.expiresAt = action.payload.expiresAt;
      localStorage.setItem('guestSessionId', action.payload.sessionId);
      localStorage.setItem('guestExpiresAt', action.payload.expiresAt);
    },
    
    setGuestCartItems: (state, action) => {
      state.items = action.payload;
    },
    
    addGuestCartItem: (state, action) => {
      const existingItem = state.items.find(item => item.product_id === action.payload.product_id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    
    updateGuestCartItem: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.product_id === productId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.product_id !== productId);
        } else {
          item.quantity = quantity;
        }
      }
    },
    
    removeGuestCartItem: (state, action) => {
      state.items = state.items.filter(item => item.product_id !== action.payload);
    },
    
    clearGuestCart: (state) => {
      state.sessionId = null;
      state.items = [];
      state.expiresAt = null;
      localStorage.removeItem('guestSessionId');
      localStorage.removeItem('guestExpiresAt');
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    checkExpiration: (state) => {
      if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
        // Cart expired, clear it
        state.sessionId = null;
        state.items = [];
        state.expiresAt = null;
        localStorage.removeItem('guestSessionId');
        localStorage.removeItem('guestExpiresAt');
      }
    }
  }
});

export const {
  setGuestSession,
  setGuestCartItems,
  addGuestCartItem,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  setLoading,
  setError,
  checkExpiration
} = guestCartSlice.actions;

export default guestCartSlice.reducer;
