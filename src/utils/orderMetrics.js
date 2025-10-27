const mongoose = require('mongoose');
const Order = require('../models/Order');

const normalizeObjectId = (value) => {
  if (!value) return null;

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return null;
};

/**
 * Returns order statistics for a given user.
 * Total spent only counts paid orders to avoid inflating spend with pending carts.
 */
const getUserOrderMetrics = async (userId) => {
  const normalizedUserId = normalizeObjectId(userId);

  if (!normalizedUserId) {
    return {
      orderCount: 0,
      paidOrders: 0,
      totalSpent: 0,
      paidTotalSpent: 0,
      lastOrderDate: null
    };
  }

  const [summary] = await Order.aggregate([
    { $match: { user: normalizedUserId } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        paidOrders: { $sum: { $cond: ['$isPaid', 1, 0] } },
        totalSpent: { $sum: '$totalPrice' },
        paidTotalSpent: {
          $sum: { $cond: ['$isPaid', '$totalPrice', 0] }
        },
        lastOrderDate: { $max: '$createdAt' }
      }
    }
  ]);

  return {
    orderCount: summary?.orderCount || 0,
    paidOrders: summary?.paidOrders || 0,
    totalSpent: Number(summary?.totalSpent || 0),
    paidTotalSpent: Number(summary?.paidTotalSpent || 0),
    lastOrderDate: summary?.lastOrderDate || null
  };
};

module.exports = {
  getUserOrderMetrics
};
