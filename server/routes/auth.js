const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resident = require('../models/Resident');
const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '30d' });

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    // Only allow admin/staff registration through admin panel
    const userRole = role === 'admin' || role === 'staff' ? 'resident' : (role || 'resident');
    const user = await User.create({ name, email, password, phone, role: userRole });
    if (userRole === 'resident') {
      await Resident.create({ user: user._id, status: 'pending' });
    }
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);
    const userObj = user.toJSON();
    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/admin-create (create admin/staff users)
router.post('/admin-create', require('../middleware/auth').protect, require('../middleware/auth').authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, role: role || 'staff' });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
