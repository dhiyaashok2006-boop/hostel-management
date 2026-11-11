const express = require('express');
const Invoice = require('../models/Invoice');
const Resident = require('../models/Resident');
const Notification = require('../models/Notification');
const { sendInvoiceNotification } = require('../services/emailService');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (req.user.role === 'resident') query.resident = req.user._id;
    if (status) query.status = status;
    const invoices = await Invoice.find(query)
      .populate('resident', 'name email phone')
      .sort('-createdAt');
    res.json({ success: true, count: invoices.length, invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('resident', 'name email phone');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE invoice (admin/staff)
router.post('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    // Notify resident
    const user = await require('../models/User').findById(invoice.resident);
    if (user) {
      await Notification.create({
        recipient: invoice.resident,
        title: 'New Invoice',
        message: `Invoice ${invoice.invoiceNumber} of ₹${invoice.totalAmount} has been generated. Due: ${new Date(invoice.dueDate).toLocaleDateString()}`,
        type: 'billing',
        link: '/billing'
      });
      await sendInvoiceNotification(user.email, user.name, invoice.invoiceNumber, invoice.totalAmount, invoice.dueDate);
    }
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE invoice
router.put('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// RECORD payment (cash/manual)
router.post('/:id/payment', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('resident', 'name email');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const { amount, method, transactionId, notes } = req.body;
    invoice.payments.push({ amount, method: method || 'cash', transactionId, notes, paidAt: new Date() });
    invoice.amountPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    if (invoice.amountPaid >= invoice.totalAmount) invoice.status = 'paid';
    else if (invoice.amountPaid > 0) invoice.status = 'partial';
    await invoice.save();

    await Notification.create({
      recipient: invoice.resident._id,
      title: 'Payment Received',
      message: `Payment of ₹${amount} received for invoice ${invoice.invoiceNumber}.`,
      type: 'billing',
      link: '/billing'
    });
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Razorpay: Create order
router.post('/:id/razorpay/order', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('your_key')) {
      // Return mock order for demo
      return res.json({ success: true, order: { id: 'order_demo_' + Date.now(), amount: invoice.totalAmount * 100, currency: 'INR' }, key: 'rzp_test_demo' });
    }
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({ amount: Math.round(invoice.totalAmount * 100), currency: 'INR', receipt: invoice.invoiceNumber });
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Razorpay: Verify payment
router.post('/:id/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
    const invoice = await Invoice.findById(req.params.id).populate('resident', 'name email');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('your')) {
      const crypto = require('crypto');
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
      if (expected !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
    }

    invoice.payments.push({ amount: amount / 100, method: 'razorpay', razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, paidAt: new Date() });
    invoice.amountPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    if (invoice.amountPaid >= invoice.totalAmount) invoice.status = 'paid';
    await invoice.save();

    await Notification.create({
      recipient: invoice.resident._id,
      title: 'Payment Successful',
      message: `Online payment of ₹${amount / 100} received for invoice ${invoice.invoiceNumber}.`,
      type: 'billing',
      link: '/billing'
    });
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE invoice
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
