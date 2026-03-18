const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  user_id: { type: String, ref: 'Profile', required: true },
  full_name: { type: String, required: true },
  specialization: { type: String, default: 'General Medicine' },
  qualification: { type: String, default: null },
  experience_years: { type: Number, default: 0 },
  phone: { type: String, default: null },
  consultation_fee: { type: Number, default: 0 },
  department_id: { type: String, ref: 'Department', default: null },
  is_active: { type: Boolean, default: true },
  available_days: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Doctor', doctorSchema, 'doctors');
