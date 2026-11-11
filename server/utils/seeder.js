const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const User = require('../models/User');
const Room = require('../models/Room');
const Resident = require('../models/Resident');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Invoice = require('../models/Invoice');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel-management';

const rooms = [
  { roomNumber: '101', floor: 1, type: 'single', capacity: 1, pricePerMonth: 8000, status: 'available', amenities: ['WiFi', 'AC', 'Attached Bathroom'], block: 'A' },
  { roomNumber: '102', floor: 1, type: 'double', capacity: 2, pricePerMonth: 6000, status: 'available', amenities: ['WiFi', 'Fan', 'Attached Bathroom'], block: 'A' },
  { roomNumber: '103', floor: 1, type: 'single', capacity: 1, pricePerMonth: 7500, status: 'occupied', currentOccupants: 1, amenities: ['WiFi', 'AC'], block: 'A' },
  { roomNumber: '104', floor: 1, type: 'double', capacity: 2, pricePerMonth: 5500, status: 'available', amenities: ['WiFi', 'Fan'], block: 'A' },
  { roomNumber: '201', floor: 2, type: 'single', capacity: 1, pricePerMonth: 8500, status: 'available', amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Balcony'], block: 'B' },
  { roomNumber: '202', floor: 2, type: 'triple', capacity: 3, pricePerMonth: 4500, status: 'available', amenities: ['WiFi', 'Fan', 'Common Bathroom'], block: 'B' },
  { roomNumber: '203', floor: 2, type: 'single', capacity: 1, pricePerMonth: 8000, status: 'maintenance', amenities: ['WiFi', 'AC'], block: 'B' },
  { roomNumber: '204', floor: 2, type: 'double', capacity: 2, pricePerMonth: 6500, status: 'occupied', currentOccupants: 2, amenities: ['WiFi', 'AC', 'Attached Bathroom'], block: 'B' },
  { roomNumber: '301', floor: 3, type: 'single', capacity: 1, pricePerMonth: 9000, status: 'available', amenities: ['WiFi', 'AC', 'Attached Bathroom', 'Balcony', 'TV'], block: 'C' },
  { roomNumber: '302', floor: 3, type: 'dormitory', capacity: 6, pricePerMonth: 3500, status: 'available', amenities: ['WiFi', 'Fan', 'Common Bathroom'], block: 'C' },
  { roomNumber: '303', floor: 3, type: 'double', capacity: 2, pricePerMonth: 7000, status: 'available', amenities: ['WiFi', 'AC'], block: 'C' },
  { roomNumber: '304', floor: 3, type: 'single', capacity: 1, pricePerMonth: 8800, status: 'reserved', amenities: ['WiFi', 'AC', 'Attached Bathroom'], block: 'C' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Promise.all([User.deleteMany(), Room.deleteMany(), Resident.deleteMany(), MaintenanceRequest.deleteMany(), Invoice.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // Create rooms
    const createdRooms = await Room.insertMany(rooms);
    console.log(`🏠 Created ${createdRooms.length} rooms`);

    // Create users
    const hashedPass = await bcrypt.hash('password123', 12);
    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@hostel.com', password: hashedPass, role: 'admin', phone: '9876543210' },
      { name: 'Staff Member', email: 'staff@hostel.com', password: hashedPass, role: 'staff', phone: '9876543211' },
      { name: 'Arjun Kumar', email: 'arjun@example.com', password: hashedPass, role: 'resident', phone: '9876543212' },
      { name: 'Priya Sharma', email: 'priya@example.com', password: hashedPass, role: 'resident', phone: '9876543213' },
      { name: 'Rahul Singh', email: 'rahul@example.com', password: hashedPass, role: 'resident', phone: '9876543214' },
    ]);
    console.log(`👤 Created ${users.length} users`);

    // Assign rooms to residents
    const room103 = createdRooms.find(r => r.roomNumber === '103');
    const room204 = createdRooms.find(r => r.roomNumber === '204');

    const residents = await Resident.insertMany([
      {
        user: users[2]._id, room: room103._id, roomNumber: '103', status: 'active',
        checkInDate: new Date('2024-01-15'), monthlyRent: 7500, securityDeposit: 15000,
        emergencyContact: { name: 'Ramesh Kumar', phone: '9876500001', relationship: 'Father' },
        idProofType: 'aadhar', idProofNumber: 'XXXX-XXXX-1234'
      },
      {
        user: users[3]._id, room: room204._id, roomNumber: '204', status: 'active',
        checkInDate: new Date('2024-02-01'), monthlyRent: 6500, securityDeposit: 13000,
        emergencyContact: { name: 'Sunita Sharma', phone: '9876500002', relationship: 'Mother' },
        idProofType: 'passport', idProofNumber: 'A1234567'
      },
      {
        user: users[4]._id, status: 'pending', monthlyRent: 0, securityDeposit: 0,
        emergencyContact: { name: 'Vijay Singh', phone: '9876500003', relationship: 'Father' }
      },
    ]);
    console.log(`🏡 Created ${residents.length} resident profiles`);

    // Create maintenance requests
    await MaintenanceRequest.insertMany([
      {
        resident: users[2]._id, room: room103._id, roomNumber: '103',
        title: 'AC not cooling properly', description: 'The AC in my room is running but not cooling. Temperature stays above 28°C.',
        category: 'ac', priority: 'high', status: 'in-progress',
        assignedTo: users[1]._id
      },
      {
        resident: users[3]._id, room: room204._id, roomNumber: '204',
        title: 'Leaking tap in bathroom', description: 'The bathroom tap has been leaking continuously for 2 days.',
        category: 'plumbing', priority: 'medium', status: 'pending'
      },
      {
        resident: users[2]._id, room: room103._id, roomNumber: '103',
        title: 'WiFi connectivity issue', description: 'Internet keeps dropping every 30 minutes.',
        category: 'internet', priority: 'medium', status: 'resolved',
        resolutionNote: 'Router reset and channel changed.', resolvedAt: new Date()
      },
    ]);
    console.log('🔧 Created maintenance requests');

    // Create invoices
    const now = new Date();
    await Invoice.insertMany([
      {
        resident: users[2]._id, residentProfile: residents[0]._id, roomNumber: '103',
        billingMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        items: [
          { description: 'Room Rent - November 2024', amount: 7500, type: 'rent' },
          { description: 'Electricity Charges', amount: 850, type: 'electricity' },
          { description: 'Water Charges', amount: 200, type: 'water' },
          { description: 'Internet Charges', amount: 500, type: 'internet' }
        ],
        totalAmount: 9050, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        status: 'pending', invoiceNumber: 'INV-2024-001'
      },
      {
        resident: users[3]._id, residentProfile: residents[1]._id, roomNumber: '204',
        billingMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        items: [
          { description: 'Room Rent - November 2024', amount: 6500, type: 'rent' },
          { description: 'Electricity Charges', amount: 650, type: 'electricity' },
          { description: 'Water Charges', amount: 200, type: 'water' }
        ],
        payments: [{ amount: 7350, method: 'upi', transactionId: 'TXN123456', paidAt: new Date() }],
        totalAmount: 7350, amountPaid: 7350, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        status: 'paid', invoiceNumber: 'INV-2024-002'
      },
      {
        resident: users[2]._id, residentProfile: residents[0]._id, roomNumber: '103',
        billingMonth: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`,
        items: [
          { description: 'Room Rent - October 2024', amount: 7500, type: 'rent' },
          { description: 'Electricity Charges', amount: 920, type: 'electricity' },
          { description: 'Water Charges', amount: 200, type: 'water' },
          { description: 'Internet Charges', amount: 500, type: 'internet' }
        ],
        payments: [{ amount: 9120, method: 'cash', paidAt: new Date(now.getFullYear(), now.getMonth(), 3) }],
        totalAmount: 9120, amountPaid: 9120, status: 'paid', invoiceNumber: 'INV-2024-003',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 5)
      },
    ]);
    console.log('💰 Created invoices');

    console.log('\n✅ Seed complete! Login credentials:');
    console.log('  Admin: admin@hostel.com / password123');
    console.log('  Staff: staff@hostel.com / password123');
    console.log('  Resident: arjun@example.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
