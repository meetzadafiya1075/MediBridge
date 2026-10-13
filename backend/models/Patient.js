const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  contactNumber: { type: String },
  disease: { type: String },
  pastRecords: { type: String },
  medicalHistory: [{
    record: String,
    doctorName: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Aliases for seamless frontend compatibility
patientSchema.virtual('name')
  .get(function () { return this.fullName; })
  .set(function (val) { this.fullName = val; });

patientSchema.virtual('contact')
  .get(function () { return this.contactNumber; })
  .set(function (val) { this.contactNumber = val; });

// Performance indexes
patientSchema.index({ createdAt: -1 });
patientSchema.index({ fullName: 1 });

module.exports = mongoose.model('Patient', patientSchema);

