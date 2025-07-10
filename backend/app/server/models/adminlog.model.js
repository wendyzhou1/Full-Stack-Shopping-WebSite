const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'order_placed'
  message: { type: String, required: true },
  data: { type: Object }, // Additional data (orderId, userId, etc.)
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'adminlogs',
  versionKey: false
});

const AdminLog = mongoose.model('AdminLog', adminLogSchema, 'adminlogs');

module.exports = AdminLog;
