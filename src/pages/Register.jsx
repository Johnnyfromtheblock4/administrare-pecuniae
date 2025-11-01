import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Inserisci un nome utente valido.");
      return;
    }

    try {
      // Crea l'utente su Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Salva i dati utente su Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username.trim(),
        email: user.email,
        createdAt: new Date(),
      });

      alert("Registrazione completata!");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Questa email è già registrata. Prova ad accedere.");
      } else if (error.code === "auth/invalid-email") {
        alert("L'email inserita non è valida.");
      } else if (error.code === "auth/weak-password") {
        alert("La password deve avere almeno 6 caratteri.");
      } else {
        alert("Errore: " + error.message);
      }
    }
  };

  return (
    <div className="container text-center my-5">
      <h2>Registrati</h2>
      <form
        onSubmit={handleRegister}
        className="d-flex flex-column align-items-center gap-3 mt-4"
      >
        {/* Campo Username */}
        <input
          type="text"
          className="form-control w-50"
          placeholder="Nome utente"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          className="form-control w-50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control w-50"
          placeholder="Password (minimo 6 caratteri)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-success w-50">
          Crea account
        </button>
      </form>
    </div>
  );
}
