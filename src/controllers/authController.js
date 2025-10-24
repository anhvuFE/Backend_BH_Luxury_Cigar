const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user);

    // Create user object with proper id format
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Create user object with proper id format
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (!req.body.newPassword || req.body.newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email'
      });
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const textContent = [
      `Hi ${user.name || 'there'},`,
      '',
      'You requested a password reset for your BH Luxury Cigar account.',
      'Please use the link below to set a new password:',
      resetURL,
      '',
      'If you did not make this request, you can safely ignore this email.'
    ].join('\n');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt Lại Mật Khẩu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #d97706; margin: 0;">BH Luxury Cigar</h1>
        <p style="color: #666; margin: 5px 0;">Premium Cigar Experience</p>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; border-left: 4px solid #d97706;">

        <h2 style="color: #333; margin-top: 0;">Xin chào ${user.name || 'bạn'}!</h2>

        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}"
               style="background: #d97706;
                      color: white;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 5px;
                      display: inline-block;
                      font-weight: bold;">
                Đặt Lại Mật Khẩu
            </a>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
                <strong>Lưu ý:</strong> Liên kết này sẽ hết hạn sau 10 phút.
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
            </p>
        </div>

        <p style="font-size: 14px; color: #666;">
            Nếu button không hoạt động, copy link này: <br>
            <a href="${resetURL}" style="color: #d97706; word-break: break-all;">${resetURL}</a>
        </p>

    </div>

    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
        <p>BH Luxury Cigar<br>
        Email: support@bhluxurycigar.com | Hotline: 0975 224 557</p>
    </div>

</body>
</html>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'BH Luxury Cigar Password Reset',
        text: textContent,
        html: htmlContent
      });
    } catch (mailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      if (mailError.message === 'SMTP credentials are not configured') {
        return res.status(500).json({
          success: false,
          message: 'Email service is not configured. Please contact support.'
        });
      }

      throw mailError;
    }

    res.status(200).json({
      success: true,
      message: 'Email sent with password reset instructions'
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again later.'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token, email and password'
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and email
    const user = await User.findOne({
      email: email,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get all users (admin only) with filtering and pagination
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      role,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.isActive = status === 'active';
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get customer statistics for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const Order = require('../models/Order');
      const orders = await Order.find({ user: user._id });
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      return {
        ...user.toObject(),
        totalOrders,
        totalSpent
      };
    }));

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: usersWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's order history
    const Order = require('../models/Order');
    const orders = await Order.find({ user: user._id })
      .sort('-createdAt')
      .limit(10);

    const totalOrders = await Order.countDocuments({ user: user._id });
    const totalSpent = await Order.aggregate([
      { $match: { user: user._id, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        recentOrders: orders,
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      role: req.body.role,
      isActive: req.body.isActive
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer statistics (admin only)
// @route   GET /api/auth/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const inactiveUsers = await User.countDocuments({ role: 'user', isActive: false });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newUsersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: thisMonth }
    });

    // Get top customers by spending
    const Order = require('../models/Order');
    const topCustomers = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalSpent: 1,
          orderCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
