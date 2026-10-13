const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : (rawApiUrl === '' ? '/api' : `${rawApiUrl}/api`);

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  getHospitals: async () => {
    const response = await fetch(`${API_BASE_URL}/hospitals`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch hospitals');
    return response.json();
  },

  getReferrals: async () => {
    const response = await fetch(`${API_BASE_URL}/referrals`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch referrals');
    return response.json();
  },

  createHospital: async (hospitalData) => {
    const response = await fetch(`${API_BASE_URL}/hospitals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(hospitalData)
    });
    if (!response.ok) throw new Error('Failed to create hospital');
    return response.json();
  },

  createReferral: async (referralData) => {
    const response = await fetch(`${API_BASE_URL}/referrals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(referralData)
    });
    if (!response.ok) throw new Error('Failed to create referral');
    return response.json();
  },

  getReferralById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/referrals/${id}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Referral not found');
    return response.json();
  },

  updateReferralStatus: async (id, status, note) => {
    const response = await fetch(`${API_BASE_URL}/referrals/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, note })
    });
    if (!response.ok) throw new Error('Failed to update referral status');
    return response.json();
  },

  getAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE_URL}/analytics?${query}` : `${API_BASE_URL}/analytics`;
    const response = await fetch(url, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  getUserSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user settings');
    return response.json();
  },

  updateUserSettings: async (settingsData) => {
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settingsData)
    });
    if (!response.ok) throw new Error('Failed to update user settings');
    return response.json();
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to change password');
    return data;
  },

  requestAffiliation: async (data) => {
    const response = await fetch(`${API_BASE_URL}/users/affiliations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to submit affiliation request');
    return resData;
  },

  // Patients endpoints
  getPatients: async () => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },

  getPatientById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Patient not found');
    return response.json();
  },

  createPatient: async (patientData) => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patientData)
    });
    if (!response.ok) throw new Error('Failed to create patient');
    return response.json();
  },

  admitPatient: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/patients/${id}/admit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to admit patient');
    return response.json();
  },

  // Hospital applications endpoints
  applyHospital: async (applicationData) => {
    const response = await fetch(`${API_BASE_URL}/hospitals/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData)
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || 'Failed to submit application');
    return resData;
  },

  getHospitalApplications: async () => {
    const response = await fetch(`${API_BASE_URL}/hospitals/applications`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch hospital applications');
    return response.json();
  },

  reviewHospitalApplication: async (id, action) => {
    const response = await fetch(`${API_BASE_URL}/hospitals/applications/${id}/${action}`, {
      method: 'POST',
      headers: getHeaders()
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.message || `Failed to ${action} application`);
    return resData;
  }
};
