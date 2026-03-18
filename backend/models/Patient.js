const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  user_id: { type: String, ref: 'Profile', required: true },
  patient_uid: { type: String, unique: true, required: true },
  full_name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  date_of_birth: { type: Date, default: null },
  blood_group: { type: String, default: null },
  phone: { type: String, default: null },
  emergency_phone: { type: String, default: null },
  address: { type: String, default: null },
  is_admitted: { type: Boolean, default: false },
  assigned_bed_id: { type: String, ref: 'Bed', default: null },
  admission_date: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Patient', patientSchema, 'patients');
