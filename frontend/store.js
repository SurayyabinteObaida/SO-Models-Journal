// Firestore data access, scoped under /users/{uid}/... per firestore.rules.
// All functions are no-ops (resolve to null/empty) if nobody is signed in,
// so the rest of the app can call them unconditionally.

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { app } from "./auth.js";
import { AUTH } from "./auth.js";

const db = getFirestore(app);

export const STORE = {
  /** Loads the saved chat array for a given modelId, or [] if none exists. */
  async loadChat(modelId) {
    const user = AUTH.getUser();
    if (!user) return [];
    const ref = doc(db, "users", user.uid, "chats", modelId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().messages || [] : [];
  },

  /** Overwrites the saved chat array for a given modelId. */
  async saveChat(modelId, messages) {
    const user = AUTH.getUser();
    if (!user) return;
    const ref = doc(db, "users", user.uid, "chats", modelId);
    await setDoc(ref, { messages, updatedAt: serverTimestamp() });
  },

  /** Loads a cached deep-dive generation for a model+promptIndex, or null. */
  async loadDeepdive(modelId) {
    const user = AUTH.getUser();
    if (!user) return null;
    const ref = doc(db, "users", user.uid, "deepdives", modelId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  /** Saves a deep-dive generation for a model. */
  async saveDeepdive(modelId, promptLabel, text) {
    const user = AUTH.getUser();
    if (!user) return;
    const ref = doc(db, "users", user.uid, "deepdives", modelId);
    await setDoc(ref, { promptLabel, text, updatedAt: serverTimestamp() });
  },

  /** Records a single quiz attempt (append-only, for a future history/score view). */
  async recordQuizAttempt(modelId, question, wasCorrect) {
    const user = AUTH.getUser();
    if (!user) return;
    const col = collection(db, "users", user.uid, "quizAttempts");
    await addDoc(col, {
      modelId,
      question,
      wasCorrect,
      createdAt: serverTimestamp(),
    });
  },

  /** Saves a defined term (cue card) for later review. Returns the new doc id, or null if signed out. */
  async saveDefinition(modelId, modelName, term, definition) {
    const user = AUTH.getUser();
    if (!user) return null;
    const col = collection(db, "users", user.uid, "definitions");
    const ref = await addDoc(col, {
      modelId,
      modelName,
      term,
      definition,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Lists all saved term definitions for the signed-in user, newest first. */
  async listDefinitions() {
    const user = AUTH.getUser();
    if (!user) return [];
    const col = collection(db, "users", user.uid, "definitions");
    const q = query(col, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /** Deletes a saved term definition by its doc id. */
  async deleteDefinition(definitionId) {
    const user = AUTH.getUser();
    if (!user) return;
    const ref = doc(db, "users", user.uid, "definitions", definitionId);
    await deleteDoc(ref);
  },
};
