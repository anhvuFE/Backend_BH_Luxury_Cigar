const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAllBlogs,
  getBlog,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getRecentBlogs
} = require('../controllers/blogController');

// Public routes
router.get('/featured', getFeaturedBlogs);
router.get('/recent', getRecentBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/', getAllBlogs);
router.get('/:id', getBlog);

// Admin protected routes
router.post('/', protect, admin, createBlog);
router.put('/:id', protect, admin, updateBlog);
router.delete('/:id', protect, admin, deleteBlog);

module.exports = router;