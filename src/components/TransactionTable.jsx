import React, { useState, useMemo } from "react";
import { toMoney } from "../utils/numberUtils";

export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
  accounts,
}) {
  // Impostazioni iniziali per mese e anno
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Card a scomparsa
  const [isOpen, setIsOpen] = useState(false);

  // Stato per la modifica
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [originalData, setOriginalData] = useState(null);

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

  // Filtra per mese e anno
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.data);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Raggruppa per conto e ordina per data
  const groupedByAccount = useMemo(() => {
    const map = {};

    filteredTransactions.forEach((t) => {
      if (!map[t.conto]) map[t.conto] = [];
      map[t.conto].push(t);
    });

    Object.keys(map).forEach((cid) => {
      map[cid].sort((a, b) => new Date(b.data) - new Date(a.data));
    });

    return map;
  }, [filteredTransactions]);

  // Nessuna transazione globale
  if (transactions.length === 0)
    return (
      <div className="card p-4 mb-5">
        <p className="text-center m-0">Nessuna transazione inserita.</p>
      </div>
    );

  // Salvataggio con arrotondamento e callback verso il genitore
  const handleSaveEdit = () => {
    if (onEdit && editId && originalData) {
      const updated = {
        ...editData,
        importo: toMoney(editData.importo),
      };
      onEdit(editId, updated, originalData);
    }
    setEditId(null);
    setEditData({});
    setOriginalData(null);
  };

  return (
    <div className="card p-4 mb-5">
      {/* HEADER */}
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

      {isOpen && (
        <>
          {/* Filtri mese/anno */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
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

          {/* Nessuna transazione filtrata */}
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted m-0">
              Nessuna transazione per {months[selectedMonth]} {selectedYear}.
            </p>
          ) : (
            <div className="table-responsive">
              {/* --- CICLO PER CONTO --- */}
              {Object.keys(groupedByAccount)
                .sort((a, b) => {
                  const nameA =
                    accounts.find((acc) => acc.id === a)?.nome || "";
                  const nameB =
                    accounts.find((acc) => acc.id === b)?.nome || "";
                  return nameA.localeCompare(nameB);
                })
                .map((accountId) => {
                  const account = accounts.find((a) => a.id === accountId);

                  return (
                    <div key={accountId} className="mb-4">
                      {/* Titolo conto */}
                      <h5 className="fw-bold mb-2">
                        Conto: {account ? account.nome : "Sconosciuto"}
                      </h5>

                      <table className="table table-striped align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>Importo (€)</th>
                            <th></th>
                          </tr>
                        </thead>

                        <tbody>
                          {groupedByAccount[accountId].map((t) => (
                            <tr key={t.id}>
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
                                      <option value="risparmio">
                                        Risparmio
                                      </option>
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
                                      step="0.01"
                                      className="form-control"
                                      value={
                                        editData.importo !== undefined
                                          ? editData.importo
                                          : t.importo
                                      }
                                      onChange={(e) =>
                                        setEditData({
                                          ...editData,
                                          importo: e.target.value,
                                        })
                                      }
                                    />
                                  </td>

                                  <td className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={handleSaveEdit}
                                    >
                                      Salva
                                    </button>
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => {
                                        setEditId(null);
                                        setEditData({});
                                        setOriginalData(null);
                                      }}
                                    >
                                      Annulla
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>
                                    {new Date(t.data).toLocaleDateString(
                                      "it-IT"
                                    )}
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

                                  <td className="d-flex gap-2">
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => {
                                        setEditId(t.id);
                                        setEditData(t);
                                        setOriginalData(t);
                                      }}
                                    >
                                      Modifica
                                    </button>

                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => onDelete(t)}
                                    >
                                      Elimina
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
