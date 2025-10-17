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

const {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite
} = require('../controllers/favoritesController');

// Public routes
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);

/**
 * @swagger
 * /api/products/favorites:
 *   get:
 *     summary: Get user's favorite products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 */
router.get('/favorites', protect, getFavorites); // Must be before /:id

router.get('/', getAllProducts);
router.get('/:id', getProduct);

/**
 * @swagger
 * /api/products/{id}/favorite:
 *   get:
 *     summary: Check if product is in user's favorites
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Favorite status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isFavorite:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:id/favorite', protect, checkFavorite);

/**
 * @swagger
 * /api/products/{id}/favorite:
 *   post:
 *     summary: Add product to favorites
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product added to favorites"
 *       400:
 *         description: Product already in favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or user not found
 */
router.post('/:id/favorite', protect, addToFavorites);

/**
 * @swagger
 * /api/products/{id}/favorite:
 *   delete:
 *     summary: Remove product from favorites
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product removed from favorites"
 *       400:
 *         description: Product not in favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/:id/favorite', protect, removeFromFavorites);

// Admin protected routes
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;