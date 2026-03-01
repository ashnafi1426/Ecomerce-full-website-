const supabase = require('../../config/supabase.js');

/**
 * Reserve Inventory (Soft Lock)
 * POST /api/inventory/reserve
 * 
 * Creates a temporary reservation for cart items
 * Prevents overselling during checkout process
 */
const reserveInventory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cartItems, sessionId } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart items required' });
    }
    if (!userId && !sessionId) {
      return res.status(400).json({ error: 'User ID or session ID required' });
    }

    const reservations = [];
    const failures = [];

    // Reserve each item
    for (const item of cartItems) {
      try {
        const { data, error } = await supabase.rpc('reserve_inventory', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
          p_user_id: userId,
          p_session_id: sessionId,
          p_expiration_minutes: 30 // 30 minutes to complete checkout
        });

        if (error) {
          failures.push({
            product_id: item.product_id,
            error: error.message
          });
        } else {
          reservations.push({
            product_id: item.product_id,
            reservation_id: data,
            quantity: item.quantity
          });
        }
      } catch (error) {
        failures.push({
          product_id: item.product_id,
          error: error.message
        });
      }
    }

    // If any reservations failed, release all successful ones
    if (failures.length > 0) {
      for (const reservation of reservations) {
        await supabase.rpc('release_reservation', {
          p_reservation_id: reservation.reservation_id
        });
      }

      return res.status(400).json({
        error: 'Failed to reserve inventory',
        failures
      });
    }

    res.json({
      success: true,
      reservations,
      expires_in_minutes: 30,
      message: 'Inventory reserved successfully'
    });

  } catch (error) {
    console.error('Reserve Inventory Error:', error);
    res.status(500).json({ error: 'Failed to reserve inventory' });
  }
};

/**
 * Release Reservation
 * POST /api/inventory/release/:reservationId
 * 
 * Releases a reservation (e.g., when user abandons cart)
 */
const releaseReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const { error } = await supabase.rpc('release_reservation', {
      p_reservation_id: reservationId
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Reservation released'
    });

  } catch (error) {
    console.error('Release Reservation Error:', error);
    res.status(500).json({ error: 'Failed to release reservation' });
  }
};

/**
 * Check Product Availability
 * GET /api/inventory/check/:productId
 * 
 * Checks if product has sufficient stock
 */
const checkAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.query;

    const { data, error } = await supabase.rpc('check_product_availability', {
      p_product_id: productId,
      p_quantity: parseInt(quantity)
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (error) {
    console.error('Check Availability Error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

/**
 * Get Inventory Status
 * GET /api/inventory/status
 * 
 * Returns inventory status for all products or specific product
 */
const getInventoryStatus = async (req, res) => {
  try {
    const { productId } = req.query;

    let query = supabase.from('inventory_status').select('*');

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      inventory: data
    });

  } catch (error) {
    console.error('Get Inventory Status Error:', error);
    res.status(500).json({ error: 'Failed to get inventory status' });
  }
};

/**
 * Expire Old Reservations (Cron Job)
 * POST /api/inventory/expire-reservations
 * 
 * Manually trigger expiration of old reservations
 * Should be called by a cron job every 5-10 minutes
 */
const expireOldReservations = async (req, res) => {
  try {
    const { data: expiredCount, error } = await supabase.rpc('expire_old_reservations');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      expired_count: expiredCount,
      message: `Expired ${expiredCount} old reservations`
    });

  } catch (error) {
    console.error('Expire Reservations Error:', error);
    res.status(500).json({ error: 'Failed to expire reservations' });
  }
};

/**
 * Get Active Reservations
 * GET /api/inventory/reservations
 * 
 * Get all active reservations (admin only)
 */
const getActiveReservations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory_reservations')
      .select(`
        *,
        products:product_id (
          id,
          title,
          sku
        )
      `)
      .eq('status', 'active')
      .order('reserved_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({
      success: true,
      reservations: data,
      count: data.length
    });

  } catch (error) {
    console.error('Get Active Reservations Error:', error);
    res.status(500).json({ error: 'Failed to get reservations' });
  }
};

module.exports = {
  reserveInventory,
  releaseReservation,
  checkAvailability,
  getInventoryStatus,
  expireOldReservations,
  getActiveReservations
};
