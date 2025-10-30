// src/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHU0qzRnmjdClRYnnJb6JmNgBoQ5WyFxk",
  authDomain: "administrare-pecuniae.firebaseapp.com",
  projectId: "administrare-pecuniae",
  storageBucket: "administrare-pecuniae.appspot.com",
  messagingSenderId: "792587253089",
  appId: "1:792587253089:web:1fc37644b72eba461fc120",
};

// 🔥 Usa sempre la stessa istanza
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Esporta Auth e Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
