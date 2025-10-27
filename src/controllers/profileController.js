const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { getUserOrderMetrics } = require('../utils/orderMetrics');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const [user, orderMetrics] = await Promise.all([
      User.findById(req.user._id),
      getUserOrderMetrics(req.user._id)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const serializedUser = typeof user.toJSON === 'function'
      ? user.toJSON()
      : user;

    res.status(200).json({
      success: true,
      data: {
        ...serializedUser,
        orderMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile (includes address and avatar)
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const fieldsToUpdate = {};

    // Update basic fields if provided
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.email) fieldsToUpdate.email = req.body.email;
    if (req.body.phone) fieldsToUpdate.phone = req.body.phone;

    // Handle address if provided (parse JSON string from form-data)
    if (req.body.address) {
      try {
        const addressData = typeof req.body.address === 'string'
          ? JSON.parse(req.body.address)
          : req.body.address;

        fieldsToUpdate.address = {
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country
        };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address format. Please provide valid JSON.'
        });
      }
    }

    // Handle avatar/image update if file is provided
    if (req.file) {
      // Delete old avatar if exists
      const previousAvatar = user.image || user.avatar;
      if (previousAvatar) {
        const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(previousAvatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      // Set new avatar path
      const newAvatarPath = `/uploads/avatars/${req.file.filename}`;
      fieldsToUpdate.avatar = newAvatarPath;
      fieldsToUpdate.image = newAvatarPath;
    }

    // Update user with new data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    const orderMetrics = await getUserOrderMetrics(req.user._id);

    const serializedUser = typeof updatedUser.toJSON === 'function'
      ? updatedUser.toJSON()
      : updatedUser;

    res.status(200).json({
      success: true,
      data: {
        ...serializedUser,
        orderMetrics
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    // Delete uploaded file if database update fails
    if (req.file) {
      const uploadPath = path.join(process.cwd(), 'uploads', 'avatars', req.file.filename);
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
