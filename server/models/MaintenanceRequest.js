const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['plumbing', 'electrical', 'furniture', 'cleaning', 'ac', 'internet', 'other'], default: 'other' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'assigned', 'in-progress', 'resolved', 'closed'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  images: [{ type: String }],
  resolutionNote: { type: String },
  resolvedAt: { type: Date },
  estimatedCompletion: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceRequest', maintenanceSchema);
