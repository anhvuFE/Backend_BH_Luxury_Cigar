const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewProducts
} = require('../controllers/productController');

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Admin protected routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;