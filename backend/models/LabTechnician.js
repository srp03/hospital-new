const mongoose = require('mongoose');

const labTechnicianSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  user_id: { type: String, ref: 'Profile', required: true },
  full_name: { type: String, required: true },
  specialization: { type: String, default: 'Clinical Pathology' },
  phone: { type: String, default: null },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('LabTechnician', labTechnicianSchema, 'lab_technicians');
