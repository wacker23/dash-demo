
// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDHQZdOB-LkL8C5g0xazBFAcLnK5nXS5Q",
  authDomain: "dash-demo-7f5f3.firebaseapp.com",
  projectId: "dash-demo-7f5f3",
  storageBucket: "dash-demo-7f5f3.firebasestorage.app",
  messagingSenderId: "807252311350",
  appId: "1:807252311350:web:a20aa0e061c30ccaa18797",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
