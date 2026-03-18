const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  patient_id: { type: String, ref: 'Patient', required: true },
  doctor_id: { type: String, ref: 'Doctor', required: true },
  appointment_date: { type: String, required: true },
  appointment_time: { type: String, default: '10:00' },
  reason: { type: String, default: null },
  status: { type: String, enum: ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled', 'rejected'], default: 'pending' },
  rejection_reason: { type: String, default: null },
  notes: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Appointment', appointmentSchema, 'appointments');
