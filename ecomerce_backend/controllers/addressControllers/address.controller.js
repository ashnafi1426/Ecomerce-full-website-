/**
 * ADDRESS CONTROLLER
 * 
 * Handles HTTP requests for address management operations.
 */

const addressService = require('../../services/addressServices/address.service');

/**
 * Get all addresses for current user
 * GET /api/addresses
 */
const getMyAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.findByUserId(req.user.id);
    res.json(addresses);
  } catch (error) {
    next(error);
  }
};

/**
 * Get address by ID
 * GET /api/addresses/:id
 */
const getAddressById = async (req, res, next) => {
  try {
    const address = await addressService.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Address not found'
      });
    }

    // Check authorization - users can only view their own addresses
    if (address.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }
    
    res.json(address);
  } catch (error) {
    next(error);
  }
};

/**
 * Get default address for current user
 * GET /api/addresses/default
 */
const getDefaultAddress = async (req, res, next) => {
  try {
    const address = await addressService.getDefaultAddress(req.user.id);
    
    if (!address) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No default address found'
      });
    }
    
    res.json(address);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new address
 * POST /api/addresses
 */
const createAddress = async (req, res, next) => {
  try {
    const { 
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      postalCode, 
      country, 
      isDefault 
    } = req.body;

    // Validation
    if (!addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Address line 1, city, state, and postal code are required'
      });
    }

    const address = await addressService.create({
      userId: req.user.id,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault
    });

    res.status(201).json({
      message: 'Address created successfully',
      address
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 * PUT /api/addresses/:id
 */
const updateAddress = async (req, res, next) => {
  try {
    // Verify ownership
    const isOwner = await addressService.verifyOwnership(req.params.id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const { 
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      postalCode, 
      country 
    } = req.body;

    const address = await addressService.update(req.params.id, {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    });

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set address as default
 * PATCH /api/addresses/:id/default
 */
const setAsDefault = async (req, res, next) => {
  try {
    // Verify ownership
    const isOwner = await addressService.verifyOwnership(req.params.id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    const address = await addressService.setAsDefault(req.params.id, req.user.id);

    res.json({
      message: 'Default address updated successfully',
      address
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 * DELETE /api/addresses/:id
 */
const deleteAddress = async (req, res, next) => {
  try {
    // Verify ownership
    const isOwner = await addressService.verifyOwnership(req.params.id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    await addressService.deleteAddress(req.params.id);

    res.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get address count for current user
 * GET /api/addresses/count
 */
const getAddressCount = async (req, res, next) => {
  try {
    const count = await addressService.getCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyAddresses,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  setAsDefault,
  deleteAddress,
  getAddressCount
};

