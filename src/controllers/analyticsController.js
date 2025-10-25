const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

const PERIOD_WINDOWS = {
  '7days': 7 * 24 * 60 * 60 * 1000,
  '30days': 30 * 24 * 60 * 60 * 1000,
  '6months': 180 * 24 * 60 * 60 * 1000,
  '1year': 365 * 24 * 60 * 60 * 1000
};

const REPORT_TYPES = new Set(['summary', 'revenue', 'customers', 'inventory', 'full']);
const EXPORT_FORMATS = new Set(['json', 'csv']);

const normalizePeriod = (value = '30days') => {
  const key = value ? value.toString().toLowerCase() : '30days';
  return PERIOD_WINDOWS[key] ? key : '30days';
};

const getPeriodRange = (periodKey) => {
  const normalized = normalizePeriod(periodKey);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - PERIOD_WINDOWS[normalized]);
  return { startDate, endDate, periodKey: normalized };
};

const pad = (value) => value.toString().padStart(2, '0');

const formatTimelineLabel = (parts = {}) => {
  const year = parts.year ?? '';
  const month = typeof parts.month === 'number' ? pad(parts.month) : '';
  const day = typeof parts.day === 'number' ? pad(parts.day) : '';

  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }

  if (year && month) {
    return `${year}-${month}`;
  }

  return year ? `${year}` : '';
};

const csvEscape = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = value instanceof Date
    ? value.toISOString()
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
};

const convertReportToCSV = (report) => {
  const rows = [['section', 'label', 'value', 'extra1', 'extra2'].map(csvEscape)];
  const pushRow = (section, label, value = '', extra1 = '', extra2 = '') => {
    rows.push([section, label, value, extra1, extra2].map(csvEscape));
  };

  pushRow('meta', 'generatedAt', report.generatedAt);
  pushRow('meta', 'period', report.period);
  pushRow('meta', 'type', report.type);

  const dashboard = report.data.dashboard;
  if (dashboard) {
    pushRow('dashboard', 'revenue_total', dashboard.revenue?.total ?? 0);
    pushRow('dashboard', 'revenue_thisMonth', dashboard.revenue?.thisMonth ?? 0);
    pushRow('dashboard', 'revenue_lastMonth', dashboard.revenue?.lastMonth ?? 0);
    pushRow('dashboard', 'orders_total', dashboard.orders?.total ?? 0);
    pushRow('dashboard', 'orders_thisMonth', dashboard.orders?.thisMonth ?? 0);
    pushRow('dashboard', 'orders_lastMonth', dashboard.orders?.lastMonth ?? 0);
    pushRow('dashboard', 'customers_total', dashboard.customers?.total ?? 0);
    pushRow('dashboard', 'customers_newThisMonth', dashboard.customers?.newThisMonth ?? 0);
    pushRow('dashboard', 'products_total', dashboard.products?.total ?? 0);
    pushRow('dashboard', 'products_inStock', dashboard.products?.inStock ?? 0);
    pushRow('dashboard', 'products_featured', dashboard.products?.featured ?? 0);

    (dashboard.orders?.byStatus || []).forEach((status) => {
      pushRow('dashboard_orders_by_status', status._id || 'Unknown', status.count ?? 0);
    });
  }

  (report.data.revenue || []).forEach((entry) => {
    pushRow(
      'revenue',
      formatTimelineLabel(entry._id || {}),
      entry.revenue ?? 0,
      entry.orders ?? 0,
      Number(entry.averageOrderValue ?? 0).toFixed(2)
    );
  });

  const customers = report.data.customers || {};
  (customers.growth || []).forEach((entry) => {
    pushRow('customers_growth', formatTimelineLabel(entry._id || {}), entry.count ?? entry.newCustomers ?? 0);
  });
  (customers.topCustomers || []).forEach((entry) => {
    pushRow(
      'customers_top',
      entry.name || entry._id || '',
      entry.totalSpent ?? 0,
      entry.orderCount ?? 0,
      Number(entry.averageOrderValue ?? 0).toFixed(2)
    );
  });
  (customers.segments || []).forEach((entry) => {
    pushRow('customers_segments', entry._id || 'Unknown', entry.count ?? 0);
  });

  const inventory = report.data.inventory || {};
  (inventory.stockByCategory || []).forEach((entry) => {
    pushRow(
      'inventory_category',
      entry._id || 'Unknown',
      entry.totalProducts ?? 0,
      entry.inStock ?? 0,
      entry.outOfStock ?? 0
    );
  });
  (inventory.lowStockProducts || []).forEach((product) => {
    pushRow(
      'inventory_low_stock',
      product.name || product._id || '',
      product.brand || '',
      product.category || '',
      product.price ?? 0
    );
  });
  (inventory.popularProducts || []).forEach((product) => {
    pushRow(
      'inventory_popular',
      product.name || product._id || '',
      product.brand || '',
      product.viewsCount ?? 0
    );
  });

  return rows.map((row) => row.join(',')).join('\n');
};

