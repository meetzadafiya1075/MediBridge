import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, PlusCircle, TrendingUp, Clock, FileText, 
  CheckCircle2, Activity, ArrowRight, ShieldCheck, Calendar, X 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { api } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalReferrals: 5,
    activeReferrals: 3,
    closedReferrals: 2,
    avgTurnaroundTime: '3.8 days',
    closureRate: '40.0',
    trend: [35, 48, 55, 42, 68, 75, 82]
  });
  const [loading, setLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [referralsData, analyticsData] = await Promise.all([
          api.getReferrals().catch(() => []),
          api.getAnalytics().catch(() => null)
        ]);

        if (referralsData && referralsData.length > 0) {
          setRecentReferrals(referralsData.slice(0, 5));
        }
        if (analyticsData) {
          setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Referred': return 'badge-referred';
      case 'Received': return 'badge-received';
      case 'Seen': return 'badge-seen';
      case 'Closed': return 'badge-closed';
      default: return 'badge-referred';
    }
  };

  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency) {
      case 'Emergency': return 'urgency-pill-emergency';
      case 'Urgent': return 'urgency-pill-urgent';
      default: return 'urgency-pill-routine';
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recent';
    const date = new Date(dateStr);
    const diffHours = Math.floor((new Date() - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="dashboard animate-fade-in">
      {/* Network Live Banner removed */}

      <div className="dashboard-header mb-4">
        <div>
          <h2>Clinical Command Dashboard</h2>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Initiate New Referral */}
        <div className="card initiate-card">
          <div>
            <span className="card-badge">Digital Passport</span>
            <h3>Initiate New Referral</h3>
          </div>
          <Link to="/create-referral" className="btn-primary">
            <PlusCircle size={18} /> New Referral
          </Link>
        </div>

        {/* Volume Trends */}
        <div className="card trends-card">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3>Weekly Referral Volume</h3>
            </div>
            <span className="trend-stat-chip text-green">
              <TrendingUp size={14} /> +14%
            </span>
          </div>
          <div className="mock-chart">
            {(analytics.trend || [30, 50, 40, 70, 60, 85, 75]).slice(-7).map((val, idx) => (
              <div 
                key={idx} 
                className="bar" 
                style={{ height: `${Math.max(20, Math.min(val, 95))}%` }}
                title={`${val}% capacity index`}
              ></div>
            ))}
          </div>
          <div className="chart-labels">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Metrics Column */}
        <div className="metrics-col">
          <div className="card flex-col justify-center stat-box">
            <div className="metric-header">
              <Clock size={20} color="#8b5cf6" />
              <span>Active Pipeline</span>
            </div>
            <h2 className="metric-value">{analytics.activeReferrals ?? 3}</h2>
          </div>

          <div className="card flex-col justify-center stat-box">
            <div className="metric-header">
              <CheckCircle2 size={20} color="#059669" />
              <span>Total Discharged / Closed</span>
            </div>
            <h2 className="metric-value">{analytics.closedReferrals ?? 2}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2 mt-4">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3>Recent Referral Pipeline</h3>
            </div>
            <Link to="/referrals" className="text-primary font-medium hover-underline flex items-center gap-1">
              View All Referrals <ArrowRight size={15} />
            </Link>
          </div>
          
          <div className="referral-table-wrapper">
            {loading ? (
              <div className="p-4 text-center text-muted">
                <Activity className="spinner-icon" size={24} />
                <p>Loading clinical activity...</p>
              </div>
            ) : recentReferrals.length > 0 ? (
              <table className="referral-table">
                <thead>
                  <tr>
                    <th>Patient Name / Description</th>
                    <th>Age / Gender</th>
                    <th>Ref ID</th>
                    <th>Urgency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReferrals.map((ref) => {
                    const patientName = ref.patientId?.fullName || ref.patientId?.name || 'Anonymous Patient';
                    const patientAge = ref.patientId?.age ? `${ref.patientId.age}y` : '—';
                    const patientGender = ref.patientId?.gender || '';
                    const isEmergency = ref.urgency === 'Emergency';

                    return (
                      <tr
                        key={ref._id}
                        className={`referral-row${isEmergency ? ' referral-row-emergency' : ''}`}
                        onClick={() => navigate(`/referrals?refId=${ref.referralId}`)}
                      >
                        <td>
                          {isEmergency && (
                            <div className="triage-inline-badge">
                              <AlertCircle size={12} /> Priority Triage
                            </div>
                          )}
                          <span className="patient-name">{patientName}</span>
                          <span className="patient-sub">{ref.destinationDepartment} · {ref.destinationHospitalId?.name || 'Destination Center'}</span>
                        </td>
                        <td>
                          <span className="patient-demographic-tag">{patientAge}{patientGender ? `, ${patientGender}` : ''}</span>
                        </td>
                        <td>
                          <span className="ref-id-badge">{ref.referralId}</span>
                        </td>
                        <td>
                          <span className={`urgency-tag ${getUrgencyBadgeClass(ref.urgency)}`}>
                            {ref.urgency || 'Routine'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(ref.status)}`}>
                            {ref.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-muted">
                <p>No recent referrals recorded. Create your first referral to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Consultations / Schedule */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3>Specialist Consult Schedule</h3>
            </div>
            <Calendar size={18} color="#b91c1c" />
          </div>

          <div className="followup-list">
            <div className="followup-item">
              <div className="date-box">
                <span className="month">TODAY</span>
                <span className="day">02:30</span>
              </div>
              <div className="followup-details">
                <h4>Cath-Lab Intake Review: Ramesh Patel</h4>
                <p>Dr. Aditi Joshi &bull; Cardiology Dept.</p>
              </div>
            </div>

            <div className="followup-item">
              <div className="date-box">
                <span className="month">TOM</span>
                <span className="day">10:00</span>
              </div>
              <div className="followup-details">
                <h4>Neurology Tele-Triage: Sunita Sharma</h4>
                <p>OPD Tele-Desk B &bull; Migraine Assessment</p>
              </div>
            </div>

            <div className="followup-item">
              <div className="date-box">
                <span className="month">SEP</span>
                <span className="day">06</span>
              </div>
              <div className="followup-details">
                <h4>Pediatric Sepsis Review: Aarav Kulkarni</h4>
                <p>Pediatric ICU Bed Reservation Follow-up</p>
              </div>
            </div>
          </div>

          <button 
            className="btn-outline w-full mt-4 flex items-center justify-center gap-2"
            onClick={() => setShowCalendarModal(true)}
          >
            <Calendar size={16} /> Open Clinical Intake Calendar
          </button>
        </div>
      </div>

      {/* Calendar Schedule Modal */}
      {showCalendarModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowCalendarModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Calendar size={20} color="#ef4444" />
                <h3>Hospital Clinical Intake Schedule</h3>
              </div>
              <button className="close-btn" onClick={() => setShowCalendarModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="calendar-events-list">
                <div className="calendar-event-card">
                  <div className="event-time">02:30 PM (Today)</div>
                  <div className="event-content">
                    <strong>Ramesh Patel &bull; Emergency Angioplasty Prep</strong>
                    <p>Interventional Cardiology Theatre 2 &bull; State General Hospital</p>
                  </div>
                </div>

                <div className="calendar-event-card">
                  <div className="event-time">04:15 PM (Today)</div>
                  <div className="event-content">
                    <strong>Inter-Facility Bed Status Coordination Call</strong>
                    <p>Maharashtra State Health Triage Net &bull; Dr. Rajesh Kumar presiding</p>
                  </div>
                </div>

                <div className="calendar-event-card">
                  <div className="event-time">10:00 AM (Tomorrow)</div>
                  <div className="event-content">
                    <strong>Sunita Sharma &bull; Neurological EEG Consult</strong>
                    <p>Neuro OPD Room 14 &bull; District Hospital, Pune</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowCalendarModal(false)}>
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

