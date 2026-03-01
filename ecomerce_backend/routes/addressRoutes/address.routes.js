/**
 * ADDRESS ROUTES
 * 
 * Routes for address management operations.
 */

const express = require('express');
const router = express.Router();
const addressController = require('../../controllers/addressControllers/address.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// ============================================
// AUTHENTICATED USER ROUTES
// ============================================

// Get all addresses for current user
router.get('/api/addresses', authenticate, addressController.getMyAddresses);

// Get default address for current user
router.get('/api/addresses/default', authenticate, addressController.getDefaultAddress);

// Get address count for current user
router.get('/api/addresses/count', authenticate, addressController.getAddressCount);

// Get address by ID
router.get('/api/addresses/:id', authenticate, addressController.getAddressById);

// Create new address
router.post('/api/addresses', authenticate, addressController.createAddress);

// Update address
router.put('/api/addresses/:id', authenticate, addressController.updateAddress);

// Set address as default
router.patch('/api/addresses/:id/default', authenticate, addressController.setAsDefault);

// Delete address
router.delete('/api/addresses/:id', authenticate, addressController.deleteAddress);

module.exports = router;
