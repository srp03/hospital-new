const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  email: { type: String, required: true, unique: true, lowercase: true },
  full_name: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'lab', 'admin'], required: true },
  avatar_url: { type: String, default: null },
  password: { type: String, required: true, select: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('Profile', profileSchema, 'profiles');
