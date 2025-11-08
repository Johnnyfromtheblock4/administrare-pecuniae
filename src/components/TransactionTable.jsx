import React, { useState, useMemo } from "react";

export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
  accounts,
}) {
  // Impostazioni iniziali per mese e anno correnti
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Stato per la card a scomparsa
  const [isOpen, setIsOpen] = useState(false);

  // Stato per la modifica
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

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

  // Se non ci sono transazioni globalmente
  if (transactions.length === 0)
    return (
      <div className="card p-4 mb-5">
        <p className="text-center m-0">Nessuna transazione inserita.</p>
      </div>
    );

  // Funzione per salvare le modifiche
  const handleSaveEdit = () => {
    if (onEdit && editId) {
      onEdit(editId, editData);
    }
    setEditId(null);
    setEditData({});
  };

  return (
    <div className="card p-4 mb-5">
      {/* HEADER CON PULSANTE A SCOMPARSA */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4
          className="fw-semibold text-center m-0"
          style={{ cursor: "pointer" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          📑 Storico transazioni
        </h4>

        <button className="btn btn-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <i className="fa-solid fa-minus"></i>
          ) : (
            <i className="fa-solid fa-plus"></i>
          )}
        </button>
      </div>

      {/* CONTENUTO DELLA CARD (solo se aperta) */}
      {isOpen && (
        <>
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
                  {/* Ordina le transazioni per data (più recenti in alto) */}
                  {filteredTransactions
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.data).getTime() - new Date(a.data).getTime()
                    )
                    .map((t) => (
                      <tr key={t.id}>
                        {/* Se la transazione è in modifica */}
                        {editId === t.id ? (
                          <>
                            <td>
                              <input
                                type="date"
                                className="form-control"
                                value={editData.data || t.data}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    data: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              <select
                                className="form-select"
                                value={editData.type || t.type}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    type: e.target.value,
                                  })
                                }
                              >
                                <option value="entrata">Entrata</option>
                                <option value="uscita">Uscita</option>
                                <option value="risparmio">Risparmio</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={editData.categoria || t.categoria}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    categoria: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control"
                                value={editData.importo || t.importo}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    importo: e.target.value,
                                  })
                                }
                              />
                            </td>
                            <td>
                              <select
                                className="form-select"
                                value={editData.conto || t.conto}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    conto: e.target.value,
                                  })
                                }
                              >
                                {accounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.nome}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={handleSaveEdit}
                              >
                                💾 Salva
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditId(null)}
                              >
                                ❌ Annulla
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Riga normale */}
                            <td>
                              {new Date(t.data).toLocaleDateString("it-IT")}
                            </td>
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
                            <td>
                              {accounts.find((a) => a.id === t.conto)?.nome ||
                                "—"}
                            </td>
                            <td className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setEditId(t.id);
                                  setEditData(t);
                                }}
                              >
                                ✏️ Modifica
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => onDelete(t)}
                              >
                                🗑️ Elimina
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
