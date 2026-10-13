import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Download, Filter, FileText, Clock, 
  CheckCircle, Activity, AlertTriangle, Printer, RefreshCw 
} from 'lucide-react';
import './Analytics.css';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const Analytics = () => {
  const { addToast } = useToast();
  const [data, setData] = useState({
    totalReferrals: 5,
    closedReferrals: 2,
    activeReferrals: 3,
    avgTurnaroundTime: '3.8 days',
    closureRate: '40.0',
    statusBreakdown: { Referred: 2, Received: 1, Seen: 1, Closed: 1 },
    urgencyBreakdown: { Emergency: 1, Urgent: 2, Routine: 2 },
    departments: [
      { name: 'Cardiology', count: 2 },
      { name: 'Neurology', count: 1 },
      { name: 'Pediatrics', count: 1 },
      { name: 'Orthopedics', count: 1 }
    ],
    trend: [22, 35, 40, 32, 58, 64, 75, 70, 82, 90]
  });

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedHospital, setSelectedHospital] = useState('All Hospitals');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  useEffect(() => {
    // Load hospital options
    api.getHospitals().then(h => setHospitals(h)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedHospital, selectedStatus]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange !== 'All Time') params.days = dateRange;
      if (selectedHospital !== 'All Hospitals') params.hospitalId = selectedHospital;
      if (selectedStatus !== 'All Statuses') params.status = selectedStatus;

      const stats = await api.getAnalytics(params);
      setData(stats);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      addToast('Failed to refresh analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Referrals', data.totalReferrals],
      ['Active Pipeline', data.activeReferrals],
      ['Closed Referrals', data.closedReferrals],
      ['Average Turnaround Time', data.avgTurnaroundTime],
      ['Closure Rate (%)', data.closureRate],
      ['Emergency Transfers', data.urgencyBreakdown?.Emergency || 0],
      ['Urgent Transfers', data.urgencyBreakdown?.Urgent || 0],
      ['Routine Transfers', data.urgencyBreakdown?.Routine || 0],
      [],
      ['Department', 'Referral Count'],
      ...(data.departments || []).map(d => [d.name, d.count])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `referral_analytics_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Executive Analytics CSV downloaded', 'success');
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

  return (
    <div className="analytics-page animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="page-header">
          <h2>Clinical Intelligence & Analytics</h2>
          <p>System-wide referral throughput, bottleneck detection, and department utilization.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select 
            className="date-select" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="All Time">All Recorded Time</option>
          </select>

          <select 
            className="date-select"
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
          >
            <option value="All Hospitals">All Network Hospitals</option>
            {hospitals.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>

          <select 
            className="date-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All Statuses">All Lifecycle Statuses</option>
            <option value="Referred">Referred</option>
            <option value="Received">Received</option>
            <option value="Seen">Seen by Dr.</option>
            <option value="Closed">Closed</option>
          </select>

          <button className="btn-outline" onClick={exportToCSV} title="Export CSV Report">
            <Download size={16} className="inline mr-1" /> Export CSV
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="metrics-row">
        <div className="card stat-card">
          <p className="text-muted mb-2">Total Referrals Generated</p>
          <div className="flex items-center justify-between">
            <h2>{data.totalReferrals}</h2>
            <div className="icon-bg green"><FileText size={20} /></div>
          </div>
          <span className="stat-subtext text-green">+18% vs previous month</span>
        </div>
        
        <div className="card stat-card">
          <p className="text-muted mb-2">Active Transfer Queue</p>
          <div className="flex items-center justify-between">
            <h2>{data.activeReferrals ?? 3}</h2>
            <div className="icon-bg blue"><Activity size={20} /></div>
          </div>
          <span className="stat-subtext text-blue">Inward & Transit Triage</span>
        </div>

        <div className="card stat-card">
          <p className="text-muted mb-2">Avg Hospital Turnaround</p>
          <div className="flex items-center justify-between">
            <h2>{data.avgTurnaroundTime}</h2>
            <div className="icon-bg purple"><Clock size={20} /></div>
          </div>
          <span className="stat-subtext">Intake to discharge</span>
        </div>

        <div className="card stat-card">
          <p className="text-muted mb-2">Completion & Closure Rate</p>
          <div className="flex items-center justify-between">
            <h2>{data.closureRate}%</h2>
            <div className="icon-bg teal"><CheckCircle size={20} /></div>
          </div>
          <span className="stat-subtext text-green">Target: &gt;75%</span>
        </div>
      </div>

      {/* Urgency Breakdown Strip */}
      <div className="urgency-analytics-grid mt-6">
        <div className="card urgency-mini-card emergency-border">
          <div className="flex items-center justify-between">
            <span className="urgency-title text-red">
              <AlertTriangle size={15} className="inline mr-1" /> Emergency Triage
            </span>
            <strong className="text-large text-red">{data.urgencyBreakdown?.Emergency || 0}</strong>
          </div>
          <p className="text-xs text-muted mt-1">Requires immediate specialist handover</p>
        </div>

        <div className="card urgency-mini-card urgent-border">
          <div className="flex items-center justify-between">
            <span className="urgency-title text-orange">
              <Clock size={15} className="inline mr-1" /> Urgent Queue
            </span>
            <strong className="text-large text-orange">{data.urgencyBreakdown?.Urgent || 0}</strong>
          </div>
          <p className="text-xs text-muted mt-1">Under 24-48 hour window</p>
        </div>

        <div className="card urgency-mini-card routine-border">
          <div className="flex items-center justify-between">
            <span className="urgency-title text-blue">
              <CheckCircle size={15} className="inline mr-1" /> Routine Referrals
            </span>
            <strong className="text-large text-main">{data.urgencyBreakdown?.Routine || 0}</strong>
          </div>
          <p className="text-xs text-muted mt-1">Elective OPD appointments</p>
        </div>
      </div>

      {/* Secondary Row: Trend Chart & Department Distribution */}
      <div className="analytics-grid-2 mt-6">
        {/* Trend Over Time */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3>Monthly Throughput Trend</h3>
              <p className="text-xs text-muted">Historical volume scaling across state network</p>
            </div>
            <button className="btn-outline btn-sm" onClick={() => window.print()}>
              <Printer size={15} className="inline mr-1" /> Print Chart
            </button>
          </div>
          
          <div className="mock-analytics-chart">
            <div className="chart-bars">
              {(data.trend && data.trend.length > 0 ? data.trend : [30, 45, 60, 50, 75, 85, 90]).map((val, i) => (
                <div key={i} className="bar-wrapper" title={`${months[i] || 'M'}: ${val}% Volume Index`}>
                  <div className="bar" style={{ height: `${Math.max(15, Math.min(val, 95))}%` }}></div>
                  <span className="bar-val-hover">{val}</span>
                </div>
              ))}
            </div>
            <div className="chart-months">
              {months.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3>Transfers by Department</h3>
              <p className="text-xs text-muted">Top specialized clinical destinations</p>
            </div>
          </div>

          <div className="department-bars-list">
            {(data.departments && data.departments.length > 0 ? data.departments : [
              { name: 'Cardiology', count: 3 },
              { name: 'Neurology', count: 2 },
              { name: 'Pediatrics', count: 1 },
              { name: 'Orthopedics', count: 1 }
            ]).map((dept, i) => {
              const maxCount = Math.max(...(data.departments || [{ count: 3 }]).map(d => d.count), 1);
              const percentage = Math.round((dept.count / maxCount) * 100);

              return (
                <div key={i} className="dept-stat-row">
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <strong>{dept.name}</strong>
                    <span className="text-muted">{dept.count} cases</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-fill success-fill" 
                      style={{ width: `${Math.max(10, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

