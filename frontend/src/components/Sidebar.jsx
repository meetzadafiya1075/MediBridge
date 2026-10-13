import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Building2, BarChart2, Settings, PlusCircle, LogOut, Users, Scan } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentUser, onLogout }) => {
  const userName = currentUser?.name || 'Authorized User';
  const userRole = currentUser?.role === 'doctor' ? 'Medical Officer' : 'Hospital Admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <FileText size={22} color="#ef4444" />
          </div>
          <div>
            <h3>MediBridge</h3>
            <p className="subtitle">Govt. Clinical Network</p>
          </div>
        </div>
        
        <div className="user-profile">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff&size=40`} 
            alt={userName} 
          />
          <div className="user-profile-text">
            <h4>{userName}</h4>
            <p>{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>
        {currentUser?.role !== 'admin' && (
          <>
            <NavLink to="/referrals" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FileText size={19} />
              <span>All Referrals</span>
            </NavLink>
            <NavLink to="/referred-to-me" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FileText size={19} />
              <span>Referred to Me</span>
            </NavLink>
            <NavLink to="/patient-directory" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={19} />
              <span>Patient Directory</span>
            </NavLink>
            <NavLink to="/patients" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <PlusCircle size={19} />
              <span>Register Patient</span>
            </NavLink>
            <NavLink to="/scan-qr" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Scan size={19} />
              <span>Scan QR</span>
            </NavLink>
          </>
        )}
        {currentUser?.role === 'admin' && (
          <NavLink to="/applications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Building2 size={19} />
            <span>Applications</span>
          </NavLink>
        )}
        <NavLink to="/facilities" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Building2 size={19} />
          <span>Facilities</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Settings size={19} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {currentUser?.role !== 'admin' && (
          <NavLink to="/create-referral" className="btn-primary w-full create-btn-sidebar">
            <PlusCircle size={18} /> <span>New Referral</span>
          </NavLink>
        )}
        <button className="logout-sidebar-btn" onClick={onLogout}>
          <LogOut size={16} /> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

