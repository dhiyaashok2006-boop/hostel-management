const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET all users (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const users = await User.find(query).sort('-createdAt');
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single user
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE user
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { name, phone, avatar } = req.body;
    const updateData = { name, phone, avatar };
    if (req.user.role === 'admin' && req.body.role) updateData.role = req.body.role;
    if (req.user.role === 'admin' && req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
