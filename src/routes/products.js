const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewProducts,
  uploadProductImageHandler
} = require('../controllers/productController');

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);

router.get('/', getAllProducts);
router.get('/:id', getProduct);


// Admin protected routes
router.post('/upload', protect, admin, uploadProductImage.single('image'), uploadProductImageHandler);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
