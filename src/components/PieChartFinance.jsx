import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { db } from "../firebaseConfig";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { handleGeneratePDF } from "../utils/pdfUtils";

const COLORS = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#FFC107",
  "#795548",
  "#607D8B",
];

export default function PieChartFinance({
  transactions = [],
  setTransactions,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  accounts = [],
  selectedAccountId,
  onSelectAccount,
}) {
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(null);
  const [showTransactions, setShowTransactions] = useState(false);

  // --- ELIMINAZIONE TRANSAZIONE ---
  const handleDeleteTransaction = (t) => {
    setConfirmDeleteTx(t);
  };

  const confirmDeleteTransaction = async () => {
    if (!confirmDeleteTx) return;
    try {
      const t = confirmDeleteTx;

      // 🔹 Recupera il conto associato
      const account = accounts.find((a) => a.id === t.conto);
      if (account) {
        let nuovoSaldo = Number(account.saldoIniziale);
        const importo = Number(t.importo);

        // Ripristina il saldo in base al tipo di transazione
        if (t.type === "entrata") {
          nuovoSaldo -= importo; // rimuove un’entrata
        } else if (t.type === "uscita" || t.type === "risparmio") {
          nuovoSaldo += importo; // rimuove un’uscita o risparmio
        }

        // Aggiorna Firestore
        await updateDoc(doc(db, "accounts", account.id), {
          saldoIniziale: nuovoSaldo,
        });
      }

      // Elimina la transazione
      await deleteDoc(doc(db, "transactions", t.id));
      setTransactions((prev) => prev.filter((x) => x.id !== t.id));

      setAlertMessage("Transazione eliminata e saldo aggiornato.");
    } catch (error) {
      console.error(error);
      setAlertMessage("Errore durante l’eliminazione della transazione.");
    } finally {
      setConfirmDeleteTx(null);
    }
  };

  // --- FILTRO ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.data);
      const isSameMonth =
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear;
      const isSameAccount = selectedAccountId
        ? t.conto === selectedAccountId
        : true;
      return isSameMonth && isSameAccount;
    });
  }, [transactions, selectedMonth, selectedYear, selectedAccountId]);

  // --- GROUP BY CATEGORIA ---
  const groupByCategory = (list) => {
    const result = {};
    list.forEach((t) => {
      if (!result[t.categoria]) result[t.categoria] = 0;
      result[t.categoria] += Number(t.importo);
    });
    return Object.entries(result).map(([name, value]) => ({ name, value }));
  };

  const entrateData = useMemo(
    () =>
      groupByCategory(filteredTransactions.filter((t) => t.type === "entrata")),
    [filteredTransactions]
  );
  const usciteData = useMemo(
    () =>
      groupByCategory(filteredTransactions.filter((t) => t.type === "uscita")),
    [filteredTransactions]
  );
  const risparmiData = useMemo(
    () =>
      groupByCategory(
        filteredTransactions.filter((t) => t.type === "risparmio")
      ),
    [filteredTransactions]
  );

  // --- TOTALI ---
  const totaleEntrate = entrateData.reduce((sum, d) => sum + d.value, 0);
  const totaleUscite = usciteData.reduce((sum, d) => sum + d.value, 0);
  const totaleRisparmi = risparmiData.reduce((sum, d) => sum + d.value, 0);

  const totaleData = [
    { name: "Entrate", value: totaleEntrate, color: "#4CAF50" },
    { name: "Uscite", value: totaleUscite, color: "#FF9800" },
    { name: "Risparmi", value: totaleRisparmi, color: "#2196F3" },
  ].filter((d) => d.value > 0);

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

  const monthLabel = new Date(selectedYear, selectedMonth).toLocaleString(
    "it-IT",
    { month: "long", year: "numeric" }
  );

  const handlePDFExport = async () => {
    try {
      if (totaleData.length === 0)
        return setAlertMessage("Nessun dato disponibile per questo mese.");
      await handleGeneratePDF(selectedMonth, selectedYear, "chart-pdf");
    } catch (error) {
      console.error(error);
      setAlertMessage("Errore durante l’esportazione del PDF.");
    }
  };

  return (
    <div className="card p-4 my-5">
      <h4 className="mb-4 text-center fw-bold">📊 Analisi Finanziaria</h4>

      {/* FILTRI */}
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-4">
        {/* Conto */}
        <select
          className="form-select w-auto"
          value={selectedAccountId || "global"}
          onChange={(e) =>
            onSelectAccount(e.target.value === "global" ? "" : e.target.value)
          }
        >
          <option value="global">Globale (tutti i conti)</option>
          {accounts.length === 0 ? (
            <option disabled>Nessun conto disponibile</option>
          ) : (
            accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))
          )}
        </select>

        {/* Mese */}
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

        {/* Anno */}
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
      </div>

      <h6 className="text-center mb-3">
        Bilancio di {monthLabel} •{" "}
        {selectedAccountId
          ? accounts.find((a) => a.id === selectedAccountId)?.nome ||
            "Conto selezionato"
          : "Tutti i conti"}
      </h6>

      {/* ELENCO TRANSAZIONI A SCOMPARSA */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center">
          <h5
            className="fw-semibold mb-0"
            style={{ cursor: "pointer" }}
            onClick={() => setShowTransactions((prev) => !prev)}
          >
            Elenco Transazioni
          </h5>

          {/* Pulsante + / - */}
          <button
            className="btn btn-primary"
            onClick={() => setShowTransactions((prev) => !prev)}
          >
            {showTransactions ? (
              <i className="fa-solid fa-minus"></i>
            ) : (
              <i className="fa-solid fa-plus"></i>
            )}
          </button>
        </div>

        {/* Contenuto visibile solo se showTransactions === true */}
        {showTransactions && (
          <>
            {filteredTransactions.length > 0 ? (
              <ul className="list-group mt-3">
                {filteredTransactions
                  .slice() // copia l’array per non mutarlo
                  .sort(
                    (a, b) =>
                      new Date(b.data).getTime() - new Date(a.data).getTime()
                  ) // ordina per data (più recente prima)
                  .map((t) => (
                    <li
                      key={t.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{t.categoria}</strong> — €{t.importo.toFixed(2)}
                        {t.descrizione && (
                          <div className="text-muted small fst-italic mt-1">
                            “{t.descrizione}”
                          </div>
                        )}
                        <small className="text-muted d-block mt-1">
                          {new Date(t.data).toLocaleDateString("it-IT")}
                        </small>
                      </div>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteTransaction(t)}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-center text-muted mt-3 mb-0">
                Nessuna transazione per questo mese.
              </p>
            )}
          </>
        )}
      </div>

      {/* GRAFICI E TOTALE MENSILE */}
      <div className="row">
        {[
          { title: "Entrate", color: "text-success", data: entrateData },
          { title: "Uscite", color: "text-danger", data: usciteData },
          { title: "Risparmi", color: "text-primary", data: risparmiData },
        ].map(({ title, color, data }, i) => (
          <div key={i} className="col-lg-4 col-md-6 col-12 mb-4">
            <h5 className={`text-center ${color}`}>{title}</h5>
            {data.length > 0 ? (
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      label
                    >
                      {data.map((_, j) => (
                        <Cell key={j} fill={COLORS[j % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted">
                Nessuna {title.toLowerCase()} per questo mese.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* TORTA RIASSUNTIVA */}
      <div className="mt-5">
        <h4 className="text-center mb-3 fw-semibold">Totale Mensile</h4>
        {totaleData.length > 0 ? (
          <div
            id="chart-pdf"
            style={{
              width: "100%",
              height: 400,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={totaleData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={150}
                  label={({ name, value }) => `${name}: €${value.toFixed(2)}`}
                >
                  {totaleData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `€${Number(v).toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted">
            Nessuna transazione per questo mese.
          </p>
        )}
      </div>

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
      {confirmDeleteTx && (
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
              <strong>{confirmDeleteTx.categoria}</strong> da{" "}
              <strong>€{confirmDeleteTx.importo}</strong>?
            </p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteTx(null)}
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
