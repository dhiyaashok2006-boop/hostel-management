const express = require('express');
const Room = require('../models/Room');
const Resident = require('../models/Resident');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET all rooms with filters
router.get('/', async (req, res) => {
  try {
    const { status, type, floor, block, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (floor) query.floor = parseInt(floor);
    if (block) query.block = block;
    if (search) query.roomNumber = new RegExp(search, 'i');
    const rooms = await Room.find(query).sort('roomNumber');
    res.json({ success: true, count: rooms.length, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    const residents = await Resident.find({ room: req.params.id, status: 'active' }).populate('user', 'name email phone');
    res.json({ success: true, room, residents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE room (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE room
router.put('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE room (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET room availability summary
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Room.countDocuments();
    const available = await Room.countDocuments({ status: 'available' });
    const occupied = await Room.countDocuments({ status: 'occupied' });
    const maintenance = await Room.countDocuments({ status: 'maintenance' });
    res.json({ success: true, stats: { total, available, occupied, maintenance, reserved: total - available - occupied - maintenance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
