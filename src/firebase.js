import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAO2QLxkzH6XVmN2BiRSCa9Q69BFo9rQNc",
  authDomain: "kas-jalsahnasyid.firebaseapp.com",
  projectId: "kas-jalsahnasyid",
  storageBucket: "kas-jalsahnasyid.firebasestorage.app",
  messagingSenderId: "56546507090",
  appId: "1:56546507090:web:a0bc5fd71061099e3ae28b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Offline Persistence for PWA support
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Multiple tabs open, offline storage can only be enabled in one tab at a time.");
    } else if (err.code == 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable offline storage.");
    }
  });
} catch (e) {
  console.error("Firestore persistence error", e);
}

export { app, auth, db };
