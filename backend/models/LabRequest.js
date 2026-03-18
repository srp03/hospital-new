const mongoose = require('mongoose');

const labRequestSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  patient_id: { type: String, ref: 'Patient', required: true },
  doctor_id: { type: String, ref: 'Doctor', required: true },
  test_name: { type: String, required: true },
  test_type: { type: String, default: 'Blood Test' },
  notes: { type: String, default: null },
  urgency: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },
  status: { type: String, enum: ['requested', 'collected', 'processing', 'completed'], default: 'requested' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('LabRequest', labRequestSchema, 'lab_requests');
