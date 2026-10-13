import React, { useState, useEffect } from 'react';
import { Activity, MapPin, CheckCircle2, Eye, Printer, Search, X, RefreshCw } from 'lucide-react';
import './Referrals.css';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const ReferredToMe = () => {
  const { addToast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [newStatus, setNewStatus] = useState('Received');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const data = await api.getReferrals();
      
      // Filter ONLY referrals meant for this specific doctor's department and hospital
      const myReferrals = data.filter(r => {
        const hIdMatch = 
          r.destinationHospitalId?._id === currentUser?.hospitalId?._id || 
          r.destinationHospitalId === currentUser?.hospitalId;
        const deptMatch = r.destinationDepartment === (currentUser?.department || currentUser?.departmentName);
        const isOpen = r.status !== 'Forwarded';
        
        return hIdMatch && deptMatch && isOpen;
      });
      
      setReferrals(myReferrals);
      if (myReferrals.length > 0 && !selectedReferral) {
        setSelectedReferral(myReferrals[0]);
        setNewStatus(myReferrals[0].status);
      }
    } catch (error) {
      console.error("Error fetching referrals", error);
      addToast("Failed to load referrals", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedReferral) return;
    setUpdating(true);
    try {
      const updated = await api.updateReferralStatus(selectedReferral._id, newStatus, note);
      addToast(`Referral updated to ${newStatus}`, "success");
      
      setSelectedReferral(updated);
      setReferrals(prev => prev.map(r => r._id === updated._id ? updated : r));
      setNote('');
    } catch (error) {
      addToast("Failed to update referral", "error");
    } finally {
      setUpdating(false);
    }
  };

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

  const filteredReferrals = referrals.filter(r => {
    const patientName = r.patientId?.fullName || r.patientId?.name || '';
    return patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.referralId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="referrals-page animate-fade-in">
      <div className="page-header mb-4 flex justify-between items-start">
        <div>
          <h2>Referred to Me</h2>
          <p>Incoming clinical referrals assigned to your specialty and facility.</p>
        </div>
        <button className="btn-outline" onClick={fetchReferrals} title="Refresh records">
          <RefreshCw size={16} className={loading && 'spinner-icon'} /> Refresh
        </button>
      </div>

      <div className="details-layout animate-fade-in" style={{ gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '20px', display: 'grid' }}>
        
        {/* Left Column: My Patient Referrals List */}
        <div className="card" style={{ height: 'fit-content', padding: '0' }}>
           <div className="p-4 border-bottom">
             <div className="search-input-box mb-0" style={{ width: '100%' }}>
               <Search size={18} className="search-icon" />
               <input 
                 type="text" 
                 placeholder="Search referred patients..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ width: '100%' }}
               />
               {searchQuery && (
                 <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                   <X size={15} />
                 </button>
               )}
             </div>
           </div>

           <div className="table-responsive" style={{ maxHeight: '650px', overflowY: 'auto' }}>
            {loading ? (
              <div className="p-6 text-center text-muted">Loading your referrals...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-6 text-center text-muted">No specific referrals routed to your department yet.</div>
            ) : (
               <table className="referrals-table">
                  <tbody>
                    {filteredReferrals.map(ref => {
                       const patientName = ref.patientId?.fullName || ref.patientId?.name || 'Anonymous';
                       const isSelected = selectedReferral?._id === ref._id;

                       return (
                         <tr 
                           key={ref._id} 
                           className={isSelected ? 'selected-row cursor-pointer' : 'cursor-pointer'}
                           onClick={() => {
                             setSelectedReferral(ref);
                             setNewStatus(ref.status);
                           }}
                           style={{ cursor: 'pointer' }}
                         >
                           <td style={{ padding: '16px' }}>
                             <div className="flex justify-between items-start mb-2">
                               <strong className="text-main" style={{ fontSize: '1.05rem' }}>{patientName}</strong>
                               <span className={`badge ${getStatusBadgeClass(ref.status)}`}>{ref.status}</span>
                             </div>
                             <div className="text-muted text-sm mb-2">
                               {ref.patientId?.age ? `${ref.patientId.age} yrs` : ''} &bull; {ref.patientId?.gender || ''}
                             </div>
                             <div className="flex justify-between items-center text-xs">
                               <span className="font-mono">{ref.referralId}</span>
                               <span className={`urgency-tag ${getUrgencyClass(ref.urgency)}`}>{ref.urgency}</span>
                             </div>
                           </td>
                         </tr>
                       )
                    })}
                  </tbody>
               </table>
            )}
           </div>
        </div>

        {/* Right Column: Details & Status Update Form */}
        {selectedReferral ? (
           <div className="status-update-card" style={{ height: 'fit-content' }}>
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 style={{fontSize: '1.4rem', marginBottom: '8px', border: 'none', padding: 0}}>
                      {selectedReferral.patientId?.fullName || selectedReferral.patientId?.name}
                    </h3>
                    <p className="text-muted text-sm">
                      {selectedReferral.patientId?.age} yrs, {selectedReferral.patientId?.gender} &bull; {selectedReferral.patientId?.contactNumber || selectedReferral.patientId?.contact || 'N/A'}
                    </p>
                  </div>
                  <span className={`urgency-tag ${getUrgencyClass(selectedReferral.urgency)}`}>
                      {selectedReferral.urgency} Priority
                  </span>
                </div>
                
                <div className="mb-6 p-4 rounded bg-gray-50 border">
                   <p className="text-sm text-muted mb-1">Clinical Diagnosis / Reason for Referral:</p>
                   <p className="font-medium text-main" style={{ whiteSpace: 'pre-wrap' }}>{selectedReferral.diagnosis}</p>
                </div>
                
                <div className="status-updater border-top pt-6">
                  <h4 className="mb-4">Transition Active Status</h4>
                  <div className="status-buttons">
                    <button 
                      className={`status-btn ${newStatus === 'Received' ? 'active' : ''}`} 
                      onClick={() => setNewStatus('Received')}
                    >
                      <MapPin size={20} />
                      <span>Received at Ward</span>
                    </button>
                    <button 
                      className={`status-btn ${newStatus === 'Seen' ? 'active' : ''}`} 
                      onClick={() => setNewStatus('Seen')}
                    >
                      <Activity size={20} />
                      <span>Seen by Specialist</span>
                    </button>
                    <button 
                      className={`status-btn ${newStatus === 'Closed' ? 'active' : ''}`} 
                      onClick={() => setNewStatus('Closed')}
                    >
                      <CheckCircle2 size={20} />
                      <span>Discharged / Closed</span>
                    </button>
                  </div>
                  
                  <div className="form-group mt-5">
                    <label>Clinical Notes / Interventions</label>
                    <textarea 
                      rows="3" 
                      placeholder="Enter handover details, bedside observations, or discharge summary..." 
                      value={note} 
                      onChange={e => setNote(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="mt-5">
                    <button 
                      className="btn-primary w-full p-3 text-sm font-semibold" 
                      onClick={handleStatusUpdate} 
                      disabled={updating}
                    >
                      {updating ? 'Committing Record...' : `Confirm & Transition Status`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        ) : (
            <div className="card text-center p-8 text-muted flex items-center justify-center h-full">
              <p>Select a patient referral from the list to view exact clinical notes and update their treatment status.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReferredToMe;
