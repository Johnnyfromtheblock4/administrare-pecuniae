import React, { useState } from "react";
import { auth } from "../src/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  return (
    <div className="container text-center my-5">
      <h2>Accedi</h2>
      <form
        onSubmit={handleLogin}
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-success w-50">
          Accedi
        </button>
      </form>

      <p className="mt-4 text-muted">
        Non hai un account?{" "}
        <Link to="/register" className="text-decoration-none">
          Registrati qui
        </Link>
      </p>
    </div>
  );
}
