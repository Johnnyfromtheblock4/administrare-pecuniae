import React, { useState, useMemo } from "react";

export default function TransactionTable({ transactions, onDelete, accounts }) {
  // Impostazioni iniziali per mese e anno correnti
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Nomi mesi in italiano
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

  // Filtra le transazioni per mese e anno
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.data);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear]);

  if (transactions.length === 0)
    return (
      <div className="card p-4 mb-5">
        <p className="text-center m-0">Nessuna transazione inserita.</p>
      </div>
    );

  return (
    <div className="card p-4 mb-5">
      <h4 className="mb-3 fw-semibold text-center">📑 Storico transazioni</h4>

      {/* MENU FILTRI PER MESE E ANNO */}
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
        {/* Selettore mese */}
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

        {/* Selettore anno */}
        <select
          className="form-select w-auto"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Tabella transazioni filtrate */}
      {filteredTransactions.length === 0 ? (
        <p className="text-center text-muted m-0">
          Nessuna transazione per {months[selectedMonth]} {selectedYear}.
        </p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Importo (€)</th>
                <th>Conto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.data}</td>
                  <td
                    className={
                      t.type === "entrata"
                        ? "text-success fw-bold"
                        : t.type === "uscita"
                        ? "text-danger fw-bold"
                        : "text-primary fw-bold"
                    }
                  >
                    {t.type}
                  </td>
                  <td>{t.categoria || "-"}</td>
                  <td>{Number(t.importo).toFixed(2)}</td>
                  <td>{accounts.find((a) => a.id === t.conto)?.nome || "—"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(t)}
                    >
                      🗑️ Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
