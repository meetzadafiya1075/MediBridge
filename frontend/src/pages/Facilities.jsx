import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, Filter, Phone, MapPin, Bed, Activity, 
  ArrowRight, ShieldCheck, AlertCircle, X, ExternalLink, CheckCircle2,
  Plus
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import './Facilities.css';

const Facilities = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeModalFacility, setActiveModalFacility] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', location: '', address: '', type: 'General Hospital',
    contactNumber: '', departments: '', totalBeds: 200, availableBeds: 50, icuAvailable: 10
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const data = await api.getHospitals();
      setFacilities(data);
    } catch (error) {
      console.error('Failed to load facilities', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...addForm,
        departments: addForm.departments.split(',').map(d => d.trim()).filter(d => d)
      };
      await api.createHospital(payload);
      setShowAddModal(false);
      setAddForm({ name: '', location: '', address: '', type: 'General Hospital', contactNumber: '', departments: '', totalBeds: 200, availableBeds: 50, icuAvailable: 10 });
      fetchFacilities(); // reload list
    } catch (error) {
      alert("Failed to add facility");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique departments across all facilities
  const allDepartments = ['All', ...new Set(facilities.flatMap(f => f.departments || []))];

  // Filter facilities
  const filteredFacilities = facilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (f.address && f.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === 'All' || (f.departments && f.departments.includes(selectedDept));
    const matchesStatus = selectedStatus === 'All' || f.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleReferClick = (hospitalId) => {
    navigate(`/create-referral?hospitalId=${hospitalId}`);
  };

  const totalBeds = facilities.reduce((sum, f) => sum + (f.totalBeds || 200), 0);
  const availableBeds = facilities.reduce((sum, f) => sum + (f.availableBeds || 45), 0);
  const totalICU = facilities.reduce((sum, f) => sum + (f.icuAvailable || 8), 0);

  return (
    <div className="facilities-page animate-fade-in">
      <div className="page-header mb-6 flex justify-between items-start">
        <div>
          <h2>Network Facilities Directory</h2>
          <p>Explore authorized hospitals, monitor real-time bed & ICU capacities, and route urgent transfers.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add New Facility
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/create-referral')}>
              <Building2 size={18} /> New Referral
            </button>
          )}
        </div>
      </div>

      {/* Facilities Overview Stats Bar */}
      <div className="facility-stats-grid mb-6">
        <div className="card stat-mini">
          <div className="stat-icon-wrapper blue">
            <Building2 size={22} />
          </div>
          <div>
            <span className="stat-label">Network Facilities</span>
            <h3>{facilities.length} Hospitals</h3>
          </div>
        </div>

        <div className="card stat-mini">
          <div className="stat-icon-wrapper green">
            <Bed size={22} />
          </div>
          <div>
            <span className="stat-label">General Beds Available</span>
            <h3>{availableBeds} <small>/ {totalBeds}</small></h3>
          </div>
        </div>

        <div className="card stat-mini">
          <div className="stat-icon-wrapper purple">
            <Activity size={22} />
          </div>
          <div>
            <span className="stat-label">ICU Units Ready</span>
            <h3>{totalICU} Critical Units</h3>
          </div>
        </div>

        <div className="card stat-mini">
          <div className="stat-icon-wrapper teal">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="stat-label">Network Protocol</span>
            <h3>NABH Verified</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card filter-bar mb-6">
        <div className="search-input-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by hospital name, city, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns">
          <div className="select-wrapper">
            <Filter size={16} className="dropdown-icon" />
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              {allDepartments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="All">All Operational Statuses</option>
              <option value="Operational">Operational</option>
              <option value="High Load">High Load</option>
              <option value="Emergency Only">Emergency Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      {loading ? (
        <div className="loading-state card">
          <Activity className="spinner-icon" size={32} />
          <p>Loading network facilities and capacity data...</p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="empty-state card">
          <AlertCircle size={40} color="#94a3b8" />
          <h3>No Facilities Found</h3>
          <p>No facilities match your search criteria. Try modifying your search or filters.</p>
          <button className="btn-outline mt-4" onClick={() => { setSearchQuery(''); setSelectedDept('All'); setSelectedStatus('All'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="facilities-grid">
          {filteredFacilities.map((hospital) => {
            const bedPercentage = Math.round(((hospital.availableBeds || 45) / (hospital.totalBeds || 200)) * 100);
            const isHighLoad = hospital.status === 'High Load' || bedPercentage < 15;

            return (
              <div className="facility-card card" key={hospital._id}>
                <div className="facility-card-header">
                  <div>
                    <span className="facility-type-tag">{hospital.type || 'Government Hospital'}</span>
                    <h3 className="facility-title">{hospital.name}</h3>
                  </div>
                  <span className={`status-pill ${hospital.status === 'High Load' ? 'high-load' : 'operational'}`}>
                    {hospital.status || 'Operational'}
                  </span>
                </div>

                <div className="facility-location">
                  <MapPin size={16} className="loc-icon" />
                  <span>{hospital.address || `${hospital.location}, Maharashtra`}</span>
                </div>

                <div className="facility-contact">
                  <Phone size={15} className="phone-icon" />
                  <a href={`tel:${hospital.contactNumber || '1234567890'}`}>
                    {hospital.contactNumber || '+91 20 2612 8000'}
                  </a>
                </div>

                <div className="capacity-container">
                  <div className="capacity-header">
                    <span>Bed Occupancy</span>
                    <strong>{hospital.availableBeds || 45} Beds Free ({bedPercentage}%)</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className={`progress-fill ${isHighLoad ? 'warning-fill' : 'success-fill'}`} 
                      style={{ width: `${100 - bedPercentage}%` }}
                    ></div>
                  </div>
                  <div className="capacity-meta">
                    <span>Total Beds: {hospital.totalBeds || 200}</span>
                    <span className="icu-chip">
                      <Activity size={12} className="inline mr-1" />
                      <strong>{hospital.icuAvailable || 8} ICU Free</strong>
                    </span>
                  </div>
                </div>

                <div className="departments-tags">
                  <span className="dept-label">Departments:</span>
                  <div className="dept-list">
                    {(hospital.departments || []).map((dept, i) => (
                      <span key={i} className="dept-pill">{dept}</span>
                    ))}
                  </div>
                </div>

                <div className="facility-card-actions">
                  <button 
                    className="btn-outline btn-sm flex-1"
                    onClick={() => setActiveModalFacility(hospital)}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn-primary btn-sm flex-1"
                    onClick={() => handleReferClick(hospital._id)}
                  >
                    Refer Patient <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Facility Details Modal */}
      {activeModalFacility && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setActiveModalFacility(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-info">{activeModalFacility.type || 'Government Referral Center'}</span>
                <h3 className="mt-1">{activeModalFacility.name}</h3>
              </div>
              <button className="close-btn" onClick={() => setActiveModalFacility(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-block mb-4">
                <label>Address & Location</label>
                <p><MapPin size={16} className="inline mr-1 text-primary" /> {activeModalFacility.address || activeModalFacility.location}</p>
              </div>

              <div className="info-grid-2 mb-4">
                <div className="info-block">
                  <label>Emergency Transfer Line</label>
                  <p><Phone size={16} className="inline mr-1 text-primary" /> {activeModalFacility.contactNumber || 'N/A'}</p>
                </div>
                <div className="info-block">
                  <label>Current Status</label>
                  <span className={`status-pill ${activeModalFacility.status === 'High Load' ? 'high-load' : 'operational'}`}>
                    {activeModalFacility.status || 'Operational'}
                  </span>
                </div>
              </div>

              <div className="info-grid-2 mb-4">
                <div className="info-block">
                  <label>Total Inpatient Beds</label>
                  <p className="text-large">{activeModalFacility.totalBeds || 250}</p>
                </div>
                <div className="info-block">
                  <label>Current Available Vacancies</label>
                  <p className="text-large text-green">{activeModalFacility.availableBeds || 50} Regular &bull; {activeModalFacility.icuAvailable || 10} ICU</p>
                </div>
              </div>

              <div className="info-block mb-4">
                <label>Specialized Clinical Departments</label>
                <div className="dept-list mt-2">
                  {(activeModalFacility.departments || []).map((d, i) => (
                    <span key={i} className="dept-pill active-dept">{d}</span>
                  ))}
                </div>
              </div>

              <div className="protocol-box">
                <CheckCircle2 size={20} color="#059669" />
                <div>
                  <strong>Transfer Protocol Requirements</strong>
                  <p>Accepts standardized digital MediBridge. Digital file transfer and patient triage verification will be acknowledged within 15 minutes of submission.</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setActiveModalFacility(null)}>
                Close
              </button>
              {!isAdmin && (
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    const id = activeModalFacility._id;
                    setActiveModalFacility(null);
                    handleReferClick(id);
                  }}
                >
                  Initiate Referral to this Facility <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Admin Add Facility Modal */}
      {showAddModal && createPortal(
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Building2 size={22} color="#0f172a" />
                <h3>Integrate New Hospital</h3>
              </div>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleAddSubmit} id="addFacilityForm">
                <div className="info-block mb-3">
                  <label>Facility Name</label>
                  <input type="text" name="name" value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required placeholder="e.g. Apollo Super Specialty" />
                </div>
                <div className="info-grid-2 mb-3">
                  <div className="info-block">
                    <label>City / Region</label>
                    <input type="text" name="location" value={addForm.location} onChange={(e) => setAddForm({...addForm, location: e.target.value})} required placeholder="e.g. Pune" />
                  </div>
                  <div className="info-block">
                    <label>Contact Number</label>
                    <input type="text" name="contactNumber" value={addForm.contactNumber} onChange={(e) => setAddForm({...addForm, contactNumber: e.target.value})} required placeholder="+91..." />
                  </div>
                </div>
                <div className="info-block mb-3">
                  <label>Full Address</label>
                  <input type="text" name="address" value={addForm.address} onChange={(e) => setAddForm({...addForm, address: e.target.value})} required />
                </div>
                <div className="info-grid-2 mb-3">
                  <div className="info-block">
                    <label>Total Beds</label>
                    <input type="number" name="totalBeds" value={addForm.totalBeds} onChange={(e) => setAddForm({...addForm, totalBeds: parseInt(e.target.value)})} required />
                  </div>
                  <div className="info-block">
                    <label>Total ICU</label>
                    <input type="number" name="icuAvailable" value={addForm.icuAvailable} onChange={(e) => setAddForm({...addForm, icuAvailable: parseInt(e.target.value)})} required />
                  </div>
                </div>
                <div className="info-block mb-3">
                  <label>Available Departments (Comma Separated)</label>
                  <input type="text" name="departments" value={addForm.departments} onChange={(e) => setAddForm({...addForm, departments: e.target.value})} required placeholder="e.g. Cardiology, Neurology, Orthopedics" />
                </div>
              </form>
            </div>
            
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowAddModal(false)} type="button">Cancel</button>
              <button className="btn-primary" type="submit" form="addFacilityForm" disabled={isSubmitting}>
                {isSubmitting ? 'Integrating...' : 'Register Facility'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Facilities;
