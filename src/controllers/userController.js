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
          totalSpent: {
            $sum: {
              $convert: {
                input: '$totalPrice',
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          }
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
        $addFields: {
          normalizedEmail: {
            $let: {
              vars: {
                trimmed: {
                  $trim: {
                    input: {
                      $ifNull: ['$email', '']
                    }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: '$$trimmed' }, 0] },
                  { $toLower: '$$trimmed' },
                  null
                ]
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: {
            userId: '$_id',
            normalizedEmail: '$normalizedEmail'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    // Match by user ObjectId
                    { $eq: ['$user', '$$userId'] },
                    // Match by user as string
                    { $eq: [{ $toString: '$user' }, { $toString: '$$userId' }] },
                    // Match by user field when it's already a string
                    {
                      $and: [
                        { $eq: [{ $type: '$user' }, 'string'] },
                        { $eq: ['$user', { $toString: '$$userId' }] }
                      ]
                    },
                    // Match by normalized email
                    {
                      $and: [
                        { $ne: ['$$normalizedEmail', null] },
                        {
                          $eq: [
                            {
                              $let: {
                                vars: {
                                  trimmedEmail: {
                                    $trim: {
                                      input: { $ifNull: ['$shippingAddress.email', ''] }
                                    }
                                  }
                                },
                                in: {
                                  $cond: [
                                    { $gt: [{ $strLenCP: '$$trimmedEmail' }, 0] },
                                    { $toLower: '$$trimmedEmail' },
                                    null
                                  ]
                                }
                              }
                            },
                            '$$normalizedEmail'
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                orderCount: { $sum: 1 },
                paidOrders: {
                  $sum: {
                    $cond: [{ $eq: ['$isPaid', true] }, 1, 0]
                  }
                },
                totalSpent: {
                  $sum: {
                    $convert: {
                      input: '$totalPrice',
                      to: 'double',
                      onError: 0,
                      onNull: 0
                    }
                  }
                },
                paidTotalSpent: {
                  $sum: {
                    $cond: [
                      { $eq: ['$isPaid', true] },
                      {
                        $convert: {
                          input: '$totalPrice',
                          to: 'double',
                          onError: 0,
                          onNull: 0
                        }
                      },
                      0
                    ]
                  }
                },
                lastOrderDate: { $max: '$createdAt' }
              }
            }
          ],
          as: 'orderStats'
        }
      },
      {
        $addFields: {
          orderStats: {
            $ifNull: [{ $arrayElemAt: ['$orderStats', 0] }, {}]
          }
        }
      },
      {
        $addFields: {
          orderCount: { $ifNull: ['$orderStats.orderCount', 0] },
          paidOrders: { $ifNull: ['$orderStats.paidOrders', 0] },
          totalSpent: { $ifNull: ['$orderStats.totalSpent', 0] },
          paidTotalSpent: { $ifNull: ['$orderStats.paidTotalSpent', 0] },
          lastOrderDate: { $ifNull: ['$orderStats.lastOrderDate', null] },
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
          orderStats: 0,
          normalizedEmail: 0
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

    await Promise.all(formattedUsers.map(async (user) => {
      if (!user || user.orderCount > 0) {
        return;
      }

      const matchConditions = [];
      const userObjectId = objectIdOrNull(user.id);

      if (userObjectId) {
        matchConditions.push({ user: userObjectId });
      }

      if (user?.id) {
        matchConditions.push({ user: user.id });
      }

      if (typeof user.email === 'string' && user.email.trim()) {
        matchConditions.push({
          'shippingAddress.email': {
            $regex: `^${escapeRegex(user.email.trim())}$`,
            $options: 'i'
          }
        });
      }

      if (typeof user.phone === 'string' && user.phone.trim()) {
        const digitsOnly = user.phone.replace(/\D+/g, '');

        if (digitsOnly) {
          const flexiblePattern = digitsOnly
            .split('')
            .map(escapeRegex)
            .join('\\D*');

          matchConditions.push({
            'shippingAddress.phone': {
              $regex: flexiblePattern,
              $options: 'i'
            }
          });
        }
      }

      if (matchConditions.length === 0) {
        return;
      }

      const fallbackOrders = await Order.find({ $or: matchConditions })
        .select('_id totalPrice isPaid createdAt')
        .lean();

      if (!fallbackOrders.length) {
        return;
      }

      let orderCount = 0;
      let paidOrders = 0;
      let totalSpent = 0;
      let paidTotalSpent = 0;
      let lastOrderDate = null;

      fallbackOrders.forEach((order) => {
        orderCount += 1;

        const totalPrice = Number(order.totalPrice) || 0;
        totalSpent += totalPrice;

        if (order.isPaid) {
          paidOrders += 1;
          paidTotalSpent += totalPrice;
        }

        const createdAt = order.createdAt ? new Date(order.createdAt) : null;
        if (createdAt && (!lastOrderDate || createdAt > lastOrderDate)) {
          lastOrderDate = createdAt;
        }
      });

      if (userObjectId) {
        const orderIdsNeedingUpdate = fallbackOrders
          .filter((order) => order?._id)
          .map((order) => order._id);

        if (orderIdsNeedingUpdate.length > 0) {
          await Order.updateMany(
            { _id: { $in: orderIdsNeedingUpdate } },
            { $set: { user: userObjectId } }
          );
        }
      }

      user.orderCount = orderCount;
      user.paidOrders = paidOrders;
      user.totalSpent = Number(totalSpent);
      user.paidTotalSpent = Number(paidTotalSpent);
      user.lastOrderDate = lastOrderDate || null;
      user.averageOrderValue = orderCount
        ? Number(totalSpent / orderCount)
        : 0;
    }));

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

// @desc    Get order summary for a user
// @route   GET /api/users/:id/orders/summary
// @access  Private/Admin
exports.getUserOrderSummary = async (req, res) => {
  try {
    const userId = objectIdOrNull(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    const user = await User.findById(userId).select('email phone').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userIdString = userId.toString();
    const normalizedEmail = typeof user.email === 'string'
      ? user.email.trim().toLowerCase() || null
      : null;
    let normalizedPhone = null;
    if (typeof user.phone === 'string') {
      const digitsOnly = user.phone.replace(/\D+/g, '');
      normalizedPhone = digitsOnly ? digitsOnly : null;
    }

    const matchExpressions = [
      {
        $eq: [
          {
            $cond: [
              { $eq: [{ $type: '$user' }, 'objectId'] },
              { $toString: '$user' },
              { $ifNull: ['$user', null] }
            ]
          },
          userIdString
        ]
      }
    ];

    if (normalizedEmail) {
      matchExpressions.push({
        $eq: [
          {
            $let: {
              vars: {
                trimmedEmail: {
                  $trim: {
                    input: { $ifNull: ['$shippingAddress.email', ''] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: '$$trimmedEmail' }, 0] },
                  { $toLower: '$$trimmedEmail' },
                  null
                ]
              }
            }
          },
          normalizedEmail
        ]
      });
    }

    // Phone matching will be handled in fallback logic instead of aggregation
    // to avoid MongoDB version compatibility issues with $regexReplace

    const [aggregation] = await Order.aggregate([
      {
        $match: {
          $expr: {
            $or: matchExpressions
          }
        }
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $convert: {
                input: '$totalPrice',
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      }
    ]);

    let summaryData = {
      orderCount: aggregation?.orderCount || 0,
      totalSpent: Number(aggregation?.totalSpent || 0)
    };

    if (summaryData.orderCount === 0) {
      const fallbackConditions = [];

      fallbackConditions.push({ user: userId });
      fallbackConditions.push({ user: userIdString });

      if (typeof user.email === 'string' && user.email.trim()) {
        fallbackConditions.push({
          'shippingAddress.email': {
            $regex: `^${escapeRegex(user.email.trim())}$`,
            $options: 'i'
          }
        });
      }

      if (typeof user.phone === 'string' && user.phone.trim()) {
        const digitsOnlyPhone = user.phone.replace(/\D+/g, '');
        if (digitsOnlyPhone) {
          const phonePattern = digitsOnlyPhone
            .split('')
            .map(escapeRegex)
            .join('\\D*');

          fallbackConditions.push({
            'shippingAddress.phone': {
              $regex: phonePattern,
              $options: 'i'
            }
          });
        }
      }

      const fallbackOrders = fallbackConditions.length
        ? await Order.find({ $or: fallbackConditions }).select('_id totalPrice isPaid').lean()
        : [];

      if (fallbackOrders.length > 0) {
        let fallbackOrderCount = 0;
        let fallbackTotalSpent = 0;

        fallbackOrders.forEach((order) => {
          fallbackOrderCount += 1;
          fallbackTotalSpent += Number(order.totalPrice) || 0;
        });

        summaryData = {
          orderCount: fallbackOrderCount,
          totalSpent: fallbackTotalSpent
        };

        const orderIdsToUpdate = fallbackOrders
          .filter((order) => order?._id)
          .map((order) => order._id);

        if (orderIdsToUpdate.length > 0) {
          await Order.updateMany(
            { _id: { $in: orderIdsToUpdate } },
            { $set: { user: userId } }
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      data: summaryData
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

    const userIdString = userId.toString();
    const normalizedEmail = typeof user.email === 'string'
      ? user.email.trim().toLowerCase() || null
      : null;
    let normalizedPhone = null;
    if (typeof user.phone === 'string') {
      const digitsOnly = user.phone.replace(/\D+/g, '');
      normalizedPhone = digitsOnly ? digitsOnly : null;
    }

    const orderMatchOrConditions = [
      // Match by user ObjectId or string representation
      {
        $eq: [
          {
            $cond: [
              { $eq: [{ $type: '$user' }, 'objectId'] },
              { $toString: '$user' },
              { $ifNull: ['$user', null] }
            ]
          },
          userIdString
        ]
      }
    ];

    if (normalizedEmail) {
      orderMatchOrConditions.push({
        $eq: [
          {
            $let: {
              vars: {
                trimmedEmail: {
                  $trim: {
                    input: { $ifNull: ['$shippingAddress.email', ''] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: '$$trimmedEmail' }, 0] },
                  { $toLower: '$$trimmedEmail' },
                  null
                ]
              }
            }
          },
          normalizedEmail
        ]
      });
    }

    if (normalizedPhone) {
      orderMatchOrConditions.push({
        $eq: [
          {
            $let: {
              vars: {
                digits: {
                  $regexReplace: {
                    input: { $ifNull: ['$shippingAddress.phone', ''] },
                    regex: '[^0-9]',
                    replacement: ''
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: '$$digits' }, 0] },
                  '$$digits',
                  null
                ]
              }
            }
          },
          normalizedPhone
        ]
      });
    }

    const orderMatchExpression = {
      $expr: {
        $or: orderMatchOrConditions
      }
    };

    const [summary] = await Order.aggregate([
      { $match: orderMatchExpression },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                1,
                0
              ]
            }
          },
          totalSpent: {
            $sum: {
              $convert: {
                input: '$totalPrice',
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          },
          paidTotalSpent: {
            $sum: {
              $cond: [
                { $eq: ['$isPaid', true] },
                {
                  $convert: {
                    input: '$totalPrice',
                    to: 'double',
                    onError: 0,
                    onNull: 0
                  }
                },
                0
              ]
            }
          },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    const statusBreakdown = await Order.aggregate([
      { $match: orderMatchExpression },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentOrders = await Order.find(orderMatchExpression)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalPrice orderStatus createdAt isPaid')
      .lean();

    let metricsSummary = {
      orderCount: summary?.orderCount || 0,
      paidOrders: summary?.paidOrders || 0,
      totalSpent: Number(summary?.totalSpent || 0),
      paidTotalSpent: Number(summary?.paidTotalSpent || 0),
      lastOrderDate: summary?.lastOrderDate || null
    };

    let statusBreakdownFormatted = statusBreakdown.map((entry) => ({
      status: entry._id || 'unknown',
      count: entry.count
    }));

    let recentOrdersList = recentOrders.map((order) => {
      const { _id, ...rest } = order;
      return {
        ...rest,
        id: _id ? _id.toString() : undefined
      };
    });

    if (metricsSummary.orderCount === 0) {
      const fallbackConditions = [
        { user: userId },
        { user: userIdString }
      ];

      if (typeof user.email === 'string' && user.email.trim()) {
        fallbackConditions.push({
          'shippingAddress.email': {
            $regex: `^${escapeRegex(user.email.trim())}$`,
            $options: 'i'
          }
        });
      }

      if (typeof user.phone === 'string' && user.phone.trim()) {
        const digitsOnlyPhone = user.phone.replace(/\D+/g, '');
        if (digitsOnlyPhone) {
          const phonePattern = digitsOnlyPhone
            .split('')
            .map(escapeRegex)
            .join('\\D*');

          fallbackConditions.push({
            'shippingAddress.phone': {
              $regex: phonePattern,
              $options: 'i'
            }
          });
        }
      }

      const fallbackOrders = await Order.find({ $or: fallbackConditions })
        .select('_id orderNumber totalPrice orderStatus createdAt isPaid')
        .lean();

      if (fallbackOrders.length > 0) {
        let fallbackOrderCount = 0;
        let fallbackPaidOrders = 0;
        let fallbackTotalSpent = 0;
        let fallbackPaidTotalSpent = 0;
        let fallbackLastOrderDate = null;
        const fallbackStatus = new Map();

        fallbackOrders.forEach((order) => {
          fallbackOrderCount += 1;

          const totalPrice = Number(order.totalPrice) || 0;
          fallbackTotalSpent += totalPrice;

          if (order.isPaid) {
            fallbackPaidOrders += 1;
            fallbackPaidTotalSpent += totalPrice;
          }

          const createdAt = order.createdAt ? new Date(order.createdAt) : null;
          if (createdAt && (!fallbackLastOrderDate || createdAt > fallbackLastOrderDate)) {
            fallbackLastOrderDate = createdAt;
          }

          const statusKey = order.orderStatus || 'unknown';
          fallbackStatus.set(statusKey, (fallbackStatus.get(statusKey) || 0) + 1);
        });

        metricsSummary = {
          orderCount: fallbackOrderCount,
          paidOrders: fallbackPaidOrders,
          totalSpent: Number(fallbackTotalSpent || 0),
          paidTotalSpent: Number(fallbackPaidTotalSpent || 0),
          lastOrderDate: fallbackLastOrderDate || null
        };

        statusBreakdownFormatted = Array.from(fallbackStatus.entries()).map(([status, count]) => ({
          status,
          count
        }));

        recentOrdersList = fallbackOrders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map((order) => ({
            orderNumber: order.orderNumber,
            totalPrice: order.totalPrice,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
            isPaid: order.isPaid,
            id: order._id ? order._id.toString() : undefined
          }));

        const ordersToUpdate = fallbackOrders
          .filter((order) => order?._id)
          .map((order) => order._id);

        if (ordersToUpdate.length > 0) {
          await Order.updateMany(
            { _id: { $in: ordersToUpdate } },
            { $set: { user: userId } }
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUserDocument(user),
        metrics: {
          orderCount: metricsSummary.orderCount,
          paidOrders: metricsSummary.paidOrders,
          totalSpent: Number(metricsSummary.totalSpent || 0),
          paidTotalSpent: Number(metricsSummary.paidTotalSpent || 0),
          lastOrderDate: metricsSummary.lastOrderDate || null,
          averageOrderValue: metricsSummary.orderCount
            ? Number(metricsSummary.totalSpent / metricsSummary.orderCount)
            : 0,
          statusBreakdown: statusBreakdownFormatted
        },
        recentOrders: recentOrdersList
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
