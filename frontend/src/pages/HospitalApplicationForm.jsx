import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Mail, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import './Login.css';

const HospitalApplicationForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    contactNumber: '',
    address: '',
    district: '',
    state: '',
    hospitalCategory: 'Government',
    totalBeds: '',
    availableBeds: '',
    icuAvailable: '',
    emailDomain: '',
  });

  const [departments, setDepartments] = useState([{ name: '', doctor: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const addDepartment = () => {
    setDepartments([...departments, { name: '', doctor: '' }]);
  };

  const removeDepartment = (index) => {
    const newDepts = [...departments];
    newDepts.splice(index, 1);
    setDepartments(newDepts);
  };

  const handleDeptChange = (index, field, value) => {
    const newDepts = [...departments];
    newDepts[index][field] = value;
    setDepartments(newDepts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const pureDepartments = departments.map(d => d.name).filter(Boolean);
      const doctorDirectory = departments.map(d => ({
        department: d.name,
        doctors: [d.doctor].filter(Boolean)
      })).filter(d => d.department);

      const payload = {
        ...form,
        departments: pureDepartments,
        doctorDirectory,
        totalBeds: parseInt(form.totalBeds) || 0,
        availableBeds: parseInt(form.availableBeds) || 0,
        icuAvailable: parseInt(form.icuAvailable) || 0,
      };

      await api.applyHospital(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container animate-fade-in">
        <div className="login-card p-8 text-center" style={{ padding: '2rem' }}>
          <CheckCircle2 size={48} color="#059669" className="mx-auto mb-4" />
          <h2>Application Received</h2>
          <p className="mt-2 text-muted">Your hospital application has been successfully submitted. It is now pending review by our administration team. You will be notified regarding the status.</p>
          <button className="btn-primary mt-6 w-full" onClick={() => navigate('/login')}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container animate-fade-in" style={{ padding: '2rem 1rem', minHeight: '100vh', height: 'auto', alignItems: 'flex-start', overflowY: 'auto' }}>
      <div className="login-card" style={{ maxWidth: '650px', width: '100%', margin: '0 auto', marginBottom: '2rem' }}>
        <div className="login-header text-center">
          <div className="logo-icon-large mx-auto">
            <Building2 size={32} color="#dc2626" />
          </div>
          <h2>Hospital Network Application</h2>
          <p>Register your facility and medical staff</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form mt-4">
          {error && <div className="alert-banner error mb-4" style={{ padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}><AlertCircle size={16} className="inline mr-2" />{error}</div>}
          
          <div className="form-group mb-4">
            <label>Hospital Name</label>
            <input type="text" placeholder="e.g. Apollo General" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border p-2 rounded" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Contact Number</label>
              <input type="text" value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} required className="w-full border p-2 rounded" placeholder="+91..." />
            </div>
            <div className="form-group">
              <label>Admin Email Domain</label>
              <input type="text" placeholder="e.g. apollo.com" value={form.emailDomain} onChange={e => setForm({...form, emailDomain: e.target.value})} required className="w-full border p-2 rounded" />
            </div>
          </div>

          <div className="form-group mb-4">
            <label>Full Address</label>
            <input type="text" placeholder="Street layout, region" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required className="w-full border p-2 rounded" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>District</label>
              <input type="text" value={form.district} onChange={e => setForm({...form, district: e.target.value})} required className="w-full border p-2 rounded" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required className="w-full border p-2 rounded" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.hospitalCategory} onChange={e => setForm({...form, hospitalCategory: e.target.value})} className="w-full border p-2 rounded bg-white">
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Total Beds</label>
              <input type="number" min="0" value={form.totalBeds} onChange={e => setForm({...form, totalBeds: e.target.value})} required className="w-full border p-2 rounded" />
            </div>
            <div className="form-group">
              <label>Available Beds</label>
              <input type="number" min="0" value={form.availableBeds} onChange={e => setForm({...form, availableBeds: e.target.value})} required className="w-full border p-2 rounded" />
            </div>
            <div className="form-group">
              <label>ICU Beds</label>
              <input type="number" min="0" value={form.icuAvailable} onChange={e => setForm({...form, icuAvailable: e.target.value})} required className="w-full border p-2 rounded" />
            </div>
          </div>

          <div className="departments-section mb-6" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <div className="flex justify-between items-center mb-4">
              <label style={{ margin: 0 }}>Departments & Lead Doctors</label>
            </div>
            
            {departments.map((dept, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Department (e.g. Cardiology)" 
                  value={dept.name} 
                  onChange={e => handleDeptChange(idx, 'name', e.target.value)} 
                  required 
                  className="border p-2 rounded w-full"
                />
                <input 
                  type="text" 
                  placeholder="Doctor Name (e.g. Aditi Sharma)" 
                  value={dept.doctor} 
                  onChange={e => handleDeptChange(idx, 'doctor', e.target.value)} 
                  required 
                  className="border p-2 rounded w-full"
                />
                {departments.length > 1 && (
                  <button type="button" onClick={() => removeDepartment(idx)} className="btn-outline border" style={{ padding: '0.4rem', color: '#ef4444' }}>
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
            
            <button type="button" onClick={addDepartment} className="btn-outline w-full flex items-center justify-center gap-2 mt-2">
              <Plus size={16} /> Add Another Department
            </button>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
          
          <div className="text-center mt-4">
            <a href="/login" className="text-sm text-primary hover-underline">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalApplicationForm;
