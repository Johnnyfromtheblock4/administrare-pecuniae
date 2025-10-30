import React from "react";

export default function TransactionTable({ transactions, onDelete, accounts }) {
  if (transactions.length === 0)
    return <p className="text-center">Nessuna transazione inserita.</p>;

  return (
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
          {transactions.map((t) => (
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
  );
}
