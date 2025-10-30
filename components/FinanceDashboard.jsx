import React, { useState, useEffect } from "react";
import PieChartFinance from "./PieChartFinance";
import TransactionTable from "./TransactionTable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ✅ percorso corretto dato che firebaseConfig.js è in src/
import { db, auth } from "../src/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "entrata",
    categoria: "",
    importo: "",
    data: "",
  });
  const [user, setUser] = useState(null);

  // 🔐 Ascolta lo stato dell’utente autenticato
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadTransactions(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  // 📥 Carica transazioni da Firestore
  const loadTransactions = async (uid) => {
    const q = query(collection(db, "transactions"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setTransactions(data);
  };

  // ➕ Aggiungi transazione su Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.importo || !form.data || !form.categoria)
      return alert("Compila tutti i campi!");
    if (!user) return alert("Devi essere loggato per salvare i dati!");

    const docRef = await addDoc(collection(db, "transactions"), {
      ...form,
      importo: Number(form.importo),
      uid: user.uid,
      createdAt: new Date(),
    });

    setTransactions([...transactions, { id: docRef.id, ...form }]);
    setForm({ type: "entrata", categoria: "", importo: "", data: "" });
  };

  // 🗑️ Elimina transazione da Firestore
  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Errore eliminazione:", error);
    }
  };

  // 📂 Categorie
  const categorie = [
    "Stipendio",
    "Spesa",
    "Luce",
    "Rata casa",
    "Vacanze",
    "Calendario per mese",
    "Azioni",
    "Cene/Pranzi",
    "Acqua",
    "Rata macchina",
    "Pensione",
    "Diagramma torta",
    "Crypto",
    "Takeaway",
    "Corrente",
    "Finanziamenti",
    "Altro",
    "Vincite",
    "Abbonamenti mensili",
    "Prestiti",
    "Crediti",
    "Cellulare",
    "Internet",
    "Streaming",
    "Altre rate",
  ];

  // 📄 Genera PDF (identico al tuo)
  const handleGeneratePDF = async () => {
    const docPdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });
    const currentMonth = new Date().toLocaleString("it-IT", {
      month: "long",
      year: "numeric",
    });

    docPdf.setFontSize(18);
    docPdf.text(`Resoconto Finanziario - ${currentMonth}`, 20, 30);
    docPdf.setFontSize(12);
    docPdf.text("Administrare Pecuniae", 20, 50);

    const chartEl = document.getElementById("chart-section");
    if (chartEl) {
      const canvas = await html2canvas(chartEl);
      const imgData = canvas.toDataURL("image/png");
      docPdf.addImage(imgData, "PNG", 20, 60, 350, 250);
    }

    let y = 330;
    docPdf.setFontSize(14);
    docPdf.text("Entrate", 20, y);
    y += 10;

    const entrate = transactions.filter((t) => t.type === "entrata");
    const uscite = transactions.filter((t) => t.type === "uscita");

    docPdf.setFontSize(10);
    entrate.forEach((t) => {
      docPdf.text(
        `${t.data} - ${t.categoria} - €${Number(t.importo).toFixed(2)}`,
        25,
        (y += 15)
      );
    });

    if (y > 700) {
      docPdf.addPage();
      y = 30;
    } else {
      y += 30;
    }

    docPdf.setFontSize(14);
    docPdf.text("Uscite", 20, y);
    y += 10;
    docPdf.setFontSize(10);

    uscite.forEach((t) => {
      docPdf.text(
        `${t.data} - ${t.categoria} - €${Number(t.importo).toFixed(2)}`,
        25,
        (y += 15)
      );
    });

    docPdf.save(`Resoconto-${currentMonth}.pdf`);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestione Finanziaria</h2>

      {!user ? (
        <p className="text-center text-danger">
          Effettua il login per salvare e sincronizzare i tuoi dati.
        </p>
      ) : (
        <p className="text-center text-success">
          Utente loggato: <strong>{user.email}</strong>
        </p>
      )}

      {/* 🧾 Form */}
      <form
        onSubmit={handleSubmit}
        className="d-flex flex-wrap justify-content-center gap-3 mb-5"
      >
        <select
          name="type"
          className="form-select w-auto"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
        </select>

        <select
          name="categoria"
          className="form-select w-auto"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          <option value="">Seleziona categoria...</option>
          {categorie.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="importo"
          className="form-control w-auto"
          placeholder="Importo €"
          value={form.importo}
          onChange={(e) => setForm({ ...form, importo: e.target.value })}
        />

        <input
          type="date"
          name="data"
          className="form-control w-auto"
          value={form.data}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
        />

        <button type="submit" className="btn btn-success">
          Aggiungi
        </button>
      </form>

      <TransactionTable
        transactions={transactions}
        deleteTransaction={deleteTransaction}
      />

      <div id="chart-section">
        <PieChartFinance transactions={transactions} />
      </div>

      <div className="text-center my-4">
        <button className="btn btn-primary" onClick={handleGeneratePDF}>
          📄 Esporta Resoconto PDF
        </button>
      </div>
    </div>
  );
}
