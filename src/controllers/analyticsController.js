const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    const thisMonthRevenue = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      }
    ]);

    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: lastMonth, $lt: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      }
    ]);

    // Get customer statistics
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const newCustomersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: thisMonth }
    });

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const inStockProducts = await Product.countDocuments({ inStock: true });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });

    // Get order statistics by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate changes
    const currentRevenue = thisMonthRevenue[0]?.revenue || 0;
    const previousRevenue = lastMonthRevenue[0]?.revenue || 0;
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    const currentOrders = thisMonthRevenue[0]?.orders || 0;
    const previousOrders = lastMonthRevenue[0]?.orders || 0;
    const ordersChange = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          thisMonth: currentRevenue,
          lastMonth: previousRevenue,
          change: revenueChange
        },
        orders: {
          total: revenueStats[0]?.totalOrders || 0,
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
      }
    });
  } catch (error) {
    res.status(500).json({
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
    const { period = '7days' } = req.query;
    let startDate;
    const endDate = new Date();

    switch(period) {
      case '7days':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const revenueByDay = await Order.aggregate([
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

    res.status(200).json({
      success: true,
      data: revenueByDay
    });
  } catch (error) {
    res.status(500).json({
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
    const { limit = 10 } = req.query;

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
      { $limit: parseInt(limit) }
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
    // Customer growth over time
    const customerGrowth = await User.aggregate([
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
    ]);

    // Top customers by spending
    const topCustomers = await Order.aggregate([
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
    ]);

    // Customer segments
    const customerSegments = await User.aggregate([
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
    ]);

    res.status(200).json({
      success: true,
      data: {
        growth: customerGrowth,
        topCustomers,
        segments: customerSegments
      }
    });
  } catch (error) {
    res.status(500).json({
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
    // Stock levels by category
    const stockByCategory = await Product.aggregate([
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
    ]);

    // Low stock products (assumed threshold)
    const lowStockProducts = await Product.find({
      inStock: true,
      // Assuming we have a quantity field, otherwise we'll just show products
    })
    .select('name brand category price inStock')
    .limit(10);

    // Most viewed products (if we track views)
    const popularProducts = await Product.find()
      .sort('-viewsCount')
      .select('name brand viewsCount')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stockByCategory,
        lowStockProducts,
        popularProducts
      }
    });
  } catch (error) {
    res.status(500).json({
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
    const { type = 'summary', format = 'json', period = '30days' } = req.query;

    // This would typically generate a CSV or PDF report
    // For now, we'll return JSON data that could be formatted

    const reportData = {
      generatedAt: new Date(),
      period,
      type,
      data: {}
    };

    // Gather all relevant data based on report type
    if (type === 'summary' || type === 'full') {
      // Get dashboard stats
      const dashboardStats = await this.getDashboardStats({ query: {} }, {
        status: () => ({ json: (data) => data }),
        json: (data) => data
      });
      reportData.data.dashboard = dashboardStats;
    }

    if (type === 'revenue' || type === 'full') {
      // Get revenue data
      const revenueData = await Order.aggregate([
        { $match: { isPaid: true } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
      reportData.data.revenue = revenueData;
    }

    if (type === 'customers' || type === 'full') {
      // Get customer data
      const customerData = await User.aggregate([
        { $match: { role: 'user' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newCustomers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
      reportData.data.customers = customerData;
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};