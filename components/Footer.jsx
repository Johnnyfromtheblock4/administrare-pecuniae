import React from "react";

const Footer = () => {
  return (
    <footer className="bg-dark text-light text-center py-3 mt-5">
      <p className="mb-0">
        © {new Date().getFullYear()} Administrare Pecuniae — Gestione Finanze
        Personali
      </p>
    </footer>
  );
};

export default Footer;
