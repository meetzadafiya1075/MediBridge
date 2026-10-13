const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String },
  state: { type: String },
  hospitalCategory: { type: String, enum: ['Government', 'Private'] },
  emailDomain: { type: String },
  location: { type: String },
  address: { type: String },
  type: { type: String, default: 'General Hospital' },
  contactNumber: { type: String },
  departments: [{ type: String }],
  doctorDirectory: [{
    department: String,
    doctors: [{ type: String }]
  }],
  totalBeds: { type: Number, default: 200 },
  availableBeds: { type: Number, default: 45 },
  icuAvailable: { type: Number, default: 8 },
  status: { type: String, enum: ['PendingApproval', 'Operational', 'High Load', 'Emergency Only', 'Rejected'], default: 'PendingApproval' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

hospitalSchema.virtual('contact')
  .get(function () { return this.contactNumber; })
  .set(function (val) { this.contactNumber = val; });

// Performance indexes
hospitalSchema.index({ status: 1 });
hospitalSchema.index({ name: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);

