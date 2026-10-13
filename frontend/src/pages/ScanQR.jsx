import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, UserCircle, Activity, FileText } from 'lucide-react';
import { api } from '../services/api';
import './ScanQR.css';

const ScanQR = () => {
  const [scanResult, setScanResult] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const qrRef = useRef(null);

  useEffect(() => {
    if (scanResult) return;

    // Strict mode cleanup safeguard
    const readerElement = document.getElementById('reader');
    if (readerElement) readerElement.innerHTML = '';

    let isMounted = true;
    const html5QrCode = new Html5Qrcode("reader");
    qrRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 400, height: 400 } },
      (decodedText) => {
        if (isMounted) {
          setScanResult(decodedText);
          html5QrCode.stop().catch(err => console.error(err));
        }
      },
      (error) => {
        // ignore constant scanning errors
      }
    ).catch(err => console.error("Error starting camera: ", err));

    return () => {
      isMounted = false;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.error(e));
      } else {
        html5QrCode.clear();
      }
    };
  }, [scanResult]);

  useEffect(() => {
    if (scanResult) {
      fetchPatientData(scanResult);
    }
  }, [scanResult]);

  const [newRecord, setNewRecord] = useState('');
  const [addingRecord, setAddingRecord] = useState(false);

  const fetchPatientData = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPatientById(id);
      setPatientData(data);
    } catch (err) {
      setError("Patient not found or invalid QR Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setPatientData(null);
    setError(null);
    setNewRecord('');
  };

  const handleAddRecord = async () => {
    if (!newRecord.trim()) return;
    setAddingRecord(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        disease: newRecord,
        doctorName: currentUser.name || 'Clinical Staff',
        hospitalName: currentUser.hospitalName || 'Network Hospital',
        doctorId: currentUser._id,
        hospitalId: currentUser.hospitalId?._id || currentUser.hospitalId,
        department: currentUser.department || currentUser.departmentName || 'General Medicine'
      };
      
      const updatedPatient = await api.admitPatient(patientData._id || patientData.id, payload);
      setPatientData(updatedPatient);
      setNewRecord('');
    } catch (err) {
      alert("Failed to re-admit patient.");
    } finally {
      setAddingRecord(false);
    }
  };

  return (
    <div className="scan-qr-container animate-fade-in">
      <div className="page-header">
        <h1>Scan Patient QR</h1>
        <p>Scan a patient's medical QR code to instantly retrieve their complete records.</p>
      </div>

      <div className="scan-content">
        {!scanResult ? (
          <div className="card scanner-card">
            <div id="reader"></div>
          </div>
        ) : (
          <div className="card patient-details-card">
            {loading ? (
              <div className="loading-state">Fetching Patient Records...</div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button className="btn-primary" onClick={handleReset}>Try Again</button>
              </div>
            ) : patientData ? (
              <div className="patient-profile">
                <div className="profile-header">
                  <UserCircle size={64} className="text-primary" />
                  <div className="profile-titles">
                    <h2>{patientData.fullName}</h2>
                    <span className="badge">{patientData.gender} • {patientData.age} Years</span>
                  </div>
                </div>

                <div className="profile-body">
                  <div className="info-block">
                    <div className="info-title">
                      <Activity size={18} />
                      Current Disease / Diagnosis
                    </div>
                    <div className="info-content text-danger">{patientData.disease || 'N/A'}</div>
                  </div>

                  <div className="info-block">
                    <div className="info-title">
                      <FileText size={18} />
                      Legacy / Base Medical Records
                    </div>
                    <div className="info-content">{patientData.pastRecords || 'N/A'}</div>
                  </div>

                  {(() => {
                    const journeys = [];
                    let currentJourney = { id: 0, events: [], isClosed: false, title: 'Medical Journey' };
                    
                    if (patientData.medicalHistory && patientData.medicalHistory.length > 0) {
                      patientData.medicalHistory.forEach((hist) => {
                         if (hist.record.startsWith("Registration:") && currentJourney.events.length > 0) {
                            journeys.push(currentJourney);
                            currentJourney = { id: journeys.length, events: [], isClosed: false, title: 'Medical Journey' };
                         }
                         if (hist.record.startsWith("Registration: ")) {
                             const match = hist.record.match(/for (.*?) via|for (.*?)\./);
                             if (match) {
                                 currentJourney.title = `Journey: ${match[1] || match[2]}`;
                             }
                         }
                         
                         currentJourney.events.push(hist);

                         if (hist.record.startsWith("Discharged / Closed by")) {
                            currentJourney.isClosed = true;
                            journeys.push(currentJourney);
                            currentJourney = { id: journeys.length, events: [], isClosed: false, title: 'Past Medical Journey' };
                         }
                      });
                      if (currentJourney.events.length > 0) {
                         journeys.push(currentJourney);
                      }
                    }

                    if (journeys.length === 0) return null;

                    return (
                      <div className="info-block">
                        <div className="info-title">
                           <FileText size={18} />
                           Automated Journey Timeline
                        </div>
                        <div className="info-content flex-col gap-2">
                          {journeys.map((j, jIndex) => {
                            if (j.isClosed) {
                              return (
                                <details key={jIndex} style={{ background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer' }}>
                                  <summary style={{ fontWeight: 'bold', color: '#1e293b', outline: 'none' }}>
                                    {j.title} (Closed / Discharged)
                                  </summary>
                                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {j.events.map((hist, idx) => (
                                      <div key={idx} style={{ padding: '8px', borderLeft: '3px solid #cbd5e1', background: '#fff', borderRadius: '4px' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                                           <strong>Dr. {hist.doctorName}</strong>
                                           <span>{new Date(hist.timestamp).toLocaleDateString()}</span>
                                         </div>
                                         <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                           {hist.record}
                                         </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              );
                            } else {
                              return (
                                <div key={jIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                   <div style={{ fontWeight: 'bold', color: '#1e293b', padding: '8px 4px', borderBottom: '1px solid #e2e8f0' }}>
                                     Current Active {j.title}
                                   </div>
                                   {j.events.map((hist, idx) => (
                                     <div key={idx} style={{ background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                         <strong>Dr. {hist.doctorName}</strong>
                                         <span>{new Date(hist.timestamp).toLocaleDateString()}</span>
                                       </div>
                                       <div style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                         {hist.record}
                                       </div>
                                     </div>
                                   ))}
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    );
                  })()}



                  <div className="info-block sm">
                    <strong>Contact Number:</strong> {patientData.contactNumber}
                  </div>
                  <div className="info-block sm">
                    <strong>Patient ID:</strong> {patientData.id || patientData._id}
                  </div>
                </div>

                {(!patientData.disease || patientData.disease === 'Resolved' || patientData.disease === 'N/A') && (
                   <div style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
                     <h4 style={{ color: '#b91c1c', marginBottom: '8px' }}>Start New Admission / Case</h4>
                     <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: '12px' }}>This patient has been discharged. You can initiate a new active referral block for a new diagnosis.</p>
                     <input 
                       type="text" 
                       placeholder="Enter new Primary Diagnosis..." 
                       value={newRecord}
                       onChange={(e) => setNewRecord(e.target.value)}
                       style={{ width: '100%', padding: '8px', border: '1px solid #f87171', borderRadius: '4px', marginBottom: '12px' }}
                     />
                     <button 
                       disabled={!newRecord.trim() || addingRecord} 
                       onClick={handleAddRecord} 
                       className="btn-primary w-full flex items-center justify-center p-2"
                     >
                       {addingRecord ? "Processing Admission..." : "Re-Admit Patient & Open Case"}
                     </button>
                   </div>
                )}

                <div className="flex justify-center mt-6">
                  <button onClick={handleReset} className="btn-outline w-full" style={{ maxWidth: '300px' }}>Scan Another Patient</button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQR;
