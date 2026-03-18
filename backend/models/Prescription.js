const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  patient_id: { type: String, ref: 'Patient', required: true },
  doctor_id: { type: String, ref: 'Doctor', required: true },
  diagnosis: { type: String, default: null },
  advice: { type: String, default: null },
  medicines: { type: mongoose.Schema.Types.Mixed, default: [] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Prescription', prescriptionSchema, 'prescriptions');
