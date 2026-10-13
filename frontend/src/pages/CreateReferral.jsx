import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, FileText, Building2, AlertTriangle, UploadCloud, 
  CheckCircle2, QrCode, Printer, ArrowRight, X, File, Paperclip 
} from 'lucide-react';
import './CreateReferral.css';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const CreateReferral = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [urgency, setUrgency] = useState('Routine');
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [createdReferral, setCreatedReferral] = useState(null);

  const [formData, setFormData] = useState({
    patientId: '',
    diagnosis: '',
    destinationHospitalId: searchParams.get('hospitalId') || '',
    department: '',
    clinicalNotes: ''
  });

  useEffect(() => {
    const fetchHospitalsAndPatients = async () => {
      try {
        const data = await api.getHospitals();
        setHospitals(data);
        const urlHospitalId = searchParams.get('hospitalId');
        if (urlHospitalId && data.some(h => h._id === urlHospitalId)) {
          setFormData(prev => ({ ...prev, destinationHospitalId: urlHospitalId }));
        }

        const patData = await api.getPatients();
        setPatients(patData);
      } catch (error) {
        console.error("Failed to fetch data", error);
        addToast("Failed to load initial data", "error");
      } finally {
        setLoadingHospitals(false);
        setLoadingPatients(false);
      }
    };
    fetchHospitalsAndPatients();
  }, [searchParams]);

  // Dynamically compute departments for selected destination hospital
  const selectedHospitalObj = hospitals.find(h => h._id === formData.destinationHospitalId);
  const availableDepartments = selectedHospitalObj?.departments && selectedHospitalObj.departments.length > 0
    ? selectedHospitalObj.departments
    : ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'General Medicine', 'General Surgery'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const formatted = files.map(file => ({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type
      }));
      setAttachedFiles(prev => [...prev, ...formatted]);
      addToast(`${files.length} document(s) attached`, "info");
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destinationHospitalId || !formData.patientId) {
      addToast("Please select a patient and a destination facility", "error");
      return;
    }

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const payload = {
        patientId: formData.patientId,
        referral: {
          destinationHospitalId: formData.destinationHospitalId,
          destinationDepartment: formData.department || availableDepartments[0],
          urgency,
          diagnosis: formData.diagnosis,
          notes: formData.clinicalNotes || (attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached` : ''),
          originHospitalId: user.hospitalId || undefined
        }
      };
      
      const newRef = await api.createReferral(payload);
      addToast(`MediBridge generated: ${newRef.referralId}`, "success");
      setCreatedReferral(newRef);
    } catch (error) {
      console.error("Failed to create referral", error);
      addToast("Failed to create referral. Please verify fields.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-referral animate-fade-in">
      <div className="page-header mb-4 flex justify-between items-start">
        <div>
          <h2>Generate MediBridge</h2>
          <p>Initiate clinical handover protocol with verified digital health credentials.</p>
        </div>
        <button className="btn-outline" onClick={() => navigate('/referrals')}>
          View Registry
        </button>
      </div>

      <form className="referral-form" onSubmit={handleSubmit}>
        {/* Patient Info */}
        <div className="form-section">
          <div className="section-title">
            <User size={18} color="#ef4444" /> Patient Selection
          </div>
          <div className="form-group mb-4">
            <label>Registered Patient *</label>
            <select 
              name="patientId" 
              value={formData.patientId} 
              onChange={handleInputChange} 
              required
            >
              <option value="">Select a registered patient...</option>
              {!loadingPatients && patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.fullName} (Age: {p.age}, Gender: {p.gender}) - ID: {p._id.substring(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clinical Details */}
        <div className="form-section">
          <div className="section-title">
            <FileText size={18} color="#ef4444" /> Clinical Assessment
          </div>
          <div className="form-group">
            <label>Primary Diagnosis / Reason for Transfer *</label>
            <textarea 
              rows="3" 
              placeholder="Detail symptom history, acute vitals, and reasons requiring secondary/tertiary escalation..." 
              name="diagnosis" 
              value={formData.diagnosis} 
              onChange={handleInputChange} 
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label>Attach Clinical Investigation Reports / Labs (Optional)</label>
            <input 
              type="file" 
              multiple 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />
            <div 
              className="file-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={28} color="#ef4444" />
              <p>Click to browse and upload medical records<br/><span>PDF, ECG scans, JPG, PNG (Max 10MB)</span></p>
            </div>

            {attachedFiles.length > 0 && (
              <div className="attached-files-list mt-3">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="file-chip">
                    <Paperclip size={14} className="text-primary" />
                    <span className="file-name">{file.name} ({file.size})</span>
                    <button type="button" className="remove-file-btn" onClick={() => removeFile(idx)}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bottom-sections">
          {/* Destination */}
          <div className="form-section flex-1">
            <div className="section-title">
              <Building2 size={18} color="#ef4444" /> Destination Center
            </div>
            <div className="form-group">
              <label>Receiving Hospital *</label>
              <select 
                name="destinationHospitalId" 
                value={formData.destinationHospitalId} 
                onChange={handleInputChange} 
                required
              >
                <option value="">Select Authorized Facility</option>
                {!loadingHospitals && hospitals.map(h => (
                  <option key={h._id} value={h._id}>
                    {h.name} &bull; {h.availableBeds || 40} Beds Free ({h.status || 'Operational'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Destination Department *</label>
              <select 
                name="department" 
                value={formData.department} 
                onChange={handleInputChange} 
                required
              >
                <option value="">Select Receiving Department</option>
                {availableDepartments
                  .filter(dept => {
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const isSameHospital = formData.destinationHospitalId === currentUser.hospitalId;
                    const isSameDept = dept === (currentUser.department || currentUser.departmentName);
                    return !(isSameHospital && isSameDept);
                  })
                  .map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Urgency */}
          <div className="form-section flex-1">
            <div className="section-title text-red">
              <AlertTriangle size={18} color="#ef4444" /> Urgency Level
            </div>
            <div className="urgency-options">
              <label className={`urgency-card ${urgency === 'Routine' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="urgency" 
                  checked={urgency === 'Routine'} 
                  onChange={() => setUrgency('Routine')} 
                />
                <div>
                  <strong>Routine Transfer</strong>
                  <p>Scheduled elective or specialized consult queue</p>
                </div>
              </label>

              <label className={`urgency-card ${urgency === 'Urgent' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="urgency" 
                  checked={urgency === 'Urgent'} 
                  onChange={() => setUrgency('Urgent')} 
                />
                <div>
                  <strong>Urgent (Within 24-48 Hrs)</strong>
                  <p>Priority bed hold & rapid specialist allocation</p>
                </div>
              </label>

              <label className={`urgency-card emergency-card ${urgency === 'Emergency' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="urgency" 
                  checked={urgency === 'Emergency'} 
                  onChange={() => setUrgency('Emergency')} 
                />
                <div>
                  <strong>Emergency (Immediate Triage)</strong>
                  <p>Direct resuscitation / ICU transfer channel</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions mt-4">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Generating Digital Passport...' : 'Issue MediBridge \u2192'}
          </button>
        </div>
      </form>

      {/* REFERRAL CREATED SUCCESS CONFIRMATION MODAL */}
      {createdReferral && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card success-referral-card">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} color="#059669" />
                <h3>MediBridge Issued Successfully</h3>
              </div>
              <button className="close-btn" onClick={() => navigate('/referrals')}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="success-passport-box">
                <QrCode size={100} color="#0f172a" />
                <div>
                  <span className="passport-id-badge">{createdReferral.referralId}</span>
                  <h4>{createdReferral.patientId?.fullName || formData.name}</h4>
                  <p className="text-muted text-sm">
                    {formData.age} yrs &bull; {formData.gender} &bull; {formData.contact}
                  </p>
                  <p className="route-summary mt-2">
                    <strong>{formData.department}</strong> at {selectedHospitalObj?.name || 'Selected Facility'}
                  </p>
                  <span className={`badge ${urgency === 'Emergency' ? 'badge-error' : urgency === 'Urgent' ? 'badge-warning' : 'badge-info'} mt-2 inline-block`}>
                    {urgency} Priority
                  </span>
                </div>
              </div>

              <div className="success-info-tip">
                <p>An automated SMS alert with tracking instructions has been dispatched to the patient's phone. Receiving ward triage has been notified.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-outline" 
                onClick={() => {
                  setCreatedReferral(null);
                  setFormData({
                    name: '',
                    age: '',
                    gender: '',
                    contact: '',
                    diagnosis: '',
                    destinationHospitalId: '',
                    department: '',
                    clinicalNotes: ''
                  });
                  setAttachedFiles([]);
                }}
              >
                + Create Another
              </button>
              <button 
                className="btn-primary" 
                onClick={() => navigate(`/referrals?refId=${createdReferral.referralId}`)}
              >
                View in Referral Tracker <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReferral;

