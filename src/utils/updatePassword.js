const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const updatePasswords = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bh_luxury_cigar');
    console.log('Connected to MongoDB');

    // Hash new password
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update all users
    const result = await User.updateMany(
      {}, // Update all users
      { $set: { password: hashedPassword } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} users with new password: ${newPassword}`);

    // List all users
    const users = await User.find().select('name email role');
    console.log('\nUpdated users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Password: ${newPassword}`);
    });

    console.log('\n✅ All passwords updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
};

updatePasswords();