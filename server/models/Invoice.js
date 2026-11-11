const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  residentProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  roomNumber: { type: String },
  billingMonth: { type: String }, // e.g., "2024-01"
  billingPeriod: {
    from: { type: Date },
    to: { type: Date }
  },
  items: [{
    description: { type: String },
    amount: { type: Number },
    type: { type: String, enum: ['rent', 'electricity', 'water', 'internet', 'laundry', 'mess', 'late-fee', 'other'] }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountReason: { type: String },
  lateFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'partial', 'cancelled'], default: 'pending' },
  payments: [{
    amount: { type: Number },
    method: { type: String, enum: ['cash', 'upi', 'card', 'bank-transfer', 'razorpay'] },
    transactionId: { type: String },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  amountPaid: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

invoiceSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = 'INV-' + Date.now();
  }
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.totalAmount = this.subtotal - this.discount + this.lateFee;
  this.amountPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
  if (this.amountPaid >= this.totalAmount) this.status = 'paid';
  else if (this.amountPaid > 0 && this.amountPaid < this.totalAmount) this.status = 'partial';
  else if (this.dueDate && new Date() > this.dueDate && this.status === 'pending') this.status = 'overdue';
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
