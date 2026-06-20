// Firebase project configuration.
//
// This object is meant to be public/client-side — Firebase secures data access
// via Authentication + the security rules in firestore.rules, not by hiding this.
//
// NOTE: do not call initializeApp() here. That happens once, inside auth.js,
// which imports firebaseConfig from this file. If you ever repaste boilerplate
// from the Firebase console, strip out its "import firebase/app" and
// "initializeApp(...)" lines — keep only the firebaseConfig object itself.

const firebaseConfig = {
  apiKey: "AIzaSyDBlJm6JaMYxf1I2ixW74ESIEUnWguTFp4",
  authDomain: "so-models-journal.firebaseapp.com",
  projectId: "so-models-journal",
  storageBucket: "so-models-journal.firebasestorage.app",
  messagingSenderId: "1099068903905",
  appId: "1:1099068903905:web:a52d052cc65ab7e8ac82a0"
};

// Base URL of your running FastAPI backend (no trailing slash).
const BACKEND_URL = "http://127.0.0.1:8000";

export { firebaseConfig, BACKEND_URL };