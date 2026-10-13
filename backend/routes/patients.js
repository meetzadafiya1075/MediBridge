const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Referral = require('../models/Referral');

// Create a new patient
router.post('/', async (req, res) => {
  try {
    const { fullName, age, gender, contactNumber, disease, pastRecords, hospitalName, doctorName, doctorId, hospitalId, department } = req.body;
    const newPatient = new Patient({
      fullName,
      age,
      gender,
      contactNumber,
      disease,
      pastRecords,
      medicalHistory: [{
        record: `Registration: Admitted to ${hospitalName || 'Network Hospital'} for ${disease || 'General Evaluation'}.`,
        doctorName: doctorName || 'Clinical Staff',
        timestamp: new Date()
      }]
    });
    const savedPatient = await newPatient.save();
    
    // Auto-generate local referral to drop them into the registering doctor's "Referred to me" dashboard
    if (doctorId && hospitalId) {
      await Referral.create({
        patientId: savedPatient._id,
        referringDoctorId: doctorId,
        originHospitalId: hospitalId,
        destinationHospitalId: hospitalId,
        destinationDepartment: department,
        diagnosis: disease || 'General Evaluation',
        urgency: 'Routine',
        notes: 'Initial Registration Local Admission',
        referralId: `REF-${Math.floor(1000 + Math.random() * 9000)}-MH`,
        status: 'Received',
        history: [{ 
          status: 'Received', 
          note: 'Patient admitted locally',
          timestamp: new Date() 
        }]
      });
    }

    res.status(201).json(savedPatient);
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Get a patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(200).json(patient);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: 'Failed to find patient' });
  }
});

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(patients);
  } catch (err) {
    console.error('Error fetching all patients:', err);
    res.status(500).json({ error: 'Failed to fetch patients list' });
  }
});

// Add lifetime medical record
router.post('/:id/records', async (req, res) => {
  try {
    const { record, doctorName } = req.body;
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    patient.medicalHistory.push({
      record,
      doctorName: doctorName || 'Clinical Staff',
      timestamp: new Date()
    });
    
    const savedPatient = await patient.save();
    res.status(200).json(savedPatient);
  } catch (err) {
    console.error('Error adding record:', err);
    res.status(500).json({ error: 'Failed to add medical record' });
  }
});

// Re-admit / New Case
router.post('/:id/admit', async (req, res) => {
  try {
    const { disease, doctorName, doctorId, hospitalId, department, hospitalName } = req.body;
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    patient.disease = disease;
    patient.medicalHistory.push({
      record: `Registration: Re-Admitted to ${hospitalName || 'Network Hospital'} for ${disease || 'General Evaluation'}.`,
      doctorName: doctorName || 'Clinical Staff',
      timestamp: new Date()
    });
    const savedPatient = await patient.save();

    if (doctorId && hospitalId) {
      await Referral.create({
        patientId: savedPatient._id,
        referringDoctorId: doctorId,
        originHospitalId: hospitalId,
        destinationHospitalId: hospitalId,
        destinationDepartment: department,
        diagnosis: disease || 'General Evaluation',
        urgency: 'Routine',
        notes: 'Re-Admission Local Registration',
        referralId: `REF-${Math.floor(1000 + Math.random() * 9000)}-MH`,
        status: 'Received',
        history: [{ 
          status: 'Received', 
          note: 'Patient re-admitted locally',
          timestamp: new Date() 
        }]
      });
    }

    res.status(200).json(savedPatient);
  } catch (err) {
    console.error('Error re-admitting patient:', err);
    res.status(500).json({ error: 'Failed to re-admit patient' });
  }
});

module.exports = router;
