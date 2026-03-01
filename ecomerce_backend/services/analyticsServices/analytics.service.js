/**
 * ANALYTICS SERVICE
 * 
 * Business logic layer for reports and analytics.
 * Provides sales, revenue, customer behavior, and inventory reports.
 * Admin-only access enforced at route level.
 */

const supabase = require('../../config/supabase');

/**
 * REQUIREMENT 1: Sales Reports
 * Get sales data with various filters and groupings
 */

/**
 * Get sales overview
 * @param {Object} filters - Date range, status filters
 * @returns {Promise<Object>} Sales overview data
 */
const getSalesOverview = async (filters = {}) => {
  const { startDate, endDate, status } = filters;

  let query = supabase
    .from('orders')
    .select('id, amount, status, created_at, basket');

  // Apply date filters
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }

  const { data: orders, error } = await query;
  
  if (error) throw error;

  // Calculate metrics
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Count by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate total items sold
  let totalItemsSold = 0;
  orders.forEach(order => {
    if (order.basket && Array.isArray(order.basket)) {
      totalItemsSold += order.basket.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
  });

  return {
    totalOrders,
    totalSales: totalSales / 100, // Convert cents to dollars
    averageOrderValue: averageOrderValue / 100,
    totalItemsSold,
    ordersByStatus,
    period: {
      startDate: startDate || 'all time',
      endDate: endDate || 'now'
    }
  };
};

/**
 * Get sales by date (daily, weekly, monthly)
 * @param {Object} filters - Date range, grouping
 * @returns {Promise<Array>} Sales grouped by date
 */
const getSalesByDate = async (filters = {}) => {
  const { startDate, endDate, groupBy = 'day' } = filters;

  let query = supabase
    .from('orders')
    .select('amount, created_at, status')
    .in('status', ['paid', 'confirmed', 'packed', 'shipped', 'delivered']);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error } = await query.order('created_at', { ascending: true });
  
  if (error) throw error;

  // Group by date
  const salesByDate = {};
  orders.forEach(order => {
    const date = new Date(order.created_at);
    let key;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!salesByDate[key]) {
      salesByDate[key] = {
        date: key,
        totalSales: 0,
        orderCount: 0
      };
    }

    salesByDate[key].totalSales += order.amount / 100;
    salesByDate[key].orderCount += 1;
  });

  return Object.values(salesByDate);
};

/**
 * Get top selling products
 * @param {Object} filters - Date range, limit
 * @returns {Promise<Array>} Top selling products
 */
const getTopSellingProducts = async (filters = {}) => {
  const { startDate, endDate, limit = 10 } = filters;

  let query = supabase
    .from('orders')
    .select('basket, created_at')
    .in('status', ['paid', 'confirmed', 'packed', 'shipped', 'delivered']);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error } = await query;
  
  if (error) throw error;

  // Aggregate product sales
  const productSales = {};
  orders.forEach(order => {
    if (order.basket && Array.isArray(order.basket)) {
      order.basket.forEach(item => {
        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = {
            product_id: productId,
            title: item.title || 'Unknown Product',
            quantity_sold: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity_sold += item.quantity || 0;
        productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    }
  });

  // Sort by quantity sold and limit
  return Object.values(productSales)
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, limit);
};

/**
 * REQUIREMENT 2: Revenue Reports
 * Get revenue data with various breakdowns
 */

/**
 * Get revenue overview
 * @param {Object} filters - Date range
 * @returns {Promise<Object>} Revenue overview data
 */
const getRevenueOverview = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // Get completed orders (revenue recognized)
  let ordersQuery = supabase
    .from('orders')
    .select('amount, created_at')
    .in('status', ['paid', 'confirmed', 'packed', 'shipped', 'delivered']);

  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (endDate) {
    ordersQuery = ordersQuery.lte('created_at', endDate);
  }

  const { data: orders, error: ordersError } = await ordersQuery;
  if (ordersError) throw ordersError;

  // Get refunds
  let refundsQuery = supabase
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'refunded');

  if (startDate) {
    refundsQuery = refundsQuery.gte('created_at', startDate);
  }
  if (endDate) {
    refundsQuery = refundsQuery.lte('created_at', endDate);
  }

  const { data: refunds, error: refundsError } = await refundsQuery;
  if (refundsError) throw refundsError;

  const grossRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const totalRefunds = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);
  const netRevenue = grossRevenue - totalRefunds;

  return {
    grossRevenue: grossRevenue / 100,
    totalRefunds: totalRefunds / 100,
    netRevenue: netRevenue / 100,
    orderCount: orders.length,
    refundCount: refunds.length,
    averageRevenuePerOrder: orders.length > 0 ? (grossRevenue / orders.length) / 100 : 0,
    period: {
      startDate: startDate || 'all time',
      endDate: endDate || 'now'
    }
  };
};

