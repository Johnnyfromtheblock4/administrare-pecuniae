import React from "react";
import FinanceDashboard from "../components/FinanceDashboard";

export default function Homepage() {
  return (
    <div className="container my-5">
      <h1 className="text-center fw-bold mb-4">Administrare Pecuniae</h1>
      <p className="text-center text-muted mb-5">
        Registra le tue entrate e uscite giornaliere, monitora il bilancio e
        visualizza l’andamento delle tue finanze.
      </p>

      <FinanceDashboard />
    </div>
  );
}
