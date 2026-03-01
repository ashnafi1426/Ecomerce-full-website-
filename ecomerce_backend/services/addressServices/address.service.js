/**
 * ADDRESS SERVICE
 * 
 * Business logic layer for address management.
 * Handles multiple shipping addresses per user.
 */

const supabase = require('../../config/supabase');

/**
 * Find address by ID
 * @param {String} id - Address UUID
 * @returns {Promise<Object|null>} Address object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find addresses by user ID
 * @param {String} userId - User UUID
 * @returns {Promise<Array>} Array of address objects
 */
const findByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get default address for user
 * @param {String} userId - User UUID
 * @returns {Promise<Object|null>} Default address or null
 */
const getDefaultAddress = async (userId) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Create new address
 * @param {Object} addressData - Address data
 * @returns {Promise<Object>} Created address object
 */
const create = async (addressData) => {
  // If setting as default, unset other defaults first
  if (addressData.isDefault) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', addressData.userId);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert([{
      user_id: addressData.userId,
      address_line1: addressData.addressLine1,
      address_line2: addressData.addressLine2 || null,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      country: addressData.country || 'US',
      is_default: addressData.isDefault || false
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update address
 * @param {String} id - Address UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated address object
 */
const update = async (id, updates) => {
  const updateData = {};
  
  if (updates.addressLine1 !== undefined) updateData.address_line1 = updates.addressLine1;
  if (updates.addressLine2 !== undefined) updateData.address_line2 = updates.addressLine2;
  if (updates.city !== undefined) updateData.city = updates.city;
  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode;
  if (updates.country !== undefined) updateData.country = updates.country;

  const { data, error } = await supabase
    .from('addresses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Set address as default
 * @param {String} id - Address UUID
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Updated address object
 */
const setAsDefault = async (id, userId) => {
  // Unset all other defaults for this user
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Set this address as default
  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Delete address
 * @param {String} id - Address UUID
 * @returns {Promise<void>}
 */
const deleteAddress = async (id) => {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Verify address belongs to user
 * @param {String} addressId - Address UUID
 * @param {String} userId - User UUID
 * @returns {Promise<Boolean>} True if address belongs to user
 */
const verifyOwnership = async (addressId, userId) => {
  const address = await findById(addressId);
  return address && address.user_id === userId;
};

/**
 * Get address count for user
 * @param {String} userId - User UUID
 * @returns {Promise<Number>} Count of addresses
 */
const getCount = async (userId) => {
  const { count, error } = await supabase
    .from('addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return count || 0;
};

module.exports = {
  findById,
  findByUserId,
  getDefaultAddress,
  create,
  update,
  setAsDefault,
  deleteAddress,
  verifyOwnership,
  getCount
};
