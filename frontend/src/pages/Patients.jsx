import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { UserPlus, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import './Patients.css';

const Patients = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    contactNumber: '',
    disease: '',
    pastRecords: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        doctorName: currentUser.name || 'Clinical Staff',
        hospitalName: currentUser.hospitalName || 'Network Hospital',
        doctorId: currentUser._id,
        hospitalId: currentUser.hospitalId?._id || currentUser.hospitalId,
        department: currentUser.department || currentUser.departmentName || 'General Medicine'
      };
      
      const data = await api.createPatient(payload);
      setCreatedPatient(data);
      setFormData({ fullName: '', age: '', gender: 'Male', contactNumber: '', disease: '', pastRecords: '' });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setCreatedPatient(null);
  };

  return (
    <div className="patients-container animate-fade-in">
      <div className="page-header">
        <h1>Patient Management</h1>
        <p>Register new patients and generate their unique medical QR Code.</p>
      </div>

      <div className="patients-content">
        {!createdPatient ? (
          <div className="card add-patient-card">
            <div className="card-header">
              <UserPlus size={24} className="text-primary" />
              <h2>New Patient Registration</h2>
            </div>
            <form onSubmit={handleSubmit} className="patient-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} required placeholder="e.g. 45" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required placeholder="e.g. +91 9876543210" />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Current Disease / Diagnosis</label>
                <input type="text" name="disease" value={formData.disease} onChange={handleInputChange} required placeholder="e.g. Type 2 Diabetes" />
              </div>
              <div className="form-group full-width">
                <label>Past Medical Records & Allergies</label>
                <textarea name="pastRecords" value={formData.pastRecords} onChange={handleInputChange} rows="3" placeholder="List any past surgeries, chronic illnesses, or allergies..." required></textarea>
              </div>
              
              <button type="submit" className="btn-primary form-submit-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register Patient & Generate QR'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card success-card">
            <div className="success-header">
              <CheckCircle size={48} color="#10b981" />
              <h2>Patient Registered Successfully!</h2>
              <p>Scan this QR code to access patient records instantly.</p>
            </div>
            
            <div className="qr-container">
              <QRCode value={createdPatient._id} size={200} fgColor="#7f1d1d" />
              <div className="qr-meta">
                <strong>{createdPatient.fullName}</strong>
                <p>ID: {createdPatient._id}</p>
              </div>
            </div>

            <button onClick={handleCreateNew} className="btn-outline mt-4">
              Register Another Patient
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
