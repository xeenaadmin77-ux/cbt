/**
 * ITI College CBT Examination System - Authentication Module
 * Handles student login (Name + Admission Number) and teacher authentication.
 */

// Student Login Form Handler
async function handleStudentLogin(event) {
  event.preventDefault();
  const alertBox = document.getElementById('authAlert');
  const submitBtn = document.getElementById('studentLoginBtn');
  
  const studentNameInput = document.getElementById('studentName') || document.getElementById('studentUsername');
  const admissionNumberInput = document.getElementById('admissionNumber') || document.getElementById('admissionPassword');
  
  const studentName = studentNameInput ? studentNameInput.value.trim() : '';
  const admissionNumber = admissionNumberInput ? admissionNumberInput.value.trim().toUpperCase() : '';

  if (!studentName || !admissionNumber) {
    showAuthError('Please enter your Username / Student Name and College Admission Form Number (Password).');
    return;
  }

  setButtonLoading(submitBtn, true, 'Verifying Credentials...');
  clearAuthError();

  try {
    const response = await apiFetch('/student-login', {
      method: 'POST',
      body: JSON.stringify({
        username: studentName,
        password: admissionNumber,
        studentName,
        admissionNumber
      })
    });

    if (response.success && response.user) {
      // Store session state
      setCurrentUser(response.user);
      // Redirect to Student Dashboard
      window.location.href = 'student-dashboard.html';
    } else {
      showAuthError(response.message || 'লগইন ব্যর্থ হয়েছে। দয়া করে সঠিক ইউজারনেম এবং অ্যাডমিশন ফর্ম নম্বর দিন।');
    }
  } catch (err) {
    showAuthError(err.message || 'Unable to connect to the examination server. Check network connection.');
  } finally {
    setButtonLoading(submitBtn, false, 'Sign In to Computer Lab CBT');
  }
}

// Teacher / Invigilator Login Handler
async function handleTeacherLogin(event) {
  event.preventDefault();

  const submitBtn = document.getElementById('teacherLoginBtn');
  const emailInput = document.getElementById('teacherEmail');
  const passwordInput = document.getElementById('teacherPassword');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    showAuthError('Please enter your Faculty Email and Secure Password.');
    return;
  }

  if (typeof firebase === 'undefined' || !firebase.auth) {
    showAuthError('Firebase Authentication is not loaded. Please refresh the page.');
    return;
  }

  setButtonLoading(submitBtn, true, 'Authenticating Faculty...');
  clearAuthError();

  try {
    const credential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const firebaseUser = credential.user;

    if (!firebaseUser) {
      throw new Error('Firebase authentication failed.');
    }

    const token = await firebaseUser.getIdToken(true);

    const user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: firebaseUser.displayName || firebaseUser.email || email,
      role: 'teacher',
      token
    };

    setCurrentUser(user, true);

    // Verify that this Firebase account is actually authorized as a teacher/admin.
    const verifyResponse = await apiFetch('/teacher/exams');

    if (!verifyResponse || verifyResponse.success === false) {
      throw new Error('This Firebase account is not authorized for the Faculty Portal.');
    }

    window.location.href = 'teacher-dashboard.html';

  } catch (err) {
    console.error('Firebase teacher login error:', err);

    // Remove any incomplete login state.
    clearCurrentUser();

    let message = 'Authentication failed. Please check your faculty email and password.';

    if (err && err.code === 'auth/invalid-credential') {
      message = 'Invalid faculty email or password.';
    } else if (err && err.code === 'auth/user-disabled') {
      message = 'This faculty account has been disabled.';
    } else if (err && err.code === 'auth/too-many-requests') {
      message = 'Too many login attempts. Please try again later.';
    } else if (err && err.message && err.message.includes('not authorized')) {
      message = err.message;
    } else if (err && err.message) {
      message = err.message;
    }

    showAuthError(message);
  } finally {
    setButtonLoading(submitBtn, false, 'Sign In to Faculty Portal');
  }
}

// Logout Handler
function handleLogout() {
  clearCurrentUser();
  window.location.href = 'index.html';
}

// UI Helpers
function showAuthError(msg) {
  const alertBox = document.getElementById('authAlert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  } else {
    alert(msg);
  }
}

function clearAuthError() {
  const alertBox = document.getElementById('authAlert');
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }
}

function setButtonLoading(btn, isLoading, text) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = text;
}

// Page Guard: Ensure authenticated user role
function requireAuth(requiredRole = 'student') {
  const user = getCurrentUser();
  if (!user) {
    if (requiredRole === 'teacher' || requiredRole === 'admin') {
      window.location.href = 'teacher-login.html';
    } else {
      window.location.href = 'student-login.html';
    }
    return null;
  }

  if (requiredRole === 'teacher' && user.role !== 'teacher' && user.role !== 'admin') {
    window.location.href = 'student-dashboard.html';
    return null;
  }

  return user;
}