/**
 * Get revenue by category
 * @param {Object} filters - Date range
 * @returns {Promise<Array>} Revenue grouped by category
 */
const getRevenueByCategory = async (filters = {}) => {
  const { startDate, endDate } = filters;

  let query = supabase
    .from('orders')
    .select('basket, created_at')
    .in('status', ['paid', 'confirmed', 'packed', 'shipped', 'delivered']);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error } = await query;
  if (error) throw error;

  // Get all products with categories
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, category_id');
  
  if (productsError) throw productsError;

  // Get all categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');
  
  if (categoriesError) throw categoriesError;

  // Create product to category map
  const productCategoryMap = {};
  products.forEach(product => {
    productCategoryMap[product.id] = product.category_id;
  });

  // Create category name map
  const categoryNameMap = {};
  categories.forEach(category => {
    categoryNameMap[category.id] = category.name;
  });

  // Aggregate revenue by category
  const revenueByCategory = {};
  orders.forEach(order => {
    if (order.basket && Array.isArray(order.basket)) {
      order.basket.forEach(item => {
        const categoryId = productCategoryMap[item.product_id];
        const categoryName = categoryNameMap[categoryId] || 'Uncategorized';

        if (!revenueByCategory[categoryName]) {
          revenueByCategory[categoryName] = {
            category: categoryName,
            revenue: 0,
            orderCount: 0
          };
        }

        revenueByCategory[categoryName].revenue += (item.price || 0) * (item.quantity || 0);
        revenueByCategory[categoryName].orderCount += 1;
      });
    }
  });

  return Object.values(revenueByCategory)
    .sort((a, b) => b.revenue - a.revenue);
};

/**
 * Get revenue trends (month over month, year over year)
 * @param {Object} filters - Date range
 * @returns {Promise<Object>} Revenue trends
 */
const getRevenueTrends = async (filters = {}) => {
  const { startDate, endDate } = filters;

  let query = supabase
    .from('orders')
    .select('amount, created_at')
    .in('status', ['paid', 'confirmed', 'packed', 'shipped', 'delivered'])
    .order('created_at', { ascending: true });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error } = await query;
  if (error) throw error;

  // Group by month
  const monthlyRevenue = {};
  orders.forEach(order => {
    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyRevenue[monthKey]) {
      monthlyRevenue[monthKey] = {
        month: monthKey,
        revenue: 0,
        orderCount: 0
      };
    }

    monthlyRevenue[monthKey].revenue += order.amount / 100;
    monthlyRevenue[monthKey].orderCount += 1;
  });

  const trends = Object.values(monthlyRevenue);

  // Calculate growth rates
  for (let i = 1; i < trends.length; i++) {
    const current = trends[i].revenue;
    const previous = trends[i - 1].revenue;
    trends[i].growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  return trends;
};

/**
 * REQUIREMENT 3: Customer Behavior Analytics
 * Analyze customer patterns and behavior
 */

/**
 * Get customer statistics
 * @param {Object} filters - Date range
 * @returns {Promise<Object>} Customer statistics
 */
const getCustomerStatistics = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // Get all customers
  const { data: customers, error: customersError } = await supabase
    .from('users')
    .select('id, created_at, role')
    .eq('role', 'customer');
  
  if (customersError) throw customersError;

  // Get orders
  let ordersQuery = supabase
    .from('orders')
    .select('user_id, amount, created_at');

  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (endDate) {
    ordersQuery = ordersQuery.lte('created_at', endDate);
  }

  const { data: orders, error: ordersError } = await ordersQuery;
  if (ordersError) throw ordersError;

  // Calculate metrics
  const totalCustomers = customers.length;
  const customersWithOrders = new Set(orders.map(o => o.user_id)).size;
  const totalOrders = orders.length;
  const averageOrdersPerCustomer = customersWithOrders > 0 ? totalOrders / customersWithOrders : 0;

  // Calculate customer lifetime value
  const customerSpending = {};
  orders.forEach(order => {
    if (!customerSpending[order.user_id]) {
      customerSpending[order.user_id] = 0;
    }
    customerSpending[order.user_id] += order.amount || 0;
  });

  const lifetimeValues = Object.values(customerSpending);
  const averageLifetimeValue = lifetimeValues.length > 0
    ? lifetimeValues.reduce((sum, val) => sum + val, 0) / lifetimeValues.length / 100
    : 0;

  // New customers in period
  let newCustomers = customers;
  if (startDate) {
    newCustomers = customers.filter(c => new Date(c.created_at) >= new Date(startDate));
  }
  if (endDate) {
    newCustomers = newCustomers.filter(c => new Date(c.created_at) <= new Date(endDate));
  }

  return {
    totalCustomers,
    newCustomers: newCustomers.length,
    activeCustomers: customersWithOrders,
    inactiveCustomers: totalCustomers - customersWithOrders,
    averageOrdersPerCustomer: parseFloat(averageOrdersPerCustomer.toFixed(2)),
    averageLifetimeValue: parseFloat(averageLifetimeValue.toFixed(2)),
    period: {
      startDate: startDate || 'all time',
      endDate: endDate || 'now'
    }
  };
};

