import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import AccountManager from "./AccountManager";
import TransactionForm from "./TransactionForm";
import TransactionTable from "./TransactionTable";
import CategoryManager from "./CategoryManager";
import PieChartFinance from "./PieChartFinance";
import { handleGeneratePDF } from "../utils/pdfUtils";

export default function FinanceDashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [chartAccountId, setChartAccountId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Rileva se l'utente è loggato e carica i suoi dati da Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);

      if (currentUser) {
        try {
          console.log("✅ Utente loggato:", currentUser.uid);
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            console.warn("Nessun documento utente in Firestore per questo uid");
          }
        } catch (error) {
          console.error("Errore nel recupero dati utente:", error);
        }
      } else {
        console.log("ℹ️ Nessun utente loggato");
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Carica dati in tempo reale da Firestore
  // IMPORTANTISSIMO: usiamo query(..., where("uid", "==", user.uid))
  // così le query rispettano le regole di sicurezza Firestore
  useEffect(() => {
    if (!user) return;

    console.log("🔍 Attivo listener Firestore per uid:", user.uid);

    const accountsRef = collection(db, "accounts");
    const accountsQuery = query(accountsRef, where("uid", "==", user.uid));

    const unsubAccounts = onSnapshot(accountsQuery, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAccounts(data);
    });

    const txRef = collection(db, "transactions");
    const txQuery = query(txRef, where("uid", "==", user.uid));

    const unsubTransactions = onSnapshot(txQuery, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(data);
    });

    const catRef = collection(db, "categories");
    const catQuery = query(catRef, where("uid", "==", user.uid));

    const unsubCategories = onSnapshot(catQuery, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCustomCategories(data);
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
    };
  }, [user]); // SOLO user

  // Mostra popup di conferma eliminazione
  const handleDeleteTransaction = (t) => {
    setConfirmDelete(t);
  };

  // Conferma eliminazione e aggiorna saldo conto
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
      setAlertMessage("Transazione eliminata e saldo aggiornato.");
    } catch (err) {
      console.error("Errore durante l'eliminazione:", err);
      setAlertMessage("Errore durante l'eliminazione. Riprova.");
    } finally {
      setConfirmDelete(null);
    }
  };

  // Modifica transazione con ricalcolo saldo (Modalità A)
  const handleEditTransaction = async (id, updatedData, originalData) => {
    try {
      const oldTx = originalData;
      const newTx = updatedData;

      const oldAccount = accounts.find((a) => a.id === oldTx.conto);
      const newAccount = accounts.find((a) => a.id === newTx.conto);

      if (!oldAccount || !newAccount) {
        console.error("Conto non trovato per la transazione modificata");
        setAlertMessage(
          "Impossibile aggiornare il saldo: conto associato non trovato."
        );
        return;
      }

      const oldImporto = Number(oldTx.importo);
      const newImporto = Number(newTx.importo);

      if (oldAccount.id === newAccount.id) {
        let saldo = Number(oldAccount.saldoIniziale);

        if (oldTx.type === "entrata") saldo -= oldImporto;
        else if (oldTx.type === "uscita" || oldTx.type === "risparmio")
          saldo += oldImporto;

        if (newTx.type === "entrata") saldo += newImporto;
        else if (newTx.type === "uscita" || newTx.type === "risparmio")
          saldo -= newImporto;

        await updateDoc(doc(db, "accounts", oldAccount.id), {
          saldoIniziale: saldo,
        });

        setAccounts((prev) =>
          prev.map((a) =>
            a.id === oldAccount.id ? { ...a, saldoIniziale: saldo } : a
          )
        );
      } else {
        let saldoOld = Number(oldAccount.saldoIniziale);
        if (oldTx.type === "entrata") saldoOld -= oldImporto;
        else if (oldTx.type === "uscita" || oldTx.type === "risparmio")
          saldoOld += oldImporto;

        let saldoNew = Number(newAccount.saldoIniziale);
        if (newTx.type === "entrata") saldoNew += newImporto;
        else if (newTx.type === "uscita" || newTx.type === "risparmio")
          saldoNew -= newImporto;

        await updateDoc(doc(db, "accounts", oldAccount.id), {
          saldoIniziale: saldoOld,
        });
        await updateDoc(doc(db, "accounts", newAccount.id), {
          saldoIniziale: saldoNew,
        });

        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id === oldAccount.id) {
              return { ...a, saldoIniziale: saldoOld };
            }
            if (a.id === newAccount.id) {
              return { ...a, saldoIniziale: saldoNew };
            }
            return a;
          })
        );
      }

      await updateDoc(doc(db, "transactions", id), newTx);

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...newTx } : t))
      );

      setAlertMessage("Transazione aggiornata e saldo ricalcolato.");
    } catch (error) {
      console.error("Errore durante la modifica della transazione:", error);
      setAlertMessage("Errore durante la modifica della transazione.");
    }
  };

  // Esporta il resoconto mensile in PDF
  const handleExportMonthlyPDF = async () => {
    const hasTransactionsThisMonth = transactions.some((t) => {
      const date = new Date(t.data);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });

    if (!hasTransactionsThisMonth) {
      setAlertMessage("Nessuna transazione per questo mese da esportare.");
      return;
    }

    try {
      await handleGeneratePDF({
        selectedMonth,
        selectedYear,
        transactions,
        accounts,
      });
    } catch (error) {
      console.error("Errore durante l'esportazione del PDF:", error);
      setAlertMessage("Errore durante l'esportazione del PDF.");
    }
  };

  // Se non loggato
  if (!user) {
    return (
      <div className="text-center my-5">
        <h4>Effettua il login per accedere alla tua area finanziaria</h4>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">
        Benvenuto,{" "}
        <span className="text-primary">{userData?.username || user.email}</span>
      </h2>

      {/* Gestione conti */}
      <AccountManager
        user={user}
        accounts={accounts}
        setAccounts={setAccounts}
        chartAccountId={chartAccountId}
        setChartAccountId={setChartAccountId}
      />

      {/* Gestione categorie */}
      <CategoryManager
        user={user}
        customCategories={customCategories}
        setCustomCategories={setCustomCategories}
      />

      {/* Form transazioni */}
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

      {/* Tabella transazioni */}
      <TransactionTable
        transactions={transactions}
        accounts={accounts}
        onDelete={handleDeleteTransaction}
        onEdit={handleEditTransaction}
      />

      {/* Grafico analisi finanziaria */}
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

      {/* Selettore mese + anno per esportazione */}
      <div className="text-center mt-4 mb-3">
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <select
            className="form-select w-auto"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {[
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
            ].map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="form-select w-auto"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from(
              { length: 6 },
              (_, i) => new Date().getFullYear() - i
            ).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pulsante esportazione PDF mensile */}
      <div className="text-center">
        <button className="btn btn-primary" onClick={handleExportMonthlyPDF}>
          Esporta resoconto mensile in PDF
        </button>
      </div>

      {/* Popup alert generico */}
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

      {/* Popup conferma eliminazione */}
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
