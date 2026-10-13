const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const User = require('../models/User');

// Get all operational hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'Operational' }).lean();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Apply as a new hospital
router.post('/apply', async (req, res) => {
  try {
    const newHospital = await Hospital.create({ ...req.body, status: 'PendingApproval' });
    res.status(201).json({ message: 'Application submitted successfully', hospital: newHospital });
  } catch (error) {
    console.error('Error creating hospital application:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get pending applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await Hospital.find({ status: 'PendingApproval' }).lean();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Approve application
router.post('/applications/:id/approve', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital || hospital.status !== 'PendingApproval') {
      return res.status(404).json({ message: 'Application not found or already processed' });
    }

    hospital.status = 'Operational';
    await hospital.save();

    const emailDomain = hospital.emailDomain || 'hospital.com';

    if (hospital.doctorDirectory && hospital.doctorDirectory.length > 0) {
      for (const dept of hospital.doctorDirectory) {
        for (const doc of dept.doctors) {
          if (!doc) continue;
          const docFirstName = doc.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
          const docEmail = `${docFirstName}@${emailDomain}`;

          const existingDoc = await User.findOne({ email: docEmail });
          if (!existingDoc) {
             await User.create({
               name: doc,
               email: docEmail,
               password: 'password123',
               role: 'doctor',
               hospitalId: hospital._id,
               department: dept.department
             });
          }
        }
      }
    }

    res.json({ message: 'Approved successfully', hospital });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Reject application
router.post('/applications/:id/reject', async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application rejected and removed' });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
