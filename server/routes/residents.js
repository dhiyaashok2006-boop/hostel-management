const express = require('express');
const Resident = require('../models/Resident');
const Room = require('../models/Room');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET all residents (admin/staff)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;
    let residents = await Resident.find(query)
      .populate('user', 'name email phone avatar')
      .populate('room', 'roomNumber floor type')
      .sort('-createdAt');
    if (search) {
      residents = residents.filter(r =>
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.roomNumber?.includes(search)
      );
    }
    res.json({ success: true, count: residents.length, residents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET own resident profile
router.get('/me', async (req, res) => {
  try {
    const resident = await Resident.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar')
      .populate('room', 'roomNumber floor type pricePerMonth amenities');
    if (!resident) return res.status(404).json({ success: false, message: 'Resident profile not found' });
    res.json({ success: true, resident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single resident
router.get('/:id', async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate('user', 'name email phone avatar')
      .populate('room', 'roomNumber floor type pricePerMonth');
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });
    res.json({ success: true, resident });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE resident profile
router.put('/:id', async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('user', 'name email phone')
      .populate('room', 'roomNumber');
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });
    res.json({ success: true, resident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ASSIGN room to resident (check-in)
router.post('/checkin', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { residentId, roomId, checkInDate, monthlyRent, securityDeposit } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.status === 'occupied' && room.currentOccupants >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is fully occupied' });
    }
    const resident = await Resident.findByIdAndUpdate(residentId, {
      room: roomId,
      roomNumber: room.roomNumber,
      checkInDate: checkInDate || new Date(),
      status: 'active',
      monthlyRent: monthlyRent || room.pricePerMonth,
      securityDeposit: securityDeposit || 0
    }, { new: true }).populate('user', 'name email');

    room.currentOccupants += 1;
    if (room.currentOccupants >= room.capacity) room.status = 'occupied';
    await room.save();

    // Create notification
    await Notification.create({
      recipient: resident.user._id,
      title: 'Room Assigned',
      message: `You have been assigned to Room ${room.roomNumber}. Welcome!`,
      type: 'room',
      link: '/my-room'
    });

    res.json({ success: true, resident, room });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// CHECKOUT resident
router.post('/checkout/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id).populate('room');
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });
    if (resident.room) {
      const room = await Room.findById(resident.room._id);
      if (room) {
        room.currentOccupants = Math.max(0, room.currentOccupants - 1);
        if (room.currentOccupants === 0) room.status = 'available';
        await room.save();
      }
    }
    resident.checkOutDate = req.body.checkOutDate || new Date();
    resident.status = 'checked-out';
    resident.room = undefined;
    resident.roomNumber = undefined;
    await resident.save();

    await Notification.create({
      recipient: resident.user,
      title: 'Check-Out Processed',
      message: `Your check-out has been processed. Thank you for staying with us!`,
      type: 'room'
    });

    res.json({ success: true, resident });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
