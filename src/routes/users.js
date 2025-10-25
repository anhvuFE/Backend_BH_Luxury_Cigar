const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getUsers,
  getUserStats,
  getUserById,
  updateUser,
  updateUserStatus
} = require('../controllers/userController');

router.use(protect);
router.use(admin);

router.get('/stats', getUserStats);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
module.exports = router;