/**
 * Get customer segmentation (by spending, frequency)
 * @returns {Promise<Object>} Customer segments
 */
const getCustomerSegmentation = async () => {
  // Get all orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('user_id, amount, created_at');
  
  if (error) throw error;

  // Calculate per-customer metrics
  const customerMetrics = {};
  orders.forEach(order => {
    if (!customerMetrics[order.user_id]) {
      customerMetrics[order.user_id] = {
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: order.created_at
      };
    }
    customerMetrics[order.user_id].totalSpent += order.amount || 0;
    customerMetrics[order.user_id].orderCount += 1;
    if (new Date(order.created_at) > new Date(customerMetrics[order.user_id].lastOrderDate)) {
      customerMetrics[order.user_id].lastOrderDate = order.created_at;
    }
  });

  // Segment customers
  const segments = {
    high_value: { count: 0, totalRevenue: 0 }, // > $1000
    medium_value: { count: 0, totalRevenue: 0 }, // $500 - $1000
    low_value: { count: 0, totalRevenue: 0 }, // < $500
    frequent: { count: 0, totalRevenue: 0 }, // > 5 orders
    occasional: { count: 0, totalRevenue: 0 }, // 2-5 orders
    one_time: { count: 0, totalRevenue: 0 } // 1 order
  };

  Object.values(customerMetrics).forEach(metrics => {
    const spentInDollars = metrics.totalSpent / 100;

    // By spending
    if (spentInDollars > 1000) {
      segments.high_value.count++;
      segments.high_value.totalRevenue += spentInDollars;
    } else if (spentInDollars >= 500) {
      segments.medium_value.count++;
      segments.medium_value.totalRevenue += spentInDollars;
    } else {
      segments.low_value.count++;
      segments.low_value.totalRevenue += spentInDollars;
    }

    // By frequency
    if (metrics.orderCount > 5) {
      segments.frequent.count++;
      segments.frequent.totalRevenue += spentInDollars;
    } else if (metrics.orderCount >= 2) {
      segments.occasional.count++;
      segments.occasional.totalRevenue += spentInDollars;
    } else {
      segments.one_time.count++;
      segments.one_time.totalRevenue += spentInDollars;
    }
  });

  return segments;
};

/**
 * Get customer retention metrics
 * @param {Object} filters - Date range
 * @returns {Promise<Object>} Retention metrics
 */
const getCustomerRetention = async (filters = {}) => {
  const { startDate, endDate } = filters;

  let query = supabase
    .from('orders')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error } = await query;
  if (error) throw error;

  // Group orders by customer
  const customerOrders = {};
  orders.forEach(order => {
    if (!customerOrders[order.user_id]) {
      customerOrders[order.user_id] = [];
    }
    customerOrders[order.user_id].push(new Date(order.created_at));
  });

  // Calculate retention metrics
  let repeatCustomers = 0;
  let totalCustomers = Object.keys(customerOrders).length;

  Object.values(customerOrders).forEach(orderDates => {
    if (orderDates.length > 1) {
      repeatCustomers++;
    }
  });

  const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  const churnRate = 100 - retentionRate;

  return {
    totalCustomers,
    repeatCustomers,
    oneTimeCustomers: totalCustomers - repeatCustomers,
    retentionRate: parseFloat(retentionRate.toFixed(2)),
    churnRate: parseFloat(churnRate.toFixed(2)),
    period: {
      startDate: startDate || 'all time',
      endDate: endDate || 'now'
    }
  };
};

/**
 * REQUIREMENT 4: Inventory Reports
 * Analyze inventory levels and movements
 */

/**
 * Get inventory overview
 * @returns {Promise<Object>} Inventory overview
 */
