import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
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

  // Rileva se l'utente è loggato
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Carica dati in tempo reale da Firestore
  useEffect(() => {
    if (!user) return; // Evita di caricare se non loggato

    const unsubAccounts = onSnapshot(collection(db, "accounts"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((acc) => acc.uid === user.uid);
      setAccounts(data);
    });

    const unsubTransactions = onSnapshot(
      collection(db, "transactions"),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((tx) => tx.uid === user.uid);
        setTransactions(data);
      }
    );

    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.uid === user.uid);
      setCustomCategories(data);
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
    };
  }, [user]);

  // Elimina transazione e aggiorna saldo del conto
  const handleDeleteTransaction = async (t) => {
    if (!window.confirm("Vuoi davvero eliminare questa transazione?")) return;

    try {
      await deleteDoc(doc(db, "transactions", t.id));

      const account = accounts.find((a) => a.id === t.conto);
      if (account) {
        let nuovoSaldo = Number(account.saldoIniziale);
        const importo = Number(t.importo);

        if (t.type === "entrata") nuovoSaldo -= importo;
        if (t.type === "uscita" || t.type === "risparmio")
          nuovoSaldo += importo;

        await updateDoc(doc(db, "accounts", account.id), {
          saldoIniziale: nuovoSaldo,
        });

        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id ? { ...a, saldoIniziale: nuovoSaldo } : a
          )
        );
      }

      setTransactions((prev) => prev.filter((x) => x.id !== t.id));
      alert("Transazione eliminata con successo.");
    } catch (err) {
      console.error("Errore eliminazione:", err);
      alert("Errore durante l'eliminazione. Riprova.");
    }
  };

  // Se non loggato, mostra avviso
  if (!user) {
    return (
      <div className="text-center my-5">
        <h4>🔒 Effettua il login per accedere alla tua area finanziaria</h4>
      </div>
    );
  }

  // Mostra dashboard se loggato
  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">
        Benvenuto, <span className="text-success">{user.email}</span>
      </h2>

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
