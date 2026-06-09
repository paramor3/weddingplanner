/* ============================================
   NikahPlanner — Authentication Module
   ============================================ */

const Auth = (() => {
  'use strict';

  let currentUser = null;
  const listeners = [];

  // --- Google Sign-In ---
  function signInWithGoogle() {
    if (!firebaseAuth) {
      showToast('Firebase belum dikonfigurasi. Periksa firebase-config.js', 'danger');
      return Promise.reject(new Error('Firebase not configured'));
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    return firebaseAuth.signInWithPopup(provider)
      .then((result) => {
        showToast(`Selamat datang, ${result.user.displayName}! 💍`, 'success', 4000);
        return result.user;
      })
      .catch((error) => {
        console.error('Google Sign-In error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
          showToast('Login dibatalkan', 'warning');
        } else if (error.code === 'auth/popup-blocked') {
          showToast('Popup diblokir browser. Izinkan popup untuk login.', 'warning');
        } else {
          showToast('Gagal login: ' + error.message, 'danger');
        }
        throw error;
      });
  }

  // --- Email/Password Sign-In ---
  function signInWithEmail(email, password) {
    if (!firebaseAuth) {
      showToast('Firebase belum dikonfigurasi', 'danger');
      return Promise.reject(new Error('Firebase not configured'));
    }

    if (!email || !password) {
      showToast('Mohon isi email dan password', 'warning');
      return Promise.reject(new Error('Missing credentials'));
    }

    return firebaseAuth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        const name = result.user.displayName || result.user.email.split('@')[0];
        showToast(`Selamat datang kembali, ${name}! 💍`, 'success', 4000);
        return result.user;
      })
      .catch((error) => {
        console.error('Email Sign-In error:', error);
        const messages = {
          'auth/user-not-found': 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.',
          'auth/wrong-password': 'Password salah. Silakan coba lagi.',
          'auth/invalid-email': 'Format email tidak valid.',
          'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
          'auth/invalid-credential': 'Email atau password salah.',
        };
        showToast(messages[error.code] || 'Gagal login: ' + error.message, 'danger');
        throw error;
      });
  }

  // --- Register with Email/Password ---
  function registerWithEmail(name, email, password) {
    if (!firebaseAuth) {
      showToast('Firebase belum dikonfigurasi', 'danger');
      return Promise.reject(new Error('Firebase not configured'));
    }

    if (!name || !email || !password) {
      showToast('Mohon isi semua data pendaftaran', 'warning');
      return Promise.reject(new Error('Missing fields'));
    }

    if (password.length < 6) {
      showToast('Password minimal 6 karakter', 'warning');
      return Promise.reject(new Error('Password too short'));
    }

    return firebaseAuth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        // Set display name
        return result.user.updateProfile({ displayName: name }).then(() => {
          showToast(`Akun berhasil dibuat! Selamat datang, ${name}! 💍`, 'success', 4000);
          return result.user;
        });
      })
      .catch((error) => {
        console.error('Register error:', error);
        const messages = {
          'auth/email-already-in-use': 'Email sudah terdaftar. Silakan login.',
          'auth/invalid-email': 'Format email tidak valid.',
          'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter.',
        };
        showToast(messages[error.code] || 'Gagal mendaftar: ' + error.message, 'danger');
        throw error;
      });
  }

  // --- Sign Out ---
  function signOut() {
    if (!firebaseAuth) return Promise.resolve();

    return firebaseAuth.signOut()
      .then(() => {
        showToast('Berhasil logout. Sampai jumpa! 👋', 'info');
      })
      .catch((error) => {
        console.error('Sign out error:', error);
        showToast('Gagal logout: ' + error.message, 'danger');
      });
  }

  // --- Auth State Listener ---
  function onAuthStateChanged(callback) {
    listeners.push(callback);
    // If auth is already initialized and we have a state, call immediately
    if (firebaseAuth) {
      firebaseAuth.onAuthStateChanged((user) => {
        currentUser = user;
        listeners.forEach(fn => fn(user));
      });
    }
  }

  // --- Get Current User ---
  function getCurrentUser() {
    return currentUser;
  }

  // --- UI Helpers ---
  function showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const appWrapper = document.getElementById('app');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appWrapper) appWrapper.style.display = 'none';
  }

  function showAppScreen() {
    const loginScreen = document.getElementById('login-screen');
    const appWrapper = document.getElementById('app');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appWrapper) appWrapper.style.display = 'flex';
  }

  function updateUserUI(user) {
    const userSection = document.getElementById('sidebar-user');
    const userName = document.getElementById('sidebar-user-name');
    const userEmail = document.getElementById('sidebar-user-email');
    const userAvatar = document.getElementById('sidebar-user-avatar');

    if (!userSection) return;

    if (user) {
      userSection.style.display = 'flex';
      if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
      if (userEmail) userEmail.textContent = user.email;
      if (userAvatar) {
        if (user.photoURL) {
          userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          const initials = (user.displayName || user.email.charAt(0)).charAt(0).toUpperCase();
          userAvatar.innerHTML = `<span>${initials}</span>`;
        }
      }
    } else {
      userSection.style.display = 'none';
    }
  }

  // --- Toggle Login/Register Form ---
  function initLoginUI() {
    // Toggle between login and register
    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (toggleToRegister) {
      toggleToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
      });
    }

    if (toggleToLogin) {
      toggleToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
      });
    }

    // Google Sign-In button
    const btnGoogleLogin = document.getElementById('btn-google-login');
    if (btnGoogleLogin) {
      btnGoogleLogin.addEventListener('click', () => {
        btnGoogleLogin.disabled = true;
        btnGoogleLogin.querySelector('.btn-text').textContent = 'Menghubungkan...';
        signInWithGoogle().finally(() => {
          btnGoogleLogin.disabled = false;
          btnGoogleLogin.querySelector('.btn-text').textContent = 'Masuk dengan Google';
        });
      });
    }

    // Google Sign-In on register page
    const btnGoogleRegister = document.getElementById('btn-google-register');
    if (btnGoogleRegister) {
      btnGoogleRegister.addEventListener('click', () => {
        btnGoogleRegister.disabled = true;
        btnGoogleRegister.querySelector('.btn-text').textContent = 'Menghubungkan...';
        signInWithGoogle().finally(() => {
          btnGoogleRegister.disabled = false;
          btnGoogleRegister.querySelector('.btn-text').textContent = 'Daftar dengan Google';
        });
      });
    }

    // Email login
    const btnEmailLogin = document.getElementById('btn-email-login');
    if (btnEmailLogin) {
      btnEmailLogin.addEventListener('click', () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        btnEmailLogin.disabled = true;
        btnEmailLogin.textContent = 'Memproses...';
        signInWithEmail(email, password).finally(() => {
          btnEmailLogin.disabled = false;
          btnEmailLogin.textContent = 'Masuk';
        });
      });
    }

    // Email register
    const btnEmailRegister = document.getElementById('btn-email-register');
    if (btnEmailRegister) {
      btnEmailRegister.addEventListener('click', () => {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        btnEmailRegister.disabled = true;
        btnEmailRegister.textContent = 'Memproses...';
        registerWithEmail(name, email, password).finally(() => {
          btnEmailRegister.disabled = false;
          btnEmailRegister.textContent = 'Daftar';
        });
      });
    }

    // Enter key on login fields
    const loginPassword = document.getElementById('login-password');
    if (loginPassword) {
      loginPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (btnEmailLogin) btnEmailLogin.click();
        }
      });
    }

    // Enter key on register fields
    const registerPassword = document.getElementById('register-password');
    if (registerPassword) {
      registerPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (btnEmailRegister) btnEmailRegister.click();
        }
      });
    }

    // Logout button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', signOut);
    }
  }

  return {
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    signOut,
    onAuthStateChanged,
    getCurrentUser,
    showLoginScreen,
    showAppScreen,
    updateUserUI,
    initLoginUI,
  };
})();