const getInventoryOverview = async () => {
  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('product_id, quantity, reserved_quantity, low_stock_threshold');
  
  if (error) throw error;

  let totalProducts = inventory.length;
  let totalStock = 0;
  let totalReserved = 0;
  let lowStockItems = 0;
  let outOfStockItems = 0;

  inventory.forEach(item => {
    const availableStock = (item.quantity || 0) - (item.reserved_quantity || 0);
    totalStock += item.quantity || 0;
    totalReserved += item.reserved_quantity || 0;

    if (availableStock <= 0) {
      outOfStockItems++;
    } else if (availableStock <= (item.low_stock_threshold || 0)) {
      lowStockItems++;
    }
  });

  return {
    totalProducts,
    totalStock,
    totalReserved,
    availableStock: totalStock - totalReserved,
    lowStockItems,
    outOfStockItems,
    healthyStockItems: totalProducts - lowStockItems - outOfStockItems
  };
};

/**
 * Get low stock products
 * @param {Number} limit - Number of products to return
 * @returns {Promise<Array>} Low stock products
 */
const getLowStockProducts = async (limit = 20) => {
  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('product_id, quantity, reserved_quantity, low_stock_threshold');
  
  if (error) throw error;

  // Get product details
  const productIds = inventory.map(i => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price')
    .in('id', productIds);
  
  if (productsError) throw productsError;

  // Create product map
  const productMap = {};
  products.forEach(p => {
    productMap[p.id] = p;
  });

  // Find low stock items
  const lowStockItems = inventory
    .map(item => {
      const availableStock = (item.quantity || 0) - (item.reserved_quantity || 0);
      const product = productMap[item.product_id];
      
      return {
        product_id: item.product_id,
        title: product?.title || 'Unknown',
        price: product?.price || 0,
        quantity: item.quantity,
        reserved_quantity: item.reserved_quantity,
        available_stock: availableStock,
        low_stock_threshold: item.low_stock_threshold,
        status: availableStock <= 0 ? 'out_of_stock' : 'low_stock'
      };
    })
    .filter(item => item.available_stock <= item.low_stock_threshold)
    .sort((a, b) => a.available_stock - b.available_stock)
    .slice(0, limit);

  return lowStockItems;
};

/**
 * Get inventory turnover rate
 * @param {Object} filters - Date range
 * @returns {Promise<Object>} Inventory turnover metrics
 */
const getInventoryTurnover = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // Get orders in period
  let query = supabase
    .from('orders')
    .select('basket, created_at')
    .in('status', ['paid', 'confirmed', 'packed', 'shipped', 'delivered']);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error: ordersError } = await query;
  if (ordersError) throw ordersError;

  // Get current inventory
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('product_id, quantity');
  
  if (inventoryError) throw inventoryError;

  // Calculate units sold per product
  const unitsSold = {};
  orders.forEach(order => {
    if (order.basket && Array.isArray(order.basket)) {
      order.basket.forEach(item => {
        unitsSold[item.product_id] = (unitsSold[item.product_id] || 0) + (item.quantity || 0);
      });
    }
  });

  // Calculate turnover rate
  const inventoryMap = {};
  inventory.forEach(item => {
    inventoryMap[item.product_id] = item.quantity || 0;
  });

  const totalUnitsSold = Object.values(unitsSold).reduce((sum, val) => sum + val, 0);
  const averageInventory = Object.values(inventoryMap).reduce((sum, val) => sum + val, 0) / inventory.length;
  
  // Turnover rate = Units Sold / Average Inventory
  const turnoverRate = averageInventory > 0 ? totalUnitsSold / averageInventory : 0;

  return {
    totalUnitsSold,
    averageInventory: parseFloat(averageInventory.toFixed(2)),
    turnoverRate: parseFloat(turnoverRate.toFixed(2)),
    period: {
      startDate: startDate || 'all time',
      endDate: endDate || 'now'
    }
  };
};

/**
 * Get comprehensive dashboard data
 * @param {Object} filters - Date range
 * @returns {Promise<Object>} Dashboard data
 */
const getDashboardData = async (filters = {}) => {
  const [
    salesOverview,
    revenueOverview,
    customerStats,
    inventoryOverview
  ] = await Promise.all([
    getSalesOverview(filters),
    getRevenueOverview(filters),
    getCustomerStatistics(filters),
    getInventoryOverview()
  ]);

  return {
    sales: salesOverview,
    revenue: revenueOverview,
    customers: customerStats,
    inventory: inventoryOverview,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  // Sales Reports
  getSalesOverview,
  getSalesByDate,
  getTopSellingProducts,
  
  // Revenue Reports
  getRevenueOverview,
  getRevenueByCategory,
  getRevenueTrends,
  
  // Customer Behavior
  getCustomerStatistics,
  getCustomerSegmentation,
  getCustomerRetention,
  
  // Inventory Reports
  getInventoryOverview,
  getLowStockProducts,
  getInventoryTurnover,
  
  // Dashboard
  getDashboardData
};
