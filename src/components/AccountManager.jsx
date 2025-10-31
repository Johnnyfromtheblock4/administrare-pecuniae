import React, { useState } from "react";
import { db } from "../firebaseConfig";
import {
  addDoc,
  collection,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function AccountManager({
  user,
  accounts,
  setAccounts,
  chartAccountId,
  setChartAccountId,
}) {
  const [newAccount, setNewAccount] = useState({ nome: "", saldoIniziale: "" });
  const [editAccountId, setEditAccountId] = useState(null);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.nome || !newAccount.saldoIniziale)
      return alert("Compila tutti i campi!");
    if (!user) return alert("Devi essere loggato!");

    const docRef = await addDoc(collection(db, "accounts"), {
      nome: newAccount.nome,
      saldoIniziale: Number(newAccount.saldoIniziale),
      uid: user.uid,
    });

    if (accounts.length === 0) setChartAccountId(docRef.id);
    setNewAccount({ nome: "", saldoIniziale: "" });
  };

  const handleEditAccount = async (id, nome, saldo) => {
    await updateDoc(doc(db, "accounts", id), {
      nome,
      saldoIniziale: Number(saldo),
    });
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, nome, saldoIniziale: Number(saldo) } : a
      )
    );
    setEditAccountId(null);
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Vuoi davvero eliminare questo conto?")) return;
    await deleteDoc(doc(db, "accounts", id));
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // 👉 Calcolo del totale dei conti
  const totalBalance = accounts.reduce(
    (sum, a) => sum + Number(a.saldoIniziale || 0),
    0
  );

  return (
    <div className="card p-4 mb-4 shadow-sm border-0 rounded-3">
      <h5 className="mb-3 text-center fw-semibold">💰 Gestione Conti</h5>

      {/* Form */}
      <form
        onSubmit={handleAddAccount}
        className="row g-2 align-items-center justify-content-center mb-3"
      >
        <div className="col-12 col-md-auto">
          <input
            type="text"
            placeholder="Nome conto"
            className="form-control"
            value={newAccount.nome}
            onChange={(e) =>
              setNewAccount({ ...newAccount, nome: e.target.value })
            }
          />
        </div>

        <div className="col-12 col-md-auto">
          <input
            type="number"
            placeholder="Saldo iniziale €"
            className="form-control"
            value={newAccount.saldoIniziale}
            onChange={(e) =>
              setNewAccount({ ...newAccount, saldoIniziale: e.target.value })
            }
          />
        </div>

        <div className="col-12 col-md-auto d-grid">
          <button className="btn btn-primary w-100">Aggiungi Conto</button>
        </div>
      </form>

      {/* Lista conti */}
      <ul className="list-group mt-3">
        {accounts.map((a) => (
          <li
            key={a.id}
            className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center py-3"
          >
            {editAccountId === a.id ? (
              <div className="d-flex flex-column flex-md-row gap-2 w-100">
                <input
                  type="text"
                  className="form-control"
                  defaultValue={a.nome}
                  onBlur={(e) =>
                    handleEditAccount(a.id, e.target.value, a.saldoIniziale)
                  }
                />
                <input
                  type="number"
                  className="form-control"
                  defaultValue={a.saldoIniziale}
                  onBlur={(e) =>
                    handleEditAccount(a.id, a.nome, e.target.value)
                  }
                />
              </div>
            ) : (
              <div className="d-flex flex-column flex-md-row justify-content-between w-100 align-items-md-center mx-3">
                <strong className="text-dark fs-6">{a.nome}</strong>
                <span className="text-muted mt-1 mt-md-0">
                  €{a.saldoIniziale.toFixed(2)}
                </span>
              </div>
            )}

            <div className="d-flex gap-2 mt-2 mt-md-0 justify-content-end">
              <button
                className="btn btn-sm btn-success"
                onClick={() => setEditAccountId(a.id)}
              >
                ✏️
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteAccount(a.id)}
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Totale dei conti */}
      {accounts.length > 0 && (
        <div className="mt-4 text-center">
          <h6 className="fw-bold text-dark">
            Totale conti: €{totalBalance.toFixed(2)}
          </h6>
        </div>
      )}

      {accounts.length === 0 && (
        <p className="text-center text-muted mt-3">
          Nessun conto presente. Aggiungine uno sopra 👆
        </p>
      )}
    </div>
  );
}
