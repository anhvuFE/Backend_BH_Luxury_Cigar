const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getDashboardStats,
  getRevenueAnalytics,
  getTopProducts,
  getCustomerAnalytics,
  getSalesByRegion,
  getInventoryAnalytics,
  exportAnalytics
} = require('../controllers/analyticsController');

// All analytics routes require admin authentication
router.use(protect, admin);

// Dashboard and reports
router.get('/dashboard', getDashboardStats);
router.get('/sales', getRevenueAnalytics); // Updated to match frontend endpoint
router.get('/top-products', getTopProducts);
router.get('/customers', getCustomerAnalytics);
router.get('/sales-by-region', getSalesByRegion);
router.get('/inventory', getInventoryAnalytics);
router.get('/export', exportAnalytics);

module.exports = router;
