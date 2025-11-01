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

  // Popup stati
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Rileva se l'utente è loggato
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Carica dati in tempo reale da Firestore
  useEffect(() => {
    if (!user) return;

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

  // Avvia eliminazione (mostra popup)
  const handleDeleteTransaction = (t) => {
    setConfirmDelete(t);
  };

  // Conferma eliminazione
  const confirmDeleteTransaction = async () => {
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "transactions", confirmDelete.id));

      const account = accounts.find((a) => a.id === confirmDelete.conto);
      if (account) {
        let nuovoSaldo = Number(account.saldoIniziale);
        const importo = Number(confirmDelete.importo);

        if (confirmDelete.type === "entrata") nuovoSaldo -= importo;
        if (
          confirmDelete.type === "uscita" ||
          confirmDelete.type === "risparmio"
        )
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

      setTransactions((prev) => prev.filter((x) => x.id !== confirmDelete.id));
      setAlertMessage("Transazione eliminata con successo.");
    } catch (err) {
      console.error("Errore eliminazione:", err);
      setAlertMessage("Errore durante l'eliminazione. Riprova.");
    } finally {
      setConfirmDelete(null);
    }
  };

  // Se non loggato
  if (!user) {
    return (
      <div className="text-center my-5">
        <h4>🔒 Effettua il login per accedere alla tua area finanziaria</h4>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">
        Benvenuto, <span className="text-primary">{user.email}</span>
      </h2>

      {/* COMPONENTI PRINCIPALI */}
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
        setTransactions={setTransactions}
      />

      {/* POPUP ALERT */}
      {alertMessage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1051 }}
        >
          <div
            className="p-4 rounded shadow text-center"
            style={{
              backgroundColor: "#f7efde",
              color: "black",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h6 className="mb-3 fw-semibold">Avviso</h6>
            <p>{alertMessage}</p>
            <button
              className="btn btn-primary mt-2"
              onClick={() => setAlertMessage("")}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* POPUP CONFERMA ELIMINAZIONE */}
      {confirmDelete && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div
            className="p-4 rounded shadow text-center"
            style={{
              backgroundColor: "#f7efde",
              color: "black",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h6 className="mb-3 fw-semibold">Conferma eliminazione</h6>
            <p>
              Vuoi davvero eliminare la transazione{" "}
              <strong>{confirmDelete.categoria}</strong> da{" "}
              <strong>€{confirmDelete.importo}</strong>?
            </p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button
                className="btn btn-warning"
                onClick={() => setConfirmDelete(null)}
              >
                Annulla
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeleteTransaction}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
