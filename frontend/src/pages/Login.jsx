import React, { useState } from 'react';
import { FileText, Lock, Mail, EyeOff, ShieldCheck } from 'lucide-react';
import './Login.css';
import { api } from '../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      onLogin();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon-large">
            <FileText size={32} color="#dc2626" />
          </div>
          <h2>MediBridge</h2>
          <p>Secure access for healthcare professionals</p>
        </div>

        <div className="auth-tabs">
          <button className="auth-tab active">Email</button>
          <button className="auth-tab">Phone / OTP</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert-banner error mb-4" style={{ padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
          <div className="form-group">
            <label>Official Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="doctor@hospital.gov.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between">
              <label>Password</label>
              <a href="#" className="forgot-link">Forgot?</a>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <EyeOff size={18} className="input-icon-right" />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in \u2192'}
          </button>
        </form>

        <div className="role-detection-box">
          <ShieldCheck size={20} color="#0369a1" />
          <div>
            <h5>Role Auto-Detection Enabled</h5>
            <p>Your clinical designation and facility access will be automatically configured based on your verified credentials upon successful login.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
