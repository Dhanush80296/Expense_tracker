
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbOVHzF8wXIHTpfOfAGtnn0-lRIIcgNCY",
  authDomain: "expensetracker-d3665.firebaseapp.com",
  projectId: "expensetracker-d3665",
  storageBucket: "expensetracker-d3665.firebasestorage.app",
  messagingSenderId: "400500227592",
  appId: "1:400500227592:web:0e5e78641bc90c8d6bdbbd",
  measurementId: "G-W3YSWDK405"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
