import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popupMessage, setPopupMessage] = useState(""); // stato popup

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setPopupMessage("Inserisci un nome utente valido.");
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

      // Mostra popup e redirect
      setPopupMessage("Registrazione completata!");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setPopupMessage("Questa email è già registrata. Prova ad accedere.");
      } else if (error.code === "auth/invalid-email") {
        setPopupMessage("L'email inserita non è valida.");
      } else if (error.code === "auth/weak-password") {
        setPopupMessage("La password deve avere almeno 6 caratteri.");
      } else {
        setPopupMessage("Errore: " + error.message);
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

      {/* POPUP STILIZZATO */}
      {popupMessage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div
            className="p-4 rounded shadow text-center"
            style={{
              backgroundColor: "#f7efde",
              color: "black",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h6 className="mb-3 fw-semibold">Avviso</h6>
            <p>{popupMessage}</p>
            <button
              className="btn btn-primary mt-2"
              onClick={() => setPopupMessage("")}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
