/**
 * SELLER BALANCE CONTROLLER
 * 
 * Endpoints for sellers to view their balance and for admins to view all balances.
 */

const sellerBalanceService = require('../../services/sellerBalanceServices/sellerBalance.service');

/**
 * Get seller's own balance
 * GET /api/seller/balance
 */
const getOwnBalance = async (req, res, next) => {
  try {
    const balance = await sellerBalanceService.getBalance(req.user.id);

    res.json({
      balance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get balance history
 * GET /api/seller/balance/history
 */
const getBalanceHistory = async (req, res, next) => {
  try {
    const history = await sellerBalanceService.getBalanceHistory(req.user.id);

    res.json({
      history,
      count: history.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all seller balances (admin only)
 * GET /api/admin/seller-balances
 */
const getAllBalances = async (req, res, next) => {
  try {
    const balances = await sellerBalanceService.getAllBalances();

    res.json({
      balances,
      count: balances.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific seller balance (admin only)
 * GET /api/admin/seller-balances/:sellerId
 */
const getSellerBalance = async (req, res, next) => {
  try {
    const balance = await sellerBalanceService.getBalance(req.params.sellerId);

    res.json({
      balance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOwnBalance,
  getBalanceHistory,
  getAllBalances,
  getSellerBalance
};
