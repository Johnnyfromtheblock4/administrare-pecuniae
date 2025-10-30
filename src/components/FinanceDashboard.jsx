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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
  };

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

    setAccounts([
      ...accounts,
      {
        id: docRef.id,
        nome: newAccount.nome,
        saldoIniziale: Number(newAccount.saldoIniziale),
      },
    ]);
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
    setAccounts(accounts.filter((a) => a.id !== id));
  };

  // ➕ Aggiungi categoria personalizzata persistente
  const handleAddCategory = async () => {
    if (!newCategory.trim() || !user) return;
    const docRef = await addDoc(collection(db, "categories"), {
      nome: newCategory.trim(),
      uid: user.uid,
    });
    setCustomCategories([
      ...customCategories,
      { id: docRef.id, nome: newCategory.trim() },
    ]);
    setNewCategory("");
  };

  // ✏️ Modifica categoria
  const handleEditCategory = async (id, nuovoNome) => {
    const ref = doc(db, "categories", id);
    await updateDoc(ref, { nome: nuovoNome });
    setCustomCategories(
      customCategories.map((c) => (c.id === id ? { ...c, nome: nuovoNome } : c))
    );
  };

  // ❌ Elimina categoria
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Vuoi davvero eliminare questa categoria?")) return;
    await deleteDoc(doc(db, "categories", id));
    setCustomCategories(customCategories.filter((c) => c.id !== id));
  };

  // ➕ Aggiungi transazione e aggiorna saldo immediato
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.importo || !form.data || !form.categoria || !form.conto)
      return alert("Compila tutti i campi!");

    const importoNum = Number(form.importo);
    const selectedAccount = accounts.find((a) => a.id === form.conto);
    if (!selectedAccount) return alert("Conto non valido");

    // Calcolo saldo aggiornato locale e Firestore
    let nuovoSaldo = selectedAccount.saldoIniziale;
    if (form.type === "entrata") nuovoSaldo += importoNum;
    if (form.type === "uscita" || form.type === "risparmio")
      nuovoSaldo -= importoNum;

    await updateDoc(doc(db, "accounts", selectedAccount.id), {
      saldoIniziale: nuovoSaldo,
    });

    // Aggiorna subito localmente
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === selectedAccount.id ? { ...a, saldoIniziale: nuovoSaldo } : a
      )
    );

    // Salva transazione
    const docRef = await addDoc(collection(db, "transactions"), {
      ...form,
      importo: importoNum,
      uid: user.uid,
      createdAt: new Date(),
    });

    setTransactions([...transactions, { id: docRef.id, ...form }]);
    setForm({
      type: "entrata",
      categoria: "",
      importo: "",
      data: "",
      conto: "",
    });
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

  const categorie = [
    ...categorieBase[form.type],
    ...customCategories.map((c) => c.nome),
  ];

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.data);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear]);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestione Finanziaria</h2>

      {!user ? (
        <p className="text-center text-danger">
          Effettua il login per salvare i tuoi dati.
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

      {/* 🗂️ GESTIONE CATEGORIE */}
      <div className="card p-3 mb-4">
        <h5>Categorie Personalizzate</h5>
        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
          <input
            type="text"
            placeholder="Nuova categoria..."
            className="form-control w-auto"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
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
              <input
                type="text"
                className="form-control w-auto border-0"
                defaultValue={c.nome}
                onBlur={(e) => handleEditCategory(c.id, e.target.value)}
              />
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

      {/* 🧾 FORM TRANSAZIONI */}
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

      <TransactionTable
        transactions={filteredTransactions}
        deleteTransaction={async (id) => {
          await deleteDoc(doc(db, "transactions", id));
          setTransactions(transactions.filter((t) => t.id !== id));
        }}
      />

      <div id="chart-section">
        <PieChartFinance
          transactions={transactions}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
}
