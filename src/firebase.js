import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCML5WbLQ2QwDI0zmVuQuiDd-RnhRgAYhw",
  authDomain: "betlockapp.firebaseapp.com",
  projectId: "betlockapp",
  storageBucket: "betlockapp.firebasestorage.app",
  messagingSenderId: "943260438241",
  appId: "1:943260438241:web:aaf14b9a02b9d7c3b1b1a0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
