import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Building2, MapPin, Activity, FileText, X, Phone, Mail, User, Info, Bed } from 'lucide-react';
import { api } from '../services/api';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [viewingApp, setViewingApp] = useState(null);

  const fetchApplications = async () => {
    try {
      const data = await api.getHospitalApplications();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.reviewHospitalApplication(id, action);
      if (viewingApp && viewingApp._id === id) {
        setViewingApp(null);
      }
      setApplications(applications.filter(app => app._id !== id));
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="facilities-page animate-fade-in">
      <div className="page-header mb-6">
        <h2>Pending Network Applications</h2>
        <p>Review and verify facility applications for the GovHealth Network.</p>
      </div>

      {loading ? (
        <div className="loading-state card text-center p-8">
          <Activity className="spinner-icon mx-auto m-2" size={32} />
          <p>Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state card text-center p-8" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eef2f5' }}>
          <CheckCircle2 size={48} color="#94a3b8" className="mx-auto block mb-4" />
          <h3>No Pending Applications</h3>
          <p className="text-muted">You have completely cleared the application review queue.</p>
        </div>
      ) : (
        <div className="facilities-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {applications.map(app => (
            <div key={app._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-info">{app.hospitalCategory || 'Hospital'}</span>
                <h3 className="mt-2 text-xl font-bold">{app.name}</h3>
                <div className="flex items-center text-sm text-gray mt-2 gap-4">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {app.district}, {app.state}</span>
                  <span>Beds: {app.availableBeds} / {app.totalBeds} ({app.icuAvailable} ICU)</span>
                  <span>Domain: @{app.emailDomain}</span>
                </div>
                <div className="mt-3">
                  <span className="text-xs font-bold text-gray uppercase mr-2">Depts:</span>
                  {(app.departments || []).map((d, i) => (
                    <span key={i} className="inline-block bg-light-blue text-xs px-2 py-1 rounded mr-2 mb-1 border">{d}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2" style={{ flexDirection: 'column' }}>
                <button 
                  className="btn-outline flex items-center justify-center gap-2"
                  onClick={() => setViewingApp(app)}
                  disabled={processingId === app._id}
                  style={{ minWidth: '140px', background: '#f8fafc' }}
                >
                  <FileText size={16} /> View Details
                </button>
                <button 
                  className="btn-primary flex items-center justify-center gap-2"
                  onClick={() => handleAction(app._id, 'approve')}
                  disabled={processingId === app._id}
                  style={{ minWidth: '140px' }}
                >
                  <CheckCircle2 size={16} /> Approve
                </button>
                <button 
                  className="btn-outline flex items-center justify-center gap-2"
                  onClick={() => handleAction(app._id, 'reject')}
                  disabled={processingId === app._id}
                  style={{ minWidth: '140px', borderColor: '#ef4444', color: '#ef4444' }}
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {viewingApp && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setViewingApp(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={24} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Application Details</h3>
              </div>
              <button 
                className="close-btn" 
                onClick={() => setViewingApp(null)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Basic Info */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>{viewingApp.name}</h2>
                  <span className="badge badge-info">{viewingApp.hospitalCategory || 'Government'}</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <MapPin size={16} style={{ marginTop: '2px', color: '#94a3b8' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '4px', color: '#334155' }}>Address</strong>
                      <p style={{ margin: '0 0 2px 0' }}>{viewingApp.address}</p>
                      <p style={{ margin: 0 }}>{viewingApp.district}, {viewingApp.state}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={16} color="#94a3b8" />
                      <span>{viewingApp.contactNumber}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="#94a3b8" />
                      <span>@{viewingApp.emailDomain}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Infrastructure */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#334155', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                  <Bed size={18} /> Hospital Capacity
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 4px 0' }}>Total Beds</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>{viewingApp.totalBeds || 0}</p>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 4px 0' }}>Available Beds</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#16a34a', margin: 0 }}>{viewingApp.availableBeds || 0}</p>
                  </div>
                  <div style={{ background: '#fff', padding: '12px', border: '1px solid #fca5a5', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 4px 0' }}>ICU Beds</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc2626', margin: 0 }}>{viewingApp.icuAvailable || 0}</p>
                  </div>
                </div>
              </div>

              {/* Departments & Doctors */}
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#334155', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                  <User size={18} /> Departments & Lead Doctors
                </h4>
                {viewingApp.doctorDirectory && viewingApp.doctorDirectory.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {viewingApp.doctorDirectory.map((dept, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                        <strong style={{ display: 'block', color: '#dc2626', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                          {dept.department}
                        </strong>
                        {dept.doctors && dept.doctors.map((doc, dIdx) => (
                          <div key={dIdx} style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                             <User size={14} color="#94a3b8" /> Dr. {doc}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>No departmental doctor information provided.</p>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem', paddingTop: '1rem', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button 
                className="btn-outline" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderColor: '#e2e8f0', color: '#475569' }}
                onClick={() => handleAction(viewingApp._id, 'reject')} 
                disabled={processingId === viewingApp._id}
              >
                <XCircle size={16} /> Reject Application
              </button>
              <button 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => handleAction(viewingApp._id, 'approve')} 
                disabled={processingId === viewingApp._id}
              >
                <CheckCircle2 size={16} /> Approve Facility
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminApplications;
