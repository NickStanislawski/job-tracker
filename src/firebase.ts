import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web config — safe to keep in source. These values identify your
// project to Firebase, they are not secrets; the actual access control
// happens via Firebase Auth + the Firestore security rules (see
// firestore.rules in the project root).
const firebaseConfig = {
  apiKey: "AIzaSyA1HYzCbD6TONgV3s_wMBR49atapbWpUdE",
  authDomain: "job-tracker-86b54.firebaseapp.com",
  projectId: "job-tracker-86b54",
  storageBucket: "job-tracker-86b54.firebasestorage.app",
  messagingSenderId: "767662697110",
  appId: "1:767662697110:web:d47256fa3bcd118b68b0b7",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
