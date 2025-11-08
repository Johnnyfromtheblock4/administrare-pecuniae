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
  // Stato per il nuovo conto
  const [newAccount, setNewAccount] = useState({ nome: "", saldoIniziale: "" });
  // ID del conto in modifica
  const [editAccountId, setEditAccountId] = useState(null);
  // Messaggio di avviso
  const [alertMessage, setAlertMessage] = useState("");
  // ID conto da eliminare (per la modale di conferma)
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Stato per mostrare/nascondere la card
  const [isOpen, setIsOpen] = useState(false);

  // Aggiunge un nuovo conto
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.nome || !newAccount.saldoIniziale)
      return setAlertMessage("Compila tutti i campi!");
    if (!user) return setAlertMessage("Devi essere loggato!");

    const docRef = await addDoc(collection(db, "accounts"), {
      nome: newAccount.nome,
      saldoIniziale: Number(newAccount.saldoIniziale),
      uid: user.uid,
    });

    if (accounts.length === 0) setChartAccountId(docRef.id);
    setNewAccount({ nome: "", saldoIniziale: "" });
  };

  // Modifica un conto
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

  // Apre la conferma eliminazione
  const handleDeleteAccount = async (id) => {
    setConfirmDelete(id);
  };

  // Conferma l'eliminazione
  const confirmDeleteAccount = async () => {
    await deleteDoc(doc(db, "accounts", confirmDelete));
    setAccounts((prev) => prev.filter((a) => a.id !== confirmDelete));
    setConfirmDelete(null);
  };

  // Calcolo del totale dei conti
  const totalBalance = accounts.reduce(
    (sum, a) => sum + Number(a.saldoIniziale || 0),
    0
  );

  return (
    <div className="card p-4 mb-4 shadow-sm border-0 rounded-3">
      {/* HEADER DELLA CARD */}
      <div
        className="d-flex justify-content-between align-items-center"
        style={{ cursor: "pointer" }}
      >
        <h4
          className="mb-0 fw-semibold"
          onClick={() => setIsOpen(!isOpen)} // toggle apertura/chiusura cliccando sul titolo
        >
          💰 Gestione Conti
        </h4>

        {/* Pulsante con icona Font Awesome */}
        <button className="btn btn-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <i className="fa-solid fa-minus"></i>
          ) : (
            <i className="fa-solid fa-plus"></i>
          )}
        </button>
      </div>

      {/* CONTENUTO DELLA CARD (visibile solo se isOpen === true) */}
      {isOpen && (
        <>
          {/* Form di aggiunta conto */}
          <form
            onSubmit={handleAddAccount}
            className="row g-2 align-items-center justify-content-center mb-3 mt-4"
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
                  setNewAccount({
                    ...newAccount,
                    saldoIniziale: e.target.value,
                  })
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
                  <>
                    {/* Modalità modifica conto */}
                    <div className="d-flex flex-column flex-md-row gap-2 w-100">
                      <input
                        type="text"
                        className="form-control"
                        value={a.nome}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((acc) =>
                              acc.id === a.id
                                ? { ...acc, nome: e.target.value }
                                : acc
                            )
                          )
                        }
                      />
                      <input
                        type="number"
                        className="form-control"
                        value={a.saldoIniziale}
                        onChange={(e) =>
                          setAccounts((prev) =>
                            prev.map((acc) =>
                              acc.id === a.id
                                ? { ...acc, saldoIniziale: e.target.value }
                                : acc
                            )
                          )
                        }
                      />
                    </div>

                    <div className="d-flex gap-2 mt-2 mt-md-0 justify-content-end">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() =>
                          handleEditAccount(a.id, a.nome, a.saldoIniziale)
                        }
                      >
                        ✓
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditAccountId(null)}
                      >
                        ✗
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Visualizzazione normale conto */}
                    <div className="d-flex flex-column flex-md-row justify-content-between w-100 align-items-md-center mx-3">
                      <strong className="text-dark fs-6">{a.nome}</strong>
                      <span className="text-muted mt-1 mt-md-0">
                        €{a.saldoIniziale.toFixed(2)}
                      </span>
                    </div>

                    <div className="d-flex gap-2 mt-2 mt-md-0 justify-content-end">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => setEditAccountId(a.id)}
                      >
                        ✎
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteAccount(a.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {/* Totale dei conti */}
          {accounts.length > 0 && (
            <div className="mt-4 text-center">
              <h4 className="fw-bold text-dark">
                Totale conti: €{totalBalance.toFixed(2)}
              </h4>
            </div>
          )}

          {/* Messaggio se nessun conto presente */}
          {accounts.length === 0 && (
            <p className="text-center text-muted mt-3">
              Nessun conto presente. Aggiungine uno sopra ↑
            </p>
          )}
        </>
      )}

      {/* ALERT POPUP */}
      {alertMessage && (
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

      {/* DELETE CONFIRMATION POPUP */}
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
            <p>Vuoi davvero eliminare questo conto?</p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button
                className="btn btn-warning"
                onClick={() => setConfirmDelete(null)}
              >
                Annulla
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteAccount}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
