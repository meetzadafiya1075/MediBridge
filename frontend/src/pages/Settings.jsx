import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Edit2, Smartphone, Lock, 
  Building2, CheckCircle2, ChevronRight, X, KeyRound, QrCode 
} from 'lucide-react';
import './Settings.css';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const Settings = ({ onUserUpdate }) => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    department: 'General Medicine',
    mciRegistration: 'MCI-489201',
    notifications: {
      inApp: true,
      sms: true,
      email: false
    }
  });

  const [saving, setSaving] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  
  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const [showAffiliationModal, setShowAffiliationModal] = useState(false);
  const [affiliationForm, setAffiliationForm] = useState({ hospitalName: '', department: 'Cardiology', role: 'Visiting Consultant' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [userData, hospitalList] = await Promise.all([
          api.getUserSettings().catch(() => null),
          api.getHospitals().catch(() => [])
        ]);

        if (userData) {
          setSettings(userData);
        }
        if (hospitalList) {
          setHospitals(hospitalList);
          if (hospitalList.length > 0) {
            setAffiliationForm(prev => ({ ...prev, hospitalName: hospitalList[0].name }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateUserSettings(settings);
      setSettings(updated);
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
      // Also update local storage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: updated.name, email: updated.email }));
      addToast('Profile preferences updated successfully!', 'success');
    } catch (error) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (type) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications?.[type]
      }
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast('New password and confirmation do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      addToast('Account password changed successfully', 'success');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      addToast(error.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleVerify2FA = (e) => {
    e.preventDefault();
    if (twoFACode.length === 6) {
      setTwoFAEnabled(!twoFAEnabled);
      addToast(twoFAEnabled ? 'Two-Factor Authentication disabled' : 'Two-Factor Authentication activated!', 'success');
      setShowTwoFAModal(false);
      setTwoFACode('');
    } else {
      addToast('Please enter a valid 6-digit verification code', 'error');
    }
  };

  const handleRequestAffiliation = async (e) => {
    e.preventDefault();
    try {
      await api.requestAffiliation(affiliationForm);
      addToast(`Affiliation request for ${affiliationForm.hospitalName} submitted!`, 'success');
      setShowAffiliationModal(false);
    } catch (error) {
      addToast('Failed to submit affiliation request', 'error');
    }
  };

  const primaryHospitalName = settings.hospitalId?.name || 'District Hospital, Pune';

  return (
    <div className="settings-page animate-fade-in">
      <div className="page-header mb-6">
        <h2>Account Settings & Clinical Profile</h2>
        <p>Manage medical credentials, cross-facility affiliations, and security controls.</p>
      </div>

      <div className="settings-grid">
        <div className="left-column">
          {/* Personal Information */}
          <div className="card mb-6">
            <h3 className="section-title"><User size={18} /> Medical Practitioner Profile</h3>
            <div className="profile-header">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(settings.name || 'User')}&background=0D8ABC&color=fff&size=80`} 
                alt="Profile" 
              />
              <div className="flex-1">
                <div className="flex gap-4 mb-4">
                  <div className="form-group flex-1">
                    <label>Full Practitioner Name</label>
                    <input 
                      type="text" 
                      value={settings.name || ''} 
                      onChange={e => setSettings({...settings, name: e.target.value})} 
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Medical ID / MCI Registration</label>
                    <input 
                      type="text" 
                      value={settings.mciRegistration || 'MCI-489201'} 
                      onChange={e => setSettings({...settings, mciRegistration: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="form-group flex-1">
                    <label>Official Email Address</label>
                    <input 
                      type="email" 
                      value={settings.email || ''} 
                      onChange={e => setSettings({...settings, email: e.target.value})} 
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Specialization / Department</label>
                    <input 
                      type="text" 
                      value={settings.department || 'General Medicine'} 
                      onChange={e => setSettings({...settings, department: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>


        </div>

        <div className="right-column">
          {/* Notifications */}
          <div className="card mb-6">
            <h3 className="section-title"><Bell size={18} /> Notification Preferences</h3>
            
            <div className="notification-setting">
              <div>
                <strong>In-App Triage Alerts</strong>
                <p>Instant visual alerts when patient arrives at ward.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={settings.notifications?.inApp ?? true} 
                  onChange={() => toggleNotification('inApp')} 
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="notification-setting">
              <div>
                <strong>Emergency SMS Alerts</strong>
                <p>Urgent notifications dispatched to registered mobile.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={settings.notifications?.sms ?? true} 
                  onChange={() => toggleNotification('sms')} 
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="notification-setting">
              <div>
                <strong>Daily Clinical Digest</strong>
                <p>Summary of completed handovers and admissions.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={settings.notifications?.email ?? false} 
                  onChange={() => toggleNotification('email')} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Security */}
          <div className="card">
            <h3 className="section-title"><Shield size={18} /> Security & Authorization</h3>
            
            <div 
              className="security-option clickable-option" 
              onClick={() => setShowPasswordModal(true)}
            >
              <div className="flex items-center gap-3">
                <Lock size={18} color="#64748b" /> 
                <div>
                  <strong>Change Password</strong>
                  <p className="text-xs text-muted">Update your portal access key</p>
                </div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </div>
            
            <div 
              className="security-option clickable-option" 
              onClick={() => setShowTwoFAModal(true)}
            >
              <div className="flex items-center gap-3">
                <Smartphone size={18} color="#64748b" /> 
                <div>
                  <strong>Two-Factor Auth (2FA)</strong>
                  <p className="text-xs text-muted">GovID Authenticator verification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${twoFAEnabled ? 'badge-success' : 'badge-info'} text-xs`}>
                  {twoFAEnabled ? 'Active' : 'Off'}
                </span>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <KeyRound size={20} color="#ef4444" />
                <h3>Change Access Password</h3>
              </div>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group mb-4">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter current password (password123)"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group mb-4">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    placeholder="Minimum 6 characters"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="Repeat new password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={changingPassword}>
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA MODAL */}
      {showTwoFAModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowTwoFAModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Smartphone size={20} color="#ef4444" />
                <h3>Two-Factor Authentication Setup</h3>
              </div>
              <button className="close-btn" onClick={() => setShowTwoFAModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVerify2FA}>
              <div className="modal-body text-center">
                <div className="flex justify-center mb-3">
                  <QrCode size={120} color="#0f172a" />
                </div>
                <p className="text-sm text-muted mb-4">
                  Scan with Google Authenticator or Microsoft Authenticator app, then enter the 6-digit verification code below.
                </p>
                <div className="form-group max-w-xs mx-auto">
                  <input 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6}
                    value={twoFACode}
                    onChange={e => setTwoFACode(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25em' }}
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowTwoFAModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {twoFAEnabled ? 'Disable 2FA' : 'Enable & Verify 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST AFFILIATION MODAL */}
      {showAffiliationModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAffiliationModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Building2 size={20} color="#ef4444" />
                <h3>Request Hospital Affiliation</h3>
              </div>
              <button className="close-btn" onClick={() => setShowAffiliationModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestAffiliation}>
              <div className="modal-body">
                <div className="form-group mb-4">
                  <label>Select Healthcare Facility</label>
                  <select 
                    value={affiliationForm.hospitalName} 
                    onChange={e => setAffiliationForm({...affiliationForm, hospitalName: e.target.value})}
                  >
                    {hospitals.map(h => (
                      <option key={h._id} value={h.name}>{h.name} &bull; {h.location}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-4">
                  <label>Clinical Department</label>
                  <select 
                    value={affiliationForm.department} 
                    onChange={e => setAffiliationForm({...affiliationForm, department: e.target.value})}
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Clinical Role</label>
                  <input 
                    type="text" 
                    value={affiliationForm.role} 
                    onChange={e => setAffiliationForm({...affiliationForm, role: e.target.value})} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowAffiliationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Affiliation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

