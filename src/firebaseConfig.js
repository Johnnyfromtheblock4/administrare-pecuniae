// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⬇️ Copia questi dati dal tuo progetto Firebase
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "administrare-pecuniae.firebaseapp.com",
  projectId: "administrare-pecuniae",
  storageBucket: "administrare-pecuniae.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "XXXXXXXXXXXXX",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
