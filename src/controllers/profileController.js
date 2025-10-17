const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

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

    // Handle avatar update if file is provided
    if (req.file) {
      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      // Set new avatar path
      fieldsToUpdate.avatar = `/uploads/avatars/${req.file.filename}`;
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

    res.status(200).json({
      success: true,
      data: updatedUser,
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


