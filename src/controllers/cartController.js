const Product = require('../models/Product');

// @desc    Get cart items
// @route   GET /api/cart
// @access  Public
exports.getCart = async (req, res) => {
  try {
    const cart = req.session.cart || [];

    // Calculate totals
    const itemsPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      success: true,
      count: cart.length,
      totalItems,
      itemsPrice,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Public
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    // Initialize cart if not exists
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if item already exists in cart
    const existingItemIndex = req.session.cart.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      req.session.cart[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item to cart
      const cartItem = {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        quantity: parseInt(quantity),
        addedAt: new Date()
      };
      req.session.cart.push(cartItem);
    }

    // Calculate totals
    const itemsPrice = req.session.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = req.session.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      count: req.session.cart.length,
      totalItems,
      itemsPrice,
      data: req.session.cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Public
exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (!req.session.cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const itemIndex = req.session.cart.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    req.session.cart[itemIndex].quantity = parseInt(quantity);

    // Calculate totals
    const itemsPrice = req.session.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = req.session.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      count: req.session.cart.length,
      totalItems,
      itemsPrice,
      data: req.session.cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Public
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.session.cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const itemIndex = req.session.cart.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    req.session.cart.splice(itemIndex, 1);

    // Calculate totals
    const itemsPrice = req.session.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = req.session.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      count: req.session.cart.length,
      totalItems,
      itemsPrice,
      data: req.session.cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Public
exports.clearCart = async (req, res) => {
  try {
    req.session.cart = [];

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      count: 0,
      totalItems: 0,
      itemsPrice: 0,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};