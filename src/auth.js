import { auth, db } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { showToast } from './ui.js';

// Setup/Get User Profile in Firestore
export async function setupUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Derive role from email or default to 'ketua'
    const email = user.email.toLowerCase();
    let role = 'ketua';
    if (email.includes('admin') || email === 'arset.saklawase@gmail.com') {
      role = 'admin';
    } else if (email.includes('bendahara')) {
      role = 'bendahara';
    } else if (email.includes('ketua')) {
      role = 'ketua';
    }

    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      role: role,
      createdAt: new Date().toISOString()
    };

    await setDoc(userRef, profileData);
    return profileData;
  } else {
    return userSnap.data();
  }
}

// Bind auth form listeners
export function initAuthListeners() {
  const loginForm = document.getElementById('login-form');
  const togglePassBtn = document.getElementById('toggle-password');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('Login berhasil!');
      } catch (err) {
        console.error(err);
        showToast('Gagal masuk. Periksa email dan password Anda.', 'error');
      }
    });
  }

  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passField = document.getElementById('login-password');
      const eyeIcon = document.getElementById('password-eye-icon');
      if (passField.type === 'password') {
        passField.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
      } else {
        passField.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Logout Buttons
  const logoutD = document.getElementById('logout-btn-desktop');
  const logoutM = document.getElementById('logout-btn-mobile');
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Anda telah keluar.');
    } catch (err) {
      showToast('Gagal keluar.', 'error');
    }
  };

  if (logoutD) logoutD.addEventListener('click', handleLogout);
  if (logoutM) logoutM.addEventListener('click', handleLogout);
}
