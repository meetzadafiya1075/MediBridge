import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  QrCode, Search, Filter, MapPin, Activity, Download, 
  ChevronRight, CheckCircle2, Clock, Printer, AlertTriangle, 
  User, Building2, ArrowRight, Eye, RefreshCw, X 
} from 'lucide-react';
import './Referrals.css';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const Referrals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [urgencyFilter, setUrgencyFilter] = useState(searchParams.get('urgency') || 'All');

  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  // Handle URL query parameters (e.g. ?refId=REF-9824-MH)
  useEffect(() => {
    const queryRefId = searchParams.get('refId');
    if (queryRefId && referrals.length > 0) {
      const match = referrals.find(r => r.referralId === queryRefId || r._id === queryRefId);
      if (match) {
        setSelectedReferral(match);
        setActiveTab('details');
      }
    }
    const queryUrgency = searchParams.get('urgency');
    if (queryUrgency) {
      setUrgencyFilter(queryUrgency);
      setActiveTab('list');
    }
  }, [searchParams, referrals]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const data = await api.getReferrals();
      setReferrals(data);
      if (data.length > 0 && !selectedReferral) {
        setSelectedReferral(data[0]);
      }
    } catch (error) {
      console.error("Error fetching referrals", error);
      addToast("Failed to load referrals", "error");
    } finally {
      setLoading(false);
    }
  };



  // Filtered referrals list
  const filteredReferrals = referrals.filter(r => {
    const patientName = r.patientId?.fullName || r.patientId?.name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.referralId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.diagnosis && r.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (r.destinationDepartment && r.destinationDepartment.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'All' || r.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Referred': return 'badge-info';
      case 'Received': return 'badge-purple';
      case 'Seen': return 'badge-warning';
      case 'Closed': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case 'Emergency': return 'urgency-pill-emergency';
      case 'Urgent': return 'urgency-pill-urgent';
      default: return 'urgency-pill-routine';
    }
  };

  // Dynamic journey milestones evaluation
  const stages = ['Referred', 'Received', 'Seen', 'Closed'];
  const getStageHistory = (stageName) => {
    if (!selectedReferral?.history) return null;
    return selectedReferral.history.find(h => h.status === stageName);
  };

  const currentStageIndex = stages.indexOf(selectedReferral?.status || 'Referred');

  return (
    <div className="referrals-page animate-fade-in">
      <div className="page-header mb-4 flex justify-between items-start">
        <div>
          <h2>MediBridge Management</h2>
          <p>Triage inbound transfers, update clinical statuses, and track patient journeys network-wide.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={fetchReferrals} title="Refresh records">
            <RefreshCw size={16} className={loading ? 'spinner-icon' : ''} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => navigate('/create-referral')}>
            + Create Referral
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-5">
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} 
          onClick={() => setActiveTab('list')}
        >
          All Referrals Directory ({filteredReferrals.length})
        </button>

        <button 
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} 
          onClick={() => setActiveTab('details')}
        >
          MediBridge Journey
        </button>
      </div>

      {/* TAB 1: ALL REFERRALS DIRECTORY */}
      {activeTab === 'list' && (
        <div className="referrals-directory-view animate-fade-in">
          {/* Filter Bar */}
          <div className="card filter-bar mb-4">
            <div className="search-input-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by patient name, Ref ID, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="filter-dropdowns">
              <div className="select-wrapper">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Referred">Referred</option>
                  <option value="Received">Received</option>
                  <option value="Seen">Seen by Dr.</option>
                  <option value="Closed">Closed / Discharged</option>
                </select>
              </div>

              <div className="select-wrapper">
                <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
                  <option value="All">All Urgencies</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Routine">Routine</option>
                </select>
              </div>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="card table-card">
            {loading ? (
              <div className="p-6 text-center text-muted">
                <Activity className="spinner-icon" size={28} />
                <p>Loading referral registry...</p>
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-6 text-center text-muted">
                <p>No referrals found matching your query.</p>
                <button className="btn-outline mt-2" onClick={() => { setSearchQuery(''); setStatusFilter('All'); setUrgencyFilter('All'); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="referrals-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Patient</th>
                      <th>Clinical Diagnosis</th>
                      <th>Transfer Route</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((ref) => {
                      const patientName = ref.patientId?.fullName || ref.patientId?.name || 'Anonymous';
                      const isSelected = selectedReferral?._id === ref._id;

                      return (
                        <tr 
                          key={ref._id} 
                          className={isSelected ? 'selected-row' : ''}
                        >
                          <td>
                            <span className="ref-code">{ref.referralId}</span>
                          </td>
                          <td>
                            <strong>{patientName}</strong>
                            <div className="text-xs text-muted">
                              {ref.patientId?.age ? `${ref.patientId.age} yrs` : ''} &bull; {ref.patientId?.gender || ''}
                            </div>
                          </td>
                          <td>
                            <p className="table-diagnosis">{ref.diagnosis}</p>
                          </td>
                          <td>
                            <div className="route-cell">
                              <span className="dept-tag">{ref.destinationDepartment}</span>
                              <span className="dest-hosp">{ref.destinationHospitalId?.name || 'Destination Center'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`urgency-tag ${getUrgencyClass(ref.urgency)}`}>
                              {ref.urgency}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(ref.status)}`}>
                              {ref.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button 
                                className="btn-table-action"
                                title="Inspect Journey & Update"
                                onClick={() => {
                                  setSelectedReferral(ref);
                                  setActiveTab('details');
                                }}
                              >
                                <Eye size={15} /> Inspect
                              </button>
                              <button 
                                className="btn-table-icon"
                                title="Print Passport Slip"
                                onClick={() => {
                                  setSelectedReferral(ref);
                                  setShowSlipModal(true);
                                }}
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}



      {/* TAB 3: MEDIBRIDGE JOURNEY */}
      {activeTab === 'details' && (
        <div className="details-layout animate-fade-in">
          {selectedReferral ? (
            <>
              {/* Left Column: Dynamic Timeline */}
              <div className="card timeline-card">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3>Referral Journey</h3>
                    <p className="text-xs text-muted">Auditable blockchain-style ledger</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(selectedReferral.status)}`}>
                    {selectedReferral.status}
                  </span>
                </div>
                
                <div className="timeline">
                  {stages.map((stageName, index) => {
                    const historyItem = getStageHistory(stageName);
                    const isPassed = index <= currentStageIndex;
                    const isCurrent = stageName === selectedReferral.status;

                    return (
                      <div 
                        key={stageName} 
                        className={`timeline-item ${isCurrent ? 'current' : isPassed ? 'completed' : ''}`}
                      >
                        <div className="marker"></div>
                        <div className="content">
                          <h4>{stageName}</h4>
                          {historyItem ? (
                            <>
                              <p className="time">{new Date(historyItem.timestamp).toLocaleString()}</p>
                              {historyItem.note && <p className="history-note">{historyItem.note}</p>}
                            </>
                          ) : (
                            <p className="pending-text">Pending clinical execution</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  className="btn-outline w-full mt-6 flex items-center justify-center gap-2"
                  onClick={() => setShowSlipModal(true)}
                >
                  <Printer size={16} /> Print Official Passport Slip
                </button>
              </div>

              {/* Right Column: Clinical Details */}
              <div className="details-content">
                <div className="card mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className={`urgency-tag ${getUrgencyClass(selectedReferral.urgency)} mb-2 inline-block`}>
                        {selectedReferral.urgency} Priority
                      </span>
                      <h3 className="section-title mb-0" style={{border: 'none', padding: 0}}>
                        {selectedReferral.patientId?.fullName || selectedReferral.patientId?.name}
                      </h3>
                    </div>
                    <span className="avatar-circle">
                      {(selectedReferral.patientId?.fullName || selectedReferral.patientId?.name || 'P').substring(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div>
                      <label>Age & Gender</label>
                      <p>{selectedReferral.patientId?.age} yrs &bull; {selectedReferral.patientId?.gender}</p>
                    </div>
                    <div>
                      <label>Passport Ref ID</label>
                      <p className="font-mono text-primary font-bold">{selectedReferral.referralId}</p>
                    </div>
                    <div>
                      <label>Patient Contact</label>
                      <p>{selectedReferral.patientId?.contactNumber || selectedReferral.patientId?.contact || '+91 98765 43210'}</p>
                    </div>
                  </div>
                  
                  <div className="facility-info mt-4 pt-4 border-top">
                    <div className="mb-2">
                      <label>Originating Medical Center</label>
                      <p>{selectedReferral.originHospitalId?.name || 'District Hospital, Pune'}</p>
                    </div>
                    <div>
                      <label>Destination Receiving Center</label>
                      <p className="font-semibold text-main">{selectedReferral.destinationHospitalId?.name || 'State General Hospital'}</p>
                      <p className="text-muted text-sm">{selectedReferral.destinationDepartment} Department</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="mb-2">Chief Complaint & Diagnosis</h3>
                  <div className="diagnosis-box">
                    <p className="diagnosis-text">{selectedReferral.diagnosis}</p>
                  </div>

                  <h3 className="mt-6 mb-3">Clinical Audit Trail</h3>
                  <div className="attachments-list">
                    {(selectedReferral.history || []).map((h, i) => (
                      <div className="attachment-item" key={i}>
                        <div className="status-dot-mini"></div>
                        <div className="flex-1 ml-3">
                          <div className="flex justify-between items-center">
                            <h4>{h.status}</h4>
                            <span className="text-xs text-muted">{new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm text-muted">{h.note || 'Milestone logged'}</p>
                          <p className="text-xs text-muted mt-1">{new Date(h.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-top flex justify-between items-center">

                    <button 
                      className="btn-primary" 
                      onClick={() => setShowSlipModal(true)}
                    >
                      <Printer size={16} /> Digital Slip
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center p-8 text-muted w-full">
              <p>No referral selected. Choose a patient from the Directory to view their passport journey.</p>
              <button className="btn-primary mt-4" onClick={() => setActiveTab('list')}>
                Open Directory
              </button>
            </div>
          )}
        </div>
      )}

      {/* PRINTABLE REFERRAL SLIP MODAL */}
      {showSlipModal && selectedReferral && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowSlipModal(false)}>
          <div className="modal-card print-slip-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Printer size={18} color="#dc2626" />
                <h3>Official Patient MediBridge</h3>
              </div>
              <button className="close-btn" onClick={() => setShowSlipModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body print-slip-body" id="printable-passport">
              <div className="slip-official-header">
                <div className="gov-emblem">
                  <Building2 size={28} color="#dc2626" />
                </div>
                <div>
                  <h4>GOVERNMENT HEALTHCARE NETWORK</h4>
                  <h5>INTER-HOSPITAL DIGITAL TRANSFER PASSPORT</h5>
                  <p className="text-xs text-muted">Ministry of Health &bull; National Digital Health Mission</p>
                </div>
              </div>

              <div className="slip-qr-box">
                <QrCode size={110} color="#0f172a" />
                <div className="slip-qr-meta">
                  <span className="slip-ref-code">{selectedReferral.referralId}</span>
                  <p>Status: <strong>{selectedReferral.status}</strong></p>
                  <p>Priority: <strong className="text-red">{selectedReferral.urgency}</strong></p>
                  <p className="text-xs text-muted">Issued: {new Date(selectedReferral.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="slip-section">
                <h6 className="slip-section-title">1. PATIENT DEMOGRAPHICS</h6>
                <div className="slip-grid">
                  <div><strong>Full Name:</strong> {selectedReferral.patientId?.fullName || selectedReferral.patientId?.name}</div>
                  <div><strong>Age / Gender:</strong> {selectedReferral.patientId?.age} yrs / {selectedReferral.patientId?.gender}</div>
                  <div><strong>Contact:</strong> {selectedReferral.patientId?.contactNumber || selectedReferral.patientId?.contact || 'N/A'}</div>
                  <div><strong>ID Type:</strong> Aadhaar / ABHA Verified</div>
                </div>
              </div>

              <div className="slip-section">
                <h6 className="slip-section-title">2. TRANSFER ROUTING</h6>
                <div className="slip-grid">
                  <div><strong>Origin:</strong> {selectedReferral.originHospitalId?.name || 'District Hospital, Pune'}</div>
                  <div><strong>Destination:</strong> {selectedReferral.destinationHospitalId?.name || 'State General Hospital'}</div>
                  <div><strong>Department:</strong> {selectedReferral.destinationDepartment}</div>
                  <div><strong>Doctor:</strong> Dr. Rajesh Kumar (MCI-489201)</div>
                </div>
              </div>

              <div className="slip-section">
                <h6 className="slip-section-title">3. CLINICAL SUMMARY</h6>
                <div className="slip-diagnosis">
                  {selectedReferral.diagnosis}
                </div>
              </div>

              <div className="slip-footer-stamp">
                <div>
                  <p className="text-xs text-muted">Authorized Digital Healthcare Signature</p>
                  <p className="stamp-text">GOV-DIGITAL-AUTH-VERIFIED</p>
                </div>
                <div className="stamp-box">
                  PASSPORT VERIFIED
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowSlipModal(false)}>
                Close
              </button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  window.print();
                }}
              >
                <Download size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;

