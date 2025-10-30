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

    // 🔥 Aggiunge il conto su Firestore (lo snapshot aggiornerà lo stato)
    const docRef = await addDoc(collection(db, "accounts"), {
      nome: newAccount.nome,
      saldoIniziale: Number(newAccount.saldoIniziale),
      uid: user.uid,
    });

    // Se non ci sono conti, imposta subito il nuovo conto come selezionato
    if (accounts.length === 0) setChartAccountId(docRef.id);

    // Pulisce i campi
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

  return (
    <div className="card p-3 mb-4">
      <h5>Gestione Conti</h5>
      <form
        onSubmit={handleAddAccount}
        className="d-flex flex-wrap gap-2 align-items-center"
      >
        <input
          type="text"
          placeholder="Nome conto"
          className="form-control w-auto"
          value={newAccount.nome}
          onChange={(e) =>
            setNewAccount({ ...newAccount, nome: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Saldo iniziale €"
          className="form-control w-auto"
          value={newAccount.saldoIniziale}
          onChange={(e) =>
            setNewAccount({ ...newAccount, saldoIniziale: e.target.value })
          }
        />
        <button className="btn btn-primary">➕ Aggiungi Conto</button>
      </form>

      <ul className="mt-3 list-group">
        {accounts.map((a) => (
          <li
            key={a.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            {editAccountId === a.id ? (
              <>
                <input
                  type="text"
                  className="form-control w-auto"
                  defaultValue={a.nome}
                  onBlur={(e) =>
                    handleEditAccount(a.id, e.target.value, a.saldoIniziale)
                  }
                />
                <input
                  type="number"
                  className="form-control w-auto"
                  defaultValue={a.saldoIniziale}
                  onBlur={(e) =>
                    handleEditAccount(a.id, a.nome, e.target.value)
                  }
                />
              </>
            ) : (
              <>
                <strong>{a.nome}</strong>
                <span>€{a.saldoIniziale.toFixed(2)}</span>
              </>
            )}
            <div>
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => setEditAccountId(a.id)}
              >
                ✏️
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteAccount(a.id)}
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
