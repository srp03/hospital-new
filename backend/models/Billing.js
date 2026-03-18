const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  patient_id: { type: String, ref: 'Patient', required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['consultation', 'lab', 'medicine', 'room', 'other'], default: 'consultation' },
  amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'partially_paid', 'cancelled'], default: 'pending' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Billing', billingSchema, 'billing');
