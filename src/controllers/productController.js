const Product = require('../models/Product');
const User = require('../models/User');


// @desc    Get all products with pagination
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      inStock,
      isFeatured,
      isNew,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 9
    } = req.query;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (inStock !== undefined) query.inStock = inStock === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (isNew !== undefined) query.isNew = isNew === 'true';

    // Price range filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sortBy = {};
    if (sort === 'price') sortBy.price = 1;
    else if (sort === '-price') sortBy.price = -1;
    else if (sort === 'name') sortBy.name = 1;
    else sortBy.createdAt = -1;

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitNumber);

    // Get products with pagination
    const products = await Product
      .find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limitNumber);

    // Pagination info
    const pagination = {
      current: pageNumber,
      total: totalPages,
      hasNext: pageNumber < totalPages,
      hasPrev: pageNumber > 1,
      next: pageNumber < totalPages ? pageNumber + 1 : null,
      prev: pageNumber > 1 ? pageNumber - 1 : null
    };

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      pagination,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product
      .find({ isFeatured: true, inStock: true })
      .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get new arrivals
// @route   GET /api/products/new
// @access  Public
exports.getNewProducts = async (req, res) => {
  try {
    const products = await Product
      .find({ isNew: true, inStock: true })
      .sort('-createdAt')
      .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};