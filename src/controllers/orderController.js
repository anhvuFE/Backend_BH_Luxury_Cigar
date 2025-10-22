const Order = require('../models/Order');
const Product = require('../models/Product');

const resolveProductIdFromItem = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const visited = new Set();
  const queue = [];

  const enqueue = (value) => {
    if (value !== null && value !== undefined) {
      queue.push(value);
    }
  };

  enqueue(item.product);
  enqueue(item.productId);
  enqueue(item.product_id);
  enqueue(item.productID);
  enqueue(item._id);
  enqueue(item.id);

  while (queue.length > 0) {
    const candidate = queue.shift();

    if (candidate === null || candidate === undefined) {
      continue;
    }

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && trimmed.toLowerCase() !== 'undefined') {
        return trimmed;
      }
      continue;
    }

    if (typeof candidate === 'number') {
      return candidate.toString();
    }

    if (typeof candidate === 'object') {
      if (visited.has(candidate)) {
        continue;
      }
      visited.add(candidate);

      if (candidate instanceof Date) {
        continue;
      }

      if (typeof candidate.toString === 'function') {
        const objectString = candidate.toString();
        if (objectString && objectString !== '[object Object]' && objectString.toLowerCase() !== 'undefined') {
          return objectString;
        }
      }

      enqueue(candidate.product);
      enqueue(candidate.productId);
      enqueue(candidate.product_id);
      enqueue(candidate.productID);
      enqueue(candidate._id);
      enqueue(candidate.id);
    }
  }

  return null;
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items'
      });
    }

    const normalizedItems = [];

    // Verify products exist, normalize payload, and ensure stock
    for (const item of items) {
      let productId = resolveProductIdFromItem(item);
      let product;
      let missingIdentifier = false;

      if (productId) {
        product = await Product.findById(productId);
      } else if (item && item.name) {
        product = await Product.findOne({ name: item.name });
        if (product) {
          productId = product._id;
        } else {
          missingIdentifier = true;
        }
      } else {
        missingIdentifier = true;
      }

      if (missingIdentifier) {
        return res.status(400).json({
          success: false,
          message: 'Order item is missing product identifier'
        });
      }

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${productId} not found`
        });
      }

      if (!product.inStock) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is out of stock`
        });
      }

      const parsedQuantity = parseInt(item.quantity, 10);
      const quantity = Number.isFinite(parsedQuantity) ? parsedQuantity : 1;
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Quantity for product ${product.name} must be at least 1`
        });
      }

      const parsedPrice = typeof item.price === 'number'
        ? item.price
        : parseFloat(item.price);
      const price = Number.isFinite(parsedPrice) ? parsedPrice : product.price;

      normalizedItems.push({
        product: product._id,
        name: item.name || product.name,
        price,
        quantity,
        image: item.image || product.image
      });
    }

    const calculatedItemsPrice = normalizedItems.reduce((acc, item) => (
      acc + (item.price * item.quantity)
    ), 0);

    const normalizedTaxPrice = typeof taxPrice === 'number' ? taxPrice : 0;
    const normalizedShippingPrice = typeof shippingPrice === 'number' ? shippingPrice : 0;
    const normalizedTotalPrice = typeof totalPrice === 'number'
      ? totalPrice
      : calculatedItemsPrice + normalizedTaxPrice + normalizedShippingPrice;

    const order = await Order.create({
      user: req.user._id,
      items: normalizedItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: typeof itemsPrice === 'number' ? itemsPrice : calculatedItemsPrice,
      taxPrice: normalizedTaxPrice,
      shippingPrice: normalizedShippingPrice,
      totalPrice: normalizedTotalPrice
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order
      .find({ user: req.user._id })
      .populate('items.product', 'name price image')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get total spent and items for logged in user
// @route   GET /api/orders/myorders/total
// @access  Private
exports.getMyOrdersTotal = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).select('items totalPrice');

    const summary = orders.reduce((acc, order) => {
      const orderTotal = typeof order.totalPrice === 'number' ? order.totalPrice : 0;
      const orderItems = Array.isArray(order.items) ? order.items : [];

      acc.totalOrders += 1;
      acc.totalSpent += orderTotal;
      acc.totalItems += orderItems.reduce((itemAcc, item) => {
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity, 10) || 0;
        return itemAcc + quantity;
      }, 0);

      return acc;
    }, {
      totalOrders: 0,
      totalItems: 0,
      totalSpent: 0
    });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status if provided
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    const total = await Order.countDocuments(query);

    const orders = await Order
      .find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order
      .findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price image brand');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to update this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.updateTime,
      email_address: req.body.emailAddress
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to cancel this order
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered'
      });
    }

    order.orderStatus = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancellationReason = req.body.reason || 'Customer requested cancellation';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order statistics (admin only)
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });

    const revenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: revenue.length > 0 ? revenue[0].total : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
