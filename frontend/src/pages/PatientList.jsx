import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, FileText, X, UserCircle, Activity, Calendar } from 'lucide-react';
import { api } from '../services/api';
import './PatientList.css';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-list-container animate-fade-in">
      <div className="page-header custom-header">
        <div>
          <h1>Patient Directory</h1>
          <p>Global registry of all permanently registered patients across network hospitals.</p>
        </div>
        <div className="stats-badge">
          <Users size={18} />
          <strong>{patients.length}</strong> Registered
        </div>
      </div>

      <div className="patient-list-content">
        <div className="card table-card">
          {loading ? (
            <div className="loading-state">Loading patient directory...</div>
          ) : patients.length === 0 ? (
            <div className="empty-state">No patients registered in the database yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Age/Gender</th>
                    <th>Contact</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient._id}>
                      <td className="font-medium text-main">{patient.fullName}</td>
                      <td><span className="badge">{patient.age}Y • {patient.gender}</span></td>
                      <td className="text-muted">{patient.contactNumber}</td>
                      <td className="text-small text-muted">{patient._id.substring(0, 8)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PatientList;
