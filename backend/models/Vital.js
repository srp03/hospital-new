const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  patient_id: { type: String, ref: 'Patient', required: true },
  recorded_by: { type: String, ref: 'Doctor', default: null },
  blood_pressure_systolic: { type: Number, default: null },
  blood_pressure_diastolic: { type: Number, default: null },
  blood_sugar: { type: Number, default: null },
  spo2: { type: Number, default: null },
  heart_rate: { type: Number, default: null },
  temperature: { type: Number, default: null },
  weight: { type: Number, default: null },
  recorded_at: { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Vital', vitalSchema, 'vitals');
