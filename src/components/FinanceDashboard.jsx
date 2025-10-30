import React, { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import AccountManager from "./AccountManager";
import CategoryManager from "./CategoryManager";
import TransactionForm from "./TransactionForm";
import TransactionTable from "./TransactionTable";
import PieChartFinance from "./PieChartFinance";
import { handleGeneratePDF } from "../utils/pdfUtils";

export default function FinanceDashboard() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartAccountId, setChartAccountId] = useState("");

  // --- AUTENTICAZIONE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadAccounts(currentUser.uid);
        loadTransactions(currentUser.uid);
        loadCategories(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FIREBASE FETCH ---
  const loadAccounts = async (uid) => {
    const q = query(collection(db, "accounts"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setAccounts(data);
    if (data.length > 0 && !chartAccountId) setChartAccountId(data[0].id);
  };

  const loadTransactions = async (uid) => {
    const q = query(collection(db, "transactions"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const loadCategories = async (uid) => {
    const q = query(collection(db, "categories"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    setCustomCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // --- FILTRO PER TRANSAZIONI ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.data);
      return (
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear &&
        (!chartAccountId || t.conto === chartAccountId)
      );
    });
  }, [transactions, selectedMonth, selectedYear, chartAccountId]);

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

      <AccountManager
        user={user}
        accounts={accounts}
        setAccounts={setAccounts}
        chartAccountId={chartAccountId}
        setChartAccountId={setChartAccountId}
      />

      <CategoryManager
        user={user}
        customCategories={customCategories}
        setCustomCategories={setCustomCategories}
      />

      <TransactionForm
        user={user}
        accounts={accounts}
        chartAccountId={chartAccountId}
        setChartAccountId={setChartAccountId}
        transactions={transactions}
        setTransactions={setTransactions}
        customCategories={customCategories}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      <TransactionTable
        transactions={filteredTransactions}
        accounts={accounts}
        setAccounts={setAccounts}
        setTransactions={setTransactions}
      />

      <div id="chart-section">
        <PieChartFinance
          transactions={transactions}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          accounts={accounts}
          selectedAccountId={chartAccountId}
          onSelectAccount={(id) => setChartAccountId(id)}
        />
      </div>

      <div className="text-center my-4">
        <button
          className="btn btn-primary"
          onClick={() =>
            handleGeneratePDF(selectedMonth, selectedYear, "chart-section")
          }
        >
          📄 Esporta Resoconto PDF
        </button>
      </div>
    </div>
  );
}
