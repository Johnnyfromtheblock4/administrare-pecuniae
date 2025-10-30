import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import AccountManager from "./AccountManager";
import TransactionForm from "./TransactionForm";
import TransactionTable from "./TransactionTable";
import CategoryManager from "./CategoryManager";
import PieChartFinance from "./PieChartFinance";

export default function FinanceDashboard() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [chartAccountId, setChartAccountId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 🔥 Carica dati da Firestore
  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, "accounts"), (snap) => {
      setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubTransactions = onSnapshot(
      collection(db, "transactions"),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubAccounts();
      unsubTransactions();
    };
  }, []);

  // 🗑️ Elimina transazione e aggiorna saldo conto
  const handleDeleteTransaction = async (t) => {
    if (!window.confirm("Vuoi davvero eliminare questa transazione?")) return;

    try {
      // Elimina la transazione da Firestore
      await deleteDoc(doc(db, "transactions", t.id));

      // Trova il conto collegato
      const account = accounts.find((a) => a.id === t.conto);
      if (account) {
        let nuovoSaldo = Number(account.saldoIniziale);
        const importo = Number(t.importo);

        // Se elimini un'entrata, togli l'importo
        if (t.type === "entrata") nuovoSaldo -= importo;
        // Se elimini un'uscita o un risparmio, aggiungi l'importo
        if (t.type === "uscita" || t.type === "risparmio")
          nuovoSaldo += importo;

        // Aggiorna il saldo su Firestore
        await updateDoc(doc(db, "accounts", account.id), {
          saldoIniziale: nuovoSaldo,
        });

        // Aggiorna lo stato locale
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id ? { ...a, saldoIniziale: nuovoSaldo } : a
          )
        );
      }

      // Rimuovi la transazione dallo stato
      setTransactions((prev) => prev.filter((x) => x.id !== t.id));
      alert("Transazione eliminata con successo.");
    } catch (err) {
      console.error("Errore eliminazione:", err);
      alert("Errore durante l'eliminazione. Riprova.");
    }
  };

  return (
    <div className="container my-5">
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
        transactions={transactions}
        accounts={accounts}
        onDelete={handleDeleteTransaction}
      />

      <PieChartFinance
        transactions={transactions}
        accounts={accounts}
        selectedAccountId={chartAccountId}
        onSelectAccount={setChartAccountId}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />
    </div>
  );
}