const buildDashboardStats = async () => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    orderStatsAggregate,
    [totalCustomers, newCustomersThisMonth],
    [totalProducts, inStockProducts, featuredProducts]
  ] = await Promise.all([
    Order.aggregate([
      {
        $facet: {
          overall: [
            { $match: { isPaid: true } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
                totalOrders: { $sum: 1 }
              }
            }
          ],
          currentMonth: [
            { $match: { isPaid: true, createdAt: { $gte: thisMonth } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
              }
            }
          ],
          previousMonth: [
            { $match: { isPaid: true, createdAt: { $gte: lastMonth, $lt: thisMonth } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$orderStatus',
                count: { $sum: 1 }
              }
            }
          ]
        }
      },
      {
        $project: {
          overall: { $arrayElemAt: ['$overall', 0] },
          currentMonth: { $arrayElemAt: ['$currentMonth', 0] },
          previousMonth: { $arrayElemAt: ['$previousMonth', 0] },
          byStatus: '$byStatus'
        }
      }
    ]),
    Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: thisMonth } })
    ]),
    Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ inStock: true }),
      Product.countDocuments({ isFeatured: true })
    ])
  ]);

  const orderStats = orderStatsAggregate[0] || {};
  const overallStats = orderStats.overall || {};
  const currentStats = orderStats.currentMonth || {};
  const previousStats = orderStats.previousMonth || {};
  const ordersByStatus = orderStats.byStatus || [];

  const currentRevenue = currentStats.revenue || 0;
  const previousRevenue = previousStats.revenue || 0;
  const revenueChange = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
    : 0;

  const currentOrders = currentStats.orders || 0;
  const previousOrders = previousStats.orders || 0;
  const ordersChange = previousOrders > 0
    ? ((currentOrders - previousOrders) / previousOrders * 100).toFixed(1)
    : 0;

  return {
    revenue: {
      total: overallStats.totalRevenue || 0,
      thisMonth: currentRevenue,
      lastMonth: previousRevenue,
      change: revenueChange
    },
    orders: {
      total: overallStats.totalOrders || 0,
      thisMonth: currentOrders,
      lastMonth: previousOrders,
      change: ordersChange,
      byStatus: ordersByStatus
    },
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomersThisMonth
    },
    products: {
      total: totalProducts,
      inStock: inStockProducts,
      featured: featuredProducts
    }
  };
};

const buildRevenueTimeline = async (periodKey) => {
  const { startDate, endDate } = getPeriodRange(periodKey);
  return Order.aggregate([
    {
      $match: {
        isPaid: true,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

const buildCustomerAnalytics = async () => {
  const [customerGrowth, topCustomers, customerSegments] = await Promise.all([
    User.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]),
    User.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $project: {
          orderCount: { $size: '$orders' },
          isActive: '$isActive'
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$orderCount', 0] }, then: 'New' },
                { case: { $lte: ['$orderCount', 3] }, then: 'Occasional' },
                { case: { $lte: ['$orderCount', 10] }, then: 'Regular' },
                { case: { $gt: ['$orderCount', 10] }, then: 'VIP' }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    growth: customerGrowth,
    topCustomers,
    segments: customerSegments
  };
};

const buildInventoryAnalytics = async () => {
  const [stockByCategory, lowStockProducts, popularProducts] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          inStock: {
            $sum: { $cond: ['$inStock', 1, 0] }
          },
          outOfStock: {
            $sum: { $cond: ['$inStock', 0, 1] }
          },
          averagePrice: { $avg: '$price' }
        }
      }
    ]),
    Product.find({ inStock: true })
      .select('name brand category price inStock')
      .limit(10),
    Product.find()
      .sort('-viewsCount')
      .select('name brand viewsCount')
      .limit(10)
  ]);

  return {
    stockByCategory,
    lowStockProducts,
    popularProducts
  };
};

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const data = await buildDashboardStats();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const period = normalizePeriod(req.query.period);
    const data = await buildRevenueTimeline(period);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/analytics/top-products
// @access  Private/Admin
exports.getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const topProducts = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          brand: '$product.brand',
          category: '$product.category',
          image: '$product.image',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private/Admin
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const data = await buildCustomerAnalytics();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sales by region
// @route   GET /api/analytics/sales-by-region
// @access  Private/Admin
exports.getSalesByRegion = async (req, res) => {
  try {
    const salesByRegion = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$shippingAddress.city',
          totalRevenue: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    const totalRevenue = salesByRegion.reduce((sum, region) => sum + region.totalRevenue, 0);

    const regionsWithPercentage = salesByRegion.map(region => ({
      ...region,
      percentage: ((region.totalRevenue / totalRevenue) * 100).toFixed(1)
    }));

    res.status(200).json({
      success: true,
      data: regionsWithPercentage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get inventory analytics
// @route   GET /api/analytics/inventory
// @access  Private/Admin
exports.getInventoryAnalytics = async (req, res) => {
  try {
    const data = await buildInventoryAnalytics();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export analytics report
// @route   GET /api/analytics/export
// @access  Private/Admin
exports.exportAnalytics = async (req, res) => {
  try {
    const requestedType = (req.query.type || 'summary').toString().toLowerCase();
    const type = REPORT_TYPES.has(requestedType) ? requestedType : 'summary';
    const requestedFormat = (req.query.format || 'json').toString().toLowerCase();
    const format = EXPORT_FORMATS.has(requestedFormat) ? requestedFormat : 'json';
    const period = normalizePeriod(req.query.period);

    const reportData = {
      generatedAt: new Date().toISOString(),
      period,
      type,
      data: {}
    };

    if (type === 'summary' || type === 'full') {
      reportData.data.dashboard = await buildDashboardStats();
    }

    if (type === 'revenue' || type === 'full') {
      reportData.data.revenue = await buildRevenueTimeline(period);
    }

    if (type === 'customers' || type === 'full') {
      reportData.data.customers = await buildCustomerAnalytics();
    }

    if (type === 'inventory' || type === 'full') {
      reportData.data.inventory = await buildInventoryAnalytics();
    }

    if (format === 'csv') {
      const csvPayload = convertReportToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${period}.csv`);
      return res.status(200).send(csvPayload);
    }

    return res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
