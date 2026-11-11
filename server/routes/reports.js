const express = require('express');
const Invoice = require('../models/Invoice');
const Room = require('../models/Room');
const Resident = require('../models/Resident');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect, authorize('admin', 'staff'));

// Financial overview
router.get('/financial', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const monthlyRevenue = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0);
      const invoices = await Invoice.find({ status: 'paid', updatedAt: { $gte: start, $lte: end } });
      const revenue = invoices.reduce((s, inv) => s + inv.amountPaid, 0);
      monthlyRevenue.push({ month: start.toLocaleString('default', { month: 'short' }), revenue, count: invoices.length });
    }
    const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
    const pendingAmount = await Invoice.aggregate([
      { $match: { status: { $in: ['pending', 'overdue', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$amountPaid'] } } } }
    ]);
    res.json({ success: true, data: { monthlyRevenue, totalRevenue, pendingAmount: pendingAmount[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Occupancy report
router.get('/occupancy', async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    const totalResidents = await Resident.countDocuments({ status: 'active' });
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // By type
    const byType = await Room.aggregate([
      { $group: { _id: '$type', total: { $sum: 1 }, occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } } } }
    ]);

    res.json({ success: true, data: { totalRooms, occupiedRooms, availableRooms, maintenanceRooms, totalResidents, occupancyRate, byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Invoice status breakdown
router.get('/invoices', async (req, res) => {
  try {
    const breakdown = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' }, paid: { $sum: '$amountPaid' } } }
    ]);
    const recentInvoices = await Invoice.find().populate('resident', 'name').sort('-createdAt').limit(10);
    res.json({ success: true, data: { breakdown, recentInvoices } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Maintenance stats
router.get('/maintenance', async (req, res) => {
  try {
    const byStatus = await MaintenanceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byPriority = await MaintenanceRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const byCategory = await MaintenanceRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { byStatus, byPriority, byCategory } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const [totalRooms, availableRooms, totalResidents, pendingMaintenance, totalRevenue, pendingInvoices] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Resident.countDocuments({ status: 'active' }),
      MaintenanceRequest.countDocuments({ status: { $in: ['pending', 'assigned'] } }),
      Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      Invoice.countDocuments({ status: { $in: ['pending', 'overdue'] } })
    ]);
    res.json({
      success: true, data: {
        totalRooms,
        availableRooms,
        occupiedRooms: totalRooms - availableRooms,
        totalResidents,
        pendingMaintenance,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingInvoices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
