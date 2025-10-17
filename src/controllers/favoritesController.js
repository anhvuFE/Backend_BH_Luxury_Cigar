const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get user's favorite products
// @route   GET /api/products/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      select: 'name brand price image inStock category specifications'
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      count: user.favorites.length,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add product to favorites
// @route   POST /api/products/:id/favorite
// @access  Private
exports.addToFavorites = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already in favorites
    if (user.favorites.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in favorites'
      });
    }

    // Add to favorites
    user.favorites.push(req.params.id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove product from favorites
// @route   DELETE /api/products/:id/favorite
// @access  Private
exports.removeFromFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is in favorites
    if (!user.favorites.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Product not in favorites'
      });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if product is in user's favorites
// @route   GET /api/products/:id/favorite
// @access  Private
exports.checkFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFavorite = user.favorites.includes(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        isFavorite
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};