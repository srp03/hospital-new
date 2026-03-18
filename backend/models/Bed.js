const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  bed_number: { type: String, required: true, unique: true },
  ward: { type: String, default: 'General Ward' },
  bed_type: { type: String, enum: ['general', 'semi-private', 'private', 'icu', 'emergency'], default: 'general' },
  is_available: { type: Boolean, default: true },
  daily_rate: { type: Number, default: 500 },
  patient_id: { type: String, ref: 'Patient', default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Bed', bedSchema, 'beds');
