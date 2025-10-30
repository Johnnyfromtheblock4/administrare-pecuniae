import React, { useState } from "react";
import { auth } from "../src/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Registrazione completata!");
      navigate("/login");
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  return (
    <div className="container text-center my-5">
      <h2>Registrati</h2>
      <form
        onSubmit={handleRegister}
        className="d-flex flex-column align-items-center gap-3 mt-4"
      >
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
