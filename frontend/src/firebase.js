import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7FOtAkP4Ett5i8rhVbPRkP0V631sk0v4",
  authDomain: "smart-catch-f7427.firebaseapp.com",
  projectId: "smart-catch-f7427",
  storageBucket: "smart-catch-f7427.firebasestorage.app",
  messagingSenderId: "99269577159",
  appId: "1:99269577159:web:36fac6978a33c9b195b1e2",
  measurementId: "G-Z7MMW3ND6X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);