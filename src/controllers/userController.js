const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

const objectIdOrNull = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sanitizeUserDocument = (doc = {}) => {
  if (!doc) return null;
  const {
    _id,
    password,
    __v,
    avatar: docAvatar,
    image: docImage,
    ...rest
  } = doc;

  const normalizedAvatar = docAvatar || docImage || null;
  const normalizedImage = docImage || docAvatar || null;

  return {
    ...rest,
    avatar: normalizedAvatar,
    image: normalizedImage,
    id: doc.id || (_id ? _id.toString() : undefined)
  };
};

const buildCustomerStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCustomers,
    activeCustomers,
    newCustomersThisMonth,
    spendingAggregate
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', isActive: true }),
    User.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      {
        $group: {
          _id: null,
          averageSpent: { $avg: '$totalSpent' },
          totalRevenue: { $sum: '$totalSpent' }
        }
      }
    ])
  ]);

  const spendingStats = spendingAggregate[0] || {};

  return {
    totalCustomers,
    activeCustomers,
    inactiveCustomers: Math.max(totalCustomers - activeCustomers, 0),
    newCustomersThisMonth,
    averageSpent: Number(spendingStats.averageSpent || 0),
    totalRevenueFromCustomers: Number(spendingStats.totalRevenue || 0)
  };
};

// @desc    Get paginated customers with activity metrics
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const skip = (page - 1) * limit;

    const filters = {};
    const roleFilter = (req.query.role || 'user').toLowerCase();

    if (roleFilter !== 'all') {
      filters.role = roleFilter;
    }

    if (req.query.status === 'active') {
      filters.isActive = true;
    } else if (req.query.status === 'inactive') {
      filters.isActive = false;
    }

    if (req.query.search) {
      const term = req.query.search.trim();
      if (term) {
        const regex = new RegExp(term, 'i');
        filters.$or = [
          { name: regex },
          { email: regex },
          { phone: regex }
        ];
      }
    }

    if (req.query.from || req.query.to) {
      const fromDate = parseDate(req.query.from);
      const toDate = parseDate(req.query.to);

      if (fromDate || toDate) {
        filters.createdAt = {};

        if (fromDate) {
          filters.createdAt.$gte = fromDate;
        }

        if (toDate) {
          filters.createdAt.$lte = toDate;
        }
      }
    }

    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const pipeline = [
      { $match: filters },
      {
        $lookup: {
          from: 'orders',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                isPaid: true
              }
            },
            {
              $project: {
                totalPrice: 1,
                createdAt: 1
              }
            }
          ],
          as: 'orders'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.totalPrice'
              }
            }
          },
          lastOrderDate: { $max: '$orders.createdAt' }
        }
      },
      {
        $addFields: {
          totalSpent: { $ifNull: ['$totalSpent', 0] },
          averageOrderValue: {
            $cond: [
              { $gt: ['$orderCount', 0] },
              { $divide: ['$totalSpent', '$orderCount'] },
              0
            ]
          }
        }
      },
      {
        $project: {
          password: 0,
          __v: 0,
          orders: 0
        }
      },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit }
    ];

    const [users, total] = await Promise.all([
      User.aggregate(pipeline),
      User.countDocuments(filters)
    ]);

    const formattedUsers = users.map((user) => sanitizeUserDocument(user));

    const responsePayload = {
      success: true,
      data: formattedUsers,
      pagination: {
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        limit
      }
    };

    if (req.query.includeStats === 'true') {
      responsePayload.stats = await buildCustomerStats();
    }

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get aggregated customer stats for dashboard cards
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const stats = await buildCustomerStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get detailed customer profile with order insights
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const userId = objectIdOrNull(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    const user = await User.findById(userId).select('-password -__v').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [summary] = await Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
          totalSpent: {
            $sum: {
              $cond: ['$isPaid', '$totalPrice', 0]
            }
          },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    const statusBreakdown = await Order.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalPrice orderStatus createdAt isPaid')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUserDocument(user),
        metrics: {
          orderCount: summary?.orderCount || 0,
          paidOrders: summary?.paidOrders || 0,
          totalSpent: Number(summary?.totalSpent || 0),
          lastOrderDate: summary?.lastOrderDate || null,
          averageOrderValue: summary?.orderCount
            ? Number((summary.totalSpent || 0) / summary.orderCount)
            : 0,
          statusBreakdown: statusBreakdown.map((entry) => ({
            status: entry._id || 'unknown',
            count: entry.count
          }))
        },
        recentOrders: recentOrders.map((order) => {
          const { _id, ...rest } = order;
          return {
            ...rest,
            id: _id ? _id.toString() : undefined
          };
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update customer record
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const userId = objectIdOrNull(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    const allowedFields = ['name', 'email', 'phone', 'role', 'isActive', 'address'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeUserDocument(updatedUser),
      message: 'User updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle customer activation status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = objectIdOrNull(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    let isActive;

    if (typeof req.body.isActive === 'boolean') {
      isActive = req.body.isActive;
    } else if (typeof req.body.isActive === 'string') {
      const normalized = req.body.isActive.toLowerCase();
      if (['true', '1', 'active', 'yes'].includes(normalized)) {
        isActive = true;
      } else if (['false', '0', 'inactive', 'no'].includes(normalized)) {
        isActive = false;
      }
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeUserDocument(updatedUser),
      message: `User has been ${isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
