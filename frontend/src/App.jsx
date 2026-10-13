import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Bell, LogOut, ShieldCheck, User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateReferral from './pages/CreateReferral';
import Referrals from './pages/Referrals';
import ReferredToMe from './pages/ReferredToMe';
import Facilities from './pages/Facilities';

import Settings from './pages/Settings';
import Patients from './pages/Patients';
import ScanQR from './pages/ScanQR';
import PatientList from './pages/PatientList';
import HospitalApplicationForm from './pages/HospitalApplicationForm';
import AdminApplications from './pages/AdminApplications';
import { ToastProvider } from './components/Toast';
import { api } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('token'));
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const handleLogin = (userData) => {
    if (userData) {
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      api.getUserSettings().then(userData => {
        if (userData) {
          setCurrentUser(prevUser => {
            const updatedUser = { 
              ...prevUser, 
              ...userData,
              hospitalName: userData.hospitalId ? userData.hospitalId.name : (userData.hospitalName || prevUser?.hospitalName || 'System Administration')
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      }).catch(err => {
        console.error('Failed to sync user data', err);
      });
    }
  }, [isAuthenticated]);

  // Top header and layout wrapper
  const AppLayout = ({ children }) => (
    <div className="app-container">
      <Sidebar currentUser={currentUser} onLogout={handleLogout} />
      <div className="main-content-wrapper">
        <header className="top-header">
          <div className="system-health-badge">
            <span className="live-indicator"></span>
            <span>GovHealth Network: <strong>Online & Synced</strong></span>
          </div>

          <div className="top-header-actions">
            <div className="network-facility-badge">
              <ShieldCheck size={16} color="#ef4444" />
              <span>{currentUser?.hospitalName || 'GovHealth Administration'}</span>
            </div>

            <div className="notification-bell" title="System alerts">
              <Bell size={18} />
              <span className="notification-dot"></span>
            </div>

            <div className="header-user-pill">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'User')}&background=0D8ABC&color=fff&size=32`} 
                alt="Profile" 
                className="header-avatar"
              />
              <div className="header-user-info">
                <strong>{currentUser?.name || 'User'}</strong>
                <small>{currentUser?.role === 'doctor' ? 'Clinical Doctor' : 'Admin'}</small>
              </div>
              <button className="logout-mini-btn" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        <Route path="/apply" element={<HospitalApplicationForm />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <AppLayout><Dashboard /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/create-referral" element={isAuthenticated ? <AppLayout><CreateReferral /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/referrals" element={isAuthenticated ? <AppLayout><Referrals /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/referred-to-me" element={isAuthenticated ? <AppLayout><ReferredToMe /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/patient-directory" element={isAuthenticated ? <AppLayout><PatientList /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/patients" element={isAuthenticated ? <AppLayout><Patients /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/scan-qr" element={isAuthenticated ? <AppLayout><ScanQR /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/facilities" element={isAuthenticated ? <AppLayout><Facilities /></AppLayout> : <Navigate to="/login" />} />

        <Route path="/settings" element={isAuthenticated ? <AppLayout><Settings onUserUpdate={setCurrentUser} /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/applications" element={isAuthenticated ? <AppLayout><AdminApplications /></AppLayout> : <Navigate to="/login" />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;

