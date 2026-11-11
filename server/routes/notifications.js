const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET user notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// MARK notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// MARK all as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
