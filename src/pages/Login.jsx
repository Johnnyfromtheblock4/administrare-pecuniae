import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // icone per mostrare/nascondere la password

console.log("Auth instance:", auth);

export default function Login() {
  // Stato per email e password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Stato per gestire la visibilità della password
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Funzione di login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // se il login va a buon fine, reindirizza alla home
    } catch (error) {
      alert("Errore: " + error.message);
    }
  };

  return (
    <div className="container text-center my-5">
      <h2>Accedi</h2>

      {/* FORM DI LOGIN */}
      <form
        onSubmit={handleLogin}
        className="d-flex flex-column align-items-center gap-3 mt-4"
      >
        {/* CAMPO EMAIL */}
        <input
          type="email"
          className="form-control w-50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* CAMPO PASSWORD CON BOTTONE "OCCHIO" */}
        <div className="position-relative w-50">
          <input
            type={showPassword ? "text" : "password"} // cambia tipo dinamicamente
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Bottone per mostrare/nascondere password */}
          <button
            type="button"
            className="btn btn-outline-secondary position-absolute top-50 end-0 translate-middle-y border-0"
            onClick={() => setShowPassword(!showPassword)}
            style={{ boxShadow: "none" }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* PULSANTE DI ACCESSO */}
        <button type="submit" className="btn btn-primary w-50">
          Accedi
        </button>
      </form>

      {/* LINK ALLA PAGINA DI REGISTRAZIONE */}
      <p className="mt-4 text-muted">
        Non hai un account?{" "}
        <Link to="/register" className="text-decoration-none">
          Registrati qui
        </Link>
      </p>
    </div>
  );
}
