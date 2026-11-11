const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  checkInDate: { type: Date },
  checkOutDate: { type: Date },
  status: { type: String, enum: ['active', 'checked-out', 'pending'], default: 'pending' },
  idProofType: { type: String, enum: ['aadhar', 'passport', 'driving-license', 'voter-id', 'other'] },
  idProofNumber: { type: String },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  occupation: { type: String },
  monthlyRent: { type: Number },
  securityDeposit: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Resident', residentSchema);
