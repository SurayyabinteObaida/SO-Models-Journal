// Firebase Authentication wiring: email/password + Google sign-in.
// Loaded as an ES module. Exposes a small AUTH object the rest of the app uses.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Simple pub/sub so UI code can react to sign-in state without polling.
const listeners = [];
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  listeners.forEach((cb) => cb(user));
});

export const AUTH = {
  /** Returns the current Firebase user, or null if signed out. */
  getUser() {
    return currentUser;
  },

  /** Registers a callback fired immediately and on every auth state change. */
  onChange(cb) {
    listeners.push(cb);
    cb(currentUser);
  },

  async signUpWithEmail(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async signInWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async signInWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  },

  async signOut() {
    await signOut(auth);
  },

  /** Maps Firebase auth error codes to short, human-readable messages. */
  friendlyError(err) {
    const code = err?.code || "";
    const map = {
      "auth/email-already-in-use": "That email is already registered — try signing in instead.",
      "auth/invalid-email": "That doesn't look like a valid email address.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/wrong-password": "Incorrect password.",
      "auth/user-not-found": "No account found with that email.",
      "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
      "auth/network-request-failed": "Network error — check your connection and try again.",
    };
    return map[code] || (err?.message || "Something went wrong signing in.");
  },
};

export { app };
