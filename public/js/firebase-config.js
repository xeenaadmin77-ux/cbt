/**
 * ITI College CBT Examination System - Firebase & API Configuration
 * Designed for lightweight mobile-friendly editing via Termux / Acode / SPCK
 */

// Firebase Project Configuration
// When deploying to production Firebase Hosting, paste your Firebase web credentials here.
const firebaseConfig = {
  apiKey: "AIzaSyAld11Us4JowyaLnkc3vmfYv7CA_RC9Hkk",
  authDomain: "cbt-exam77.firebaseapp.com",
  projectId: "cbt-exam77",
  storageBucket: "cbt-exam77.firebasestorage.app",
  messagingSenderId: "398532692131",
  appId: "1:398532692131:web:87466a6731487492635716"
};

// Authoritative API Base URL:
// In local development / Termux Node dev / AI Studio preview, uses current origin (/api)
// When deployed to Firebase Hosting, Cloud Functions rewrite maps /api/** to functions.
const API_BASE = '/api';

/**
 * Robust API helper with error handling and network status checking
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Attach a fresh Firebase ID token when a Firebase user is signed in.
  // Firebase automatically refreshes the token when necessary.
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const firebaseUser = firebase.auth().currentUser;

      if (firebaseUser) {
        const freshToken = await firebaseUser.getIdToken();
        defaultHeaders['Authorization'] = `Bearer ${freshToken}`;
      }
    } else {
      // Student login / fallback session token.
      const user = getCurrentUser();
      if (user && user.token) {
        defaultHeaders['Authorization'] = `Bearer ${user.token}`;
      }
    }
  } catch (authError) {
    console.warn('Firebase token refresh failed:', authError);
    const user = getCurrentUser();
    if (user && user.token) {
      defaultHeaders['Authorization'] = `Bearer ${user.token}`;
    }
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || `Server request failed (${response.status})`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Storage helpers for user state
 */
function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem('cbt_user') || localStorage.getItem('cbt_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(userData, remember = false) {
  const serialized = JSON.stringify(userData);
  sessionStorage.setItem('cbt_user', serialized);
  if (remember) {
    localStorage.setItem('cbt_user', serialized);
  }
}

function clearCurrentUser() {
  sessionStorage.removeItem('cbt_user');
  localStorage.removeItem('cbt_user');
  sessionStorage.removeItem('cbt_active_session');
}

/**
 * Get college branding and lab settings
 */
async function getCollegeSettings() {
  try {
    const res = await apiFetch('/settings');
    return res.settings || {
      collegeName: 'XEENA INSTITUTE OF SKILL DEVELOPMENT',
      labName: 'Main Computer Examination Lab',
      tagline: 'Centre of Excellence in Vocational & Technical Training'
    };
  } catch (e) {
    return {
      collegeName: 'XEENA INSTITUTE OF SKILL DEVELOPMENT',
      labName: 'Main Computer Examination Lab',
      tagline: 'Centre of Excellence in Vocational & Technical Training'
    };
  }
}

/**
 * Update college titles and logo in DOM
 */
async function applyCollegeBranding() {
  const settings = await getCollegeSettings();
  const collegeElements = document.querySelectorAll('.college-name-display');
  collegeElements.forEach(el => {
    el.textContent = settings.collegeName;
  });
  const labElements = document.querySelectorAll('.lab-name-display');
  labElements.forEach(el => {
    el.textContent = settings.labName || 'Main Computer Lab';
  });

  // Inject / update XEENA Institute PNG logo if logo elements exist
  const badges = document.querySelectorAll('.college-logo-badge');
  badges.forEach(badge => {
    const img = document.createElement('img');
    img.src = 'images/xeena_logo.png';
    img.alt = 'XEENA INSTITUTE Logo';
    img.className = 'college-logo-img';
    badge.parentNode.replaceChild(img, badge);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyCollegeBranding();
});
