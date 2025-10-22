const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getMyOrdersTotal
} = require('../controllers/orderController');

// Protected routes (user)
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/myorders/total', protect, getMyOrdersTotal);
router.get('/stats', protect, admin, getOrderStats);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/cancel', protect, cancelOrder);

// Admin protected routes
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
