const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['single', 'double', 'triple', 'dormitory'], default: 'single' },
  capacity: { type: Number, required: true, default: 1 },
  currentOccupants: { type: Number, default: 0 },
  pricePerMonth: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'reserved'], default: 'available' },
  amenities: [{ type: String }],
  description: { type: String },
  images: [{ type: String }],
  block: { type: String, default: 'A' }
}, { timestamps: true });

roomSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.currentOccupants < this.capacity;
});

module.exports = mongoose.model('Room', roomSchema);
