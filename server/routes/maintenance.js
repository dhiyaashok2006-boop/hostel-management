const express = require('express');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Notification = require('../models/Notification');
const { sendMaintenanceUpdate } = require('../services/emailService');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET all requests (admin/staff see all; resident sees own)
router.get('/', async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = {};
    if (req.user.role === 'resident') query.resident = req.user._id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    const requests = await MaintenanceRequest.find(query)
      .populate('resident', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single request
router.get('/:id', async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('resident', 'name email phone')
      .populate('assignedTo', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE request (resident)
router.post('/', async (req, res) => {
  try {
    const request = await MaintenanceRequest.create({ ...req.body, resident: req.user._id });
    // Notify admins/staff
    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE request (admin/staff)
router.put('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status, assignedTo, resolutionNote, estimatedCompletion } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id).populate('resident', 'name email');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (status) request.status = status;
    if (assignedTo) request.assignedTo = assignedTo;
    if (resolutionNote) request.resolutionNote = resolutionNote;
    if (estimatedCompletion) request.estimatedCompletion = estimatedCompletion;
    if (status === 'resolved') request.resolvedAt = new Date();
    await request.save();

    // Notify resident
    if (status && request.resident) {
      await Notification.create({
        recipient: request.resident._id,
        title: 'Maintenance Update',
        message: `Your maintenance request "${request.title}" is now ${status}.`,
        type: 'maintenance',
        link: '/maintenance'
      });
      await sendMaintenanceUpdate(request.resident.email, request.resident.name, request.title, status);
    }
    res.json({ success: true, request });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE request (admin)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stats
router.get('/stats/summary', authorize('admin', 'staff'), async (req, res) => {
  try {
    const total = await MaintenanceRequest.countDocuments();
    const pending = await MaintenanceRequest.countDocuments({ status: 'pending' });
    const inProgress = await MaintenanceRequest.countDocuments({ status: 'in-progress' });
    const resolved = await MaintenanceRequest.countDocuments({ status: 'resolved' });
    const urgent = await MaintenanceRequest.countDocuments({ priority: 'urgent', status: { $nin: ['resolved', 'closed'] } });
    res.json({ success: true, stats: { total, pending, inProgress, resolved, urgent } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
