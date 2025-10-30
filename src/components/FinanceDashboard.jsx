import React, { useState, useEffect, useMemo } from "react";
import PieChartFinance from "./PieChartFinance";
import TransactionTable from "./TransactionTable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [newAccount, setNewAccount] = useState({ nome: "", saldoIniziale: "" });
  const [editAccountId, setEditAccountId] = useState(null);
  const [form, setForm] = useState({
    type: "entrata",
    categoria: "",
    importo: "",
    data: "",
    conto: "",
  });
  const [user, setUser] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("entrata");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // NEW: conto selezionato per i grafici (default: primo inserito)
  const [chartAccountId, setChartAccountId] = useState("");

  // 🔐 Autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadTransactions(currentUser.uid);
        loadAccounts(currentUser.uid);
        loadCategories(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // 📥 Carica transazioni
  const loadTransactions = async (uid) => {
    const q = query(collection(db, "transactions"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setTransactions(data);
  };

  // 🏦 Carica conti
  const loadAccounts = async (uid) => {
    const q = query(collection(db, "accounts"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAccounts(data);

    // set default chart account if none selected
    if (data.length > 0 && !chartAccountId) {
      setChartAccountId(data[0].id);
    }
  };

  // Se cambia la lista conti (es. delete del conto selezionato), riallinea la scelta grafici
  useEffect(() => {
    if (accounts.length === 0) {
      setChartAccountId("");
      return;
    }
    const exists = accounts.some((a) => a.id === chartAccountId);
    if (!exists) setChartAccountId(accounts[0].id);
  }, [accounts]); // eslint-disable-line

  // 🗂️ Carica categorie personalizzate
  const loadCategories = async (uid) => {
    const q = query(collection(db, "categories"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCustomCategories(data);
  };

  // ➕ Aggiungi conto
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.nome || !newAccount.saldoIniziale)
      return alert("Compila tutti i campi del conto!");
    if (!user) return alert("Devi essere loggato!");

    const docRef = await addDoc(collection(db, "accounts"), {
      nome: newAccount.nome,
      saldoIniziale: Number(newAccount.saldoIniziale),
      uid: user.uid,
    });

    const created = {
      id: docRef.id,
      nome: newAccount.nome,
      saldoIniziale: Number(newAccount.saldoIniziale),
    };
    setAccounts((prev) => {
      const next = [...prev, created];
      // se è il primo conto, diventare default per grafici
      if (prev.length === 0) setChartAccountId(created.id);
      return next;
    });
    setNewAccount({ nome: "", saldoIniziale: "" });
  };

  // ✏️ Modifica conto
  const handleEditAccount = async (id, nuovoNome, nuovoSaldo) => {
    const ref = doc(db, "accounts", id);
    await updateDoc(ref, {
      nome: nuovoNome,
      saldoIniziale: Number(nuovoSaldo),
    });
    setAccounts(
      accounts.map((a) =>
        a.id === id
          ? { ...a, nome: nuovoNome, saldoIniziale: Number(nuovoSaldo) }
          : a
      )
    );
    setEditAccountId(null);
  };

  // ❌ Elimina conto
  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Vuoi davvero eliminare questo conto?")) return;
    await deleteDoc(doc(db, "accounts", id));
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // ➕ Aggiungi categoria con tipo
  const handleAddCategory = async () => {
    if (!newCategory.trim() || !user) return;
    const docRef = await addDoc(collection(db, "categories"), {
      nome: newCategory.trim(),
      tipo: newCategoryType,
      uid: user.uid,
    });
    setCustomCategories((prev) => [
      ...prev,
      { id: docRef.id, nome: newCategory.trim(), tipo: newCategoryType },
    ]);
    setNewCategory("");
  };

  // ✏️ Modifica categoria (nome o tipo)
  const handleEditCategory = async (id, nome, tipo) => {
    const ref = doc(db, "categories", id);
    await updateDoc(ref, { nome, tipo });
    setCustomCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nome, tipo } : c))
    );
  };

  // ❌ Elimina categoria
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Vuoi davvero eliminare questa categoria?")) return;
    await deleteDoc(doc(db, "categories", id));
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // 📊 Categorie base per tipo
  const categorieBase = {
    entrata: [
      "Stipendio",
      "Pensione",
      "Investimenti",
      "Crediti",
      "Altro",
      "Vincite",
    ],
    uscita: [
      "Spesa",
      "Luce",
      "Spese condominiali",
      "Rata casa",
      "Vacanze",
      "Prelievi",
      "Cene/Pranzi",
      "Acqua",
      "Rata macchina",
      "Takeaway",
      "Corrente",
      "Finanziamenti",
      "Abbonamenti mensili",
      "Prestiti",
      "Cellulare",
      "Internet",
      "Streaming",
      "Shopping",
      "Altre rate",
      "Altro",
    ],
    risparmio: ["Crypto", "Azioni", "Fondi risparmiati"],
  };

  // 🔍 Mostra solo categorie pertinenti al type selezionato nel form
  const categorie = [
    ...categorieBase[form.type],
    ...customCategories.filter((c) => c.tipo === form.type).map((c) => c.nome),
  ];

  // 📅 Filtro mese/anno per tabella
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.data);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear]);

  const months = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];

  // ➕ Aggiungi transazione (aggiornamento saldo immediato)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.importo || !form.data || !form.categoria || !form.conto)
      return alert("Compila tutti i campi!");

    const importoNum = Number(form.importo);
    const selectedAccount = accounts.find((a) => a.id === form.conto);
    if (!selectedAccount) return alert("Conto non valido");

    let nuovoSaldo = selectedAccount.saldoIniziale;
    if (form.type === "entrata") nuovoSaldo += importoNum;
    if (form.type === "uscita" || form.type === "risparmio")
      nuovoSaldo -= importoNum;

    await updateDoc(doc(db, "accounts", selectedAccount.id), {
      saldoIniziale: nuovoSaldo,
    });

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedAccount.id ? { ...a, saldoIniziale: nuovoSaldo } : a
      )
    );

    const docRef = await addDoc(collection(db, "transactions"), {
      ...form,
      importo: importoNum,
      uid: user.uid,
      createdAt: new Date(),
    });

    setTransactions((prev) => [...prev, { id: docRef.id, ...form }]);
    setForm({
      type: "entrata",
      categoria: "",
      importo: "",
      data: "",
      conto: "",
    });
  };

  // 📄 Esporta PDF (resta identico)
  const handleGeneratePDF = async () => {
    const docPdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
      "it-IT",
      {
        month: "long",
        year: "numeric",
      }
    );

    docPdf.setFontSize(18);
    docPdf.text(`Resoconto Finanziario - ${monthName}`, 20, 30);
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
    const entrate = filteredTransactions.filter((t) => t.type === "entrata");
    const uscite = filteredTransactions.filter((t) => t.type === "uscita");

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

    docPdf.save(`Resoconto-${monthName}.pdf`);
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

      {/* 🏦 GESTIONE CONTI */}
      <div className="card p-3 mb-4">
        <h5>Gestione Conti</h5>
        <form
          onSubmit={handleAddAccount}
          className="d-flex flex-wrap gap-2 align-items-center"
        >
          <input
            type="text"
            placeholder="Nome conto"
            className="form-control w-auto"
            value={newAccount.nome}
            onChange={(e) =>
              setNewAccount({ ...newAccount, nome: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Saldo iniziale €"
            className="form-control w-auto"
            value={newAccount.saldoIniziale}
            onChange={(e) =>
              setNewAccount({ ...newAccount, saldoIniziale: e.target.value })
            }
          />
          <button className="btn btn-primary">➕ Aggiungi Conto</button>
        </form>

        <ul className="mt-3 list-group">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {editAccountId === a.id ? (
                <>
                  <input
                    type="text"
                    className="form-control w-auto"
                    defaultValue={a.nome}
                    onBlur={(e) =>
                      handleEditAccount(a.id, e.target.value, a.saldoIniziale)
                    }
                  />
                  <input
                    type="number"
                    className="form-control w-auto"
                    defaultValue={a.saldoIniziale}
                    onBlur={(e) =>
                      handleEditAccount(a.id, a.nome, e.target.value)
                    }
                  />
                </>
              ) : (
                <>
                  <strong>{a.nome}</strong>
                  <span>€{a.saldoIniziale.toFixed(2)}</span>
                </>
              )}
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setEditAccountId(a.id)}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteAccount(a.id)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 🗂️ GESTIONE CATEGORIE PERSONALIZZATE */}
      <div className="card p-3 mb-4">
        <h5>Categorie Personalizzate</h5>
        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input
            type="text"
            placeholder="Nuova categoria..."
            className="form-control w-auto"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <select
            className="form-select w-auto"
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value)}
          >
            <option value="entrata">Entrata</option>
            <option value="uscita">Uscita</option>
            <option value="risparmio">Risparmio</option>
          </select>
          <button
            className="btn btn-outline-primary"
            onClick={handleAddCategory}
          >
            ➕ Aggiungi
          </button>
        </div>

        <ul className="list-group">
          {customCategories.map((c) => (
            <li
              key={c.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="text"
                  className="form-control w-auto border-0"
                  defaultValue={c.nome}
                  onBlur={(e) =>
                    handleEditCategory(c.id, e.target.value, c.tipo)
                  }
                />
                <select
                  className="form-select w-auto"
                  defaultValue={c.tipo}
                  onChange={(e) =>
                    handleEditCategory(c.id, c.nome, e.target.value)
                  }
                >
                  <option value="entrata">Entrata</option>
                  <option value="uscita">Uscita</option>
                  <option value="risparmio">Risparmio</option>
                </select>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteCategory(c.id)}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* 🎯 SEZIONE SELEZIONE POSIZIONE TRANSAZIONE */}
      <div className="card p-3 mb-4">
        <h5 className="mb-3">Seleziona dove inserire la transazione</h5>

        <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
          {/* 📅 Mese */}
          <select
            className="form-select w-auto"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>

          {/* 📆 Anno */}
          <select
            className="form-select w-auto"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - i
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* 🏦 Selezione conto per grafici e inserimento */}
          <select
            className="form-select w-auto"
            value={chartAccountId}
            onChange={(e) => setChartAccountId(e.target.value)}
            disabled={accounts.length === 0}
            title="Conto per i grafici"
          >
            {accounts.length === 0 ? (
              <option value="">Nessun conto disponibile</option>
            ) : (
              accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* 🧾 SEZIONE TRANSAZIONI */}
      <div className="card p-3 mb-5">
        <h5 className="mb-3">Aggiungi transazione</h5>
        <form
          onSubmit={handleSubmit}
          className="d-flex flex-wrap justify-content-center gap-3 mb-4"
        >
          <select
            name="type"
            className="form-select w-auto"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="entrata">Entrata</option>
            <option value="uscita">Uscita</option>
            <option value="risparmio">Risparmio</option>
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

          <select
            name="conto"
            className="form-select w-auto"
            value={form.conto}
            onChange={(e) => setForm({ ...form, conto: e.target.value })}
          >
            <option value="">Seleziona conto...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
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
      </div>

      {/* 📋 SEZIONE ELENCO TRANSAZIONI */}
      <div className="card p-3 mb-5">
        <h5 className="mb-3">Elenco transazioni</h5>
        <TransactionTable
          transactions={filteredTransactions}
          deleteTransaction={async (id) => {
            const tx = transactions.find((t) => t.id === id);
            if (!tx) return;

            const imp = Number(tx.importo) || 0;
            const contoId = tx.conto;
            const account = accounts.find((a) => a.id === contoId);
            if (!account) {
              await deleteDoc(doc(db, "transactions", id));
              setTransactions((prev) => prev.filter((t) => t.id !== id));
              return;
            }

            try {
              await deleteDoc(doc(db, "transactions", id));
              setTransactions((prev) => prev.filter((t) => t.id !== id));

              let delta = 0;
              if (tx.type === "entrata") delta = -imp;
              if (tx.type === "uscita" || tx.type === "risparmio") delta = +imp;

              const nuovoSaldo = (Number(account.saldoIniziale) || 0) + delta;

              await updateDoc(doc(db, "accounts", contoId), {
                saldoIniziale: nuovoSaldo,
              });

              setAccounts((prev) =>
                prev.map((a) =>
                  a.id === contoId ? { ...a, saldoIniziale: nuovoSaldo } : a
                )
              );
            } catch (err) {
              console.error("Errore eliminazione transazione:", err);
              alert("Errore durante l'eliminazione. Riprova.");
            }
          }}
        />
      </div>
      {/* 🥧 GRAFICI (per conto selezionato) */}
      <div id="chart-section">
        <PieChartFinance
          transactions={transactions}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          accounts={accounts}
          selectedAccountId={chartAccountId}
          onSelectAccount={setChartAccountId}
        />
      </div>

      <div className="text-center my-4">
        <button className="btn btn-primary" onClick={handleGeneratePDF}>
          📄 Esporta Resoconto PDF
        </button>
      </div>
    </div>
  );
}
