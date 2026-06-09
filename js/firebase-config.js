/* ============================================
   NikahPlanner — Firebase Configuration
   ============================================
   
   PETUNJUK SETUP:
   1. Buka https://console.firebase.google.com
   2. Klik "Add project" → beri nama (misal: nikahplanner)
   3. Setelah project dibuat, klik ikon Web (</>) untuk menambahkan app
   4. Copy konfigurasi dan ganti nilai di bawah ini
   5. Aktifkan Authentication → Sign-in method → Google & Email/Password
   6. Aktifkan Firestore Database → Create database → Start in test mode
   7. Tambahkan domain Vercel Anda di Authentication → Settings → Authorized domains
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBzGsv1tuB6lFA4UWGNG-Gf7tTqSesgL2o",
  authDomain: "nikahplanner1.firebaseapp.com",
  projectId: "nikahplanner1",
  storageBucket: "nikahplanner1.firebasestorage.app",
  messagingSenderId: "529393508263",
  appId: "1:529393508263:web:e4702fa070982a4af9e082",
  measurementId: "G-4LPB74525C"
};

// Initialize Firebase
let firebaseApp, firebaseAuth, firebaseDb;

try {
  // Check if Firebase SDK is loaded
  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();

    // Enable offline persistence for Firestore
    firebaseDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Multiple tabs open, persistence only in one tab.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence: Not supported in this browser.');
      }
    });

    console.log('✅ Firebase initialized successfully');
  } else {
    console.error('❌ Firebase SDK not loaded. Check your script tags.');
  }
} catch (e) {
  console.error('❌ Firebase initialization error:', e);
}
