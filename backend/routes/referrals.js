const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all referrals
router.get('/', auth, async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('patientId')
      .populate('originHospitalId')
      .populate('destinationHospitalId')
      .populate('referringDoctorId', 'name email department')
      .sort({ createdAt: -1 })
      .lean();
    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get referral by ID or Ref ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    let query;
    if (id.startsWith('REF-')) {
      query = { referralId: id };
    } else {
      query = { _id: id };
    }
    const referral = await Referral.findOne(query)
      .populate('patientId')
      .populate('originHospitalId')
      .populate('destinationHospitalId')
      .populate('referringDoctorId', 'name email department')
      .lean();
    
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    res.json(referral);
  } catch (error) {
    console.error('Error fetching single referral:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create referral
router.post('/', auth, async (req, res) => {
  try {
    const { patient, patientId, referral } = req.body;
    
    let finalPatientId = patientId;
    
    if (!finalPatientId && patient) {
      // Create new patient if no existing patient ID is provided
      const newPatient = await Patient.create({
        fullName: patient.fullName || patient.name || 'Unnamed Patient',
        age: patient.age ? Number(patient.age) : undefined,
        gender: patient.gender || 'Other',
        contactNumber: patient.contactNumber || patient.contact || '',
        disease: referral.diagnosis || '',
        medicalHistory: [{
          record: `Registration: Admitted to ${doctor ? (doctor.hospitalName || 'Network Hospital') : 'Network Hospital'} for ${referral.diagnosis || 'General Evaluation'} via Fast-Track Referral.`,
          doctorName: doctor ? doctor.name : 'Clinical Staff',
          timestamp: new Date()
        }]
      });
      finalPatientId = newPatient._id;
    }

    if (!finalPatientId) {
      return res.status(400).json({ message: 'Patient selection is required' });
    }
    
    // Find doctor actively making the request
    const doctor = await User.findById(req.user.id);

    // Determine valid origin hospital
    let originHospitalId = referral.originHospitalId;
    // Check if originHospitalId is a valid hospital, otherwise fallback to doctor's hospital or default
    const isRealHospital = originHospitalId ? await Hospital.findById(originHospitalId) : null;
    if (!isRealHospital) {
      if (doctor && doctor.hospitalId) {
        originHospitalId = doctor.hospitalId;
      } else {
        const defaultHospital = await Hospital.findOne();
        originHospitalId = defaultHospital ? defaultHospital._id : null;
      }
    }

    // Auto-Close Outbound Referrals: Mark previous open referrals for this patient at the origin hospital as Forwarded
    if (originHospitalId) {
      await Referral.updateMany(
        { 
          patientId: finalPatientId, 
          destinationHospitalId: originHospitalId,
          status: { $nin: ['Closed', 'Forwarded'] } 
        },
        { 
          $set: { status: 'Forwarded' },
          $push: { 
            history: { 
              status: 'Forwarded', 
              note: `Patient transferred automatically to ${referral.destinationDepartment}`, 
              timestamp: new Date() 
            } 
          }
        }
      );
    }

    // Create new outbound referral
    const newReferral = await Referral.create({
      patientId: finalPatientId,
      referringDoctorId: doctor ? doctor._id : null,
      originHospitalId,
      destinationHospitalId: referral.destinationHospitalId,
      destinationDepartment: referral.destinationDepartment,
      diagnosis: referral.diagnosis,
      urgency: referral.urgency || 'Routine',
      notes: referral.notes || '',
      referralId: `REF-${Math.floor(1000 + Math.random() * 9000)}-MH`,
      status: 'Referred',
      history: [{ 
        status: 'Referred', 
        note: referral.diagnosis ? `Referred for: ${referral.diagnosis}` : 'Referral initiated', 
        timestamp: new Date() 
      }]
    });
    
    const populated = await Referral.findById(newReferral._id)
      .populate('patientId')
      .populate('originHospitalId')
      .populate('destinationHospitalId')
      .populate('referringDoctorId', 'name email department');
      
    // Inject the automated timeline transfer log directly into the patient's QR record
    if (finalPatientId) {
       const p = await Patient.findById(finalPatientId);
       if (p) {
         p.medicalHistory.push({
           record: `Transfer: Referred from Dr. ${doctor ? doctor.name : 'Unknown'}, ${doctor ? doctor.department : 'Origin Dept'}, ${isRealHospital ? isRealHospital.name : 'Origin Hospital'} ➔ To ${referral.destinationDepartment}, ${populated.destinationHospitalId?.name || 'Destination Network'}. Reason: ${referral.diagnosis || 'Clinical Escalation'}.`,
           doctorName: doctor ? doctor.name : 'Clinical Staff',
           timestamp: new Date()
         });
         await p.save();
       }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

// Update status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const referral = await Referral.findById(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Referral not found' });

    referral.status = status;
    referral.history.push({
      status,
      note: note || `Status updated to ${status}`,
      timestamp: new Date()
    });

    await referral.save();
    
    // Discharge injection into patient QR record
    if (status === 'Closed') {
      const p = await Patient.findById(referral.patientId);
      if (p) {
        const doctor = await User.findById(req.user.id).populate('hospitalId');
        
        // Find existing closing records to avoid duplicate on multi-click
        const isClosedAlready = p.medicalHistory.some(m => m.record.startsWith("Discharged / Closed by") && (new Date() - new Date(m.timestamp)) < 1000 * 5); // 5 sec debounce
        
        if (!isClosedAlready) {
          p.disease = 'Resolved';
          p.medicalHistory.push({
             record: `Discharged / Closed by Dr. ${doctor?.name || 'Authorized Staff'}, ${doctor?.department || 'Department'}. Interventions/Notes: ${note || 'No notes provided'}.`,
             doctorName: doctor?.name || 'Clinical Staff',
             timestamp: new Date()
          });
          await p.save();
        }
      }
    }
    
    const populated = await Referral.findById(referral._id)
      .populate('patientId')
      .populate('originHospitalId')
      .populate('destinationHospitalId')
      .populate('referringDoctorId', 'name email department');

    res.json(populated);
  } catch (error) {
    console.error('Update referral error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;

