const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  lab_request_id: { type: String, ref: 'LabRequest', required: true },
  patient_id: { type: String, ref: 'Patient', required: true },
  uploaded_by: { type: String, ref: 'LabTechnician', default: null },
  file_url: { type: String, required: true },
  file_name: { type: String, default: null },
  results_summary: { type: String, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
  toObject: { virtuals: true, transform: (_, ret) => { ret.id = ret._id; delete ret.__v; return ret; } },
});

module.exports = mongoose.model('LabReport', labReportSchema, 'lab_reports');
