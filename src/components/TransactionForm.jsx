import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";

export default function TransactionForm({
  user,
  accounts,
  chartAccountId,
  setChartAccountId,
  customCategories,
  selectedMonth,
  setSelectedMonth,
  setSelectedYear,
}) {
  const [form, setForm] = useState({
    type: "entrata",
    categoria: "",
    importo: "",
    data: "",
    conto: chartAccountId || "",
  });

  const [alertMessage, setAlertMessage] = useState("");

  const categorieBase = {
    entrata: ["Stipendio", "Pensione", "Investimenti", "Crediti", "Altro"],
    uscita: ["Spesa", "Affitto", "Bollette", "Shopping", "Altro"],
    risparmio: ["Crypto", "Azioni", "Fondi"],
  };

  const categorie = [
    ...categorieBase[form.type],
    ...customCategories.filter((c) => c.tipo === form.type).map((c) => c.nome),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const contoId = form.conto || chartAccountId;
    if (!form.importo || !form.data || !form.categoria || !contoId)
      return setAlertMessage("Compila tutti i campi!");

    const importoNum = Number(form.importo);
    const selectedAccount = accounts.find((a) => a.id === contoId);
    if (!selectedAccount) return setAlertMessage("Conto non valido!");

    let nuovoSaldo = selectedAccount.saldoIniziale;
    if (form.type === "entrata") nuovoSaldo += importoNum;
    if (form.type === "uscita" || form.type === "risparmio")
      nuovoSaldo -= importoNum;

    // 🔄 Aggiorna saldo conto
    await updateDoc(doc(db, "accounts", selectedAccount.id), {
      saldoIniziale: nuovoSaldo,
    });

    // Salva transazione su Firestore
    await addDoc(collection(db, "transactions"), {
      ...form,
      conto: contoId,
      importo: importoNum,
      uid: user?.uid,
      createdAt: new Date(),
    });

    // Reset form
    setForm({
      type: "entrata",
      categoria: "",
      importo: "",
      data: "",
      conto: contoId,
    });
  };

  return (
    <div className="card p-3 mb-5">
      <h4 className="mb-3 fw-semibold">Aggiungi Transazione</h4>

      {/* Selettore conto */}
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
        <select
          className="form-select w-auto"
          value={form.conto || chartAccountId}
          onChange={(e) => {
            setChartAccountId(e.target.value);
            setForm((f) => ({ ...f, conto: e.target.value }));
          }}
        >
          <option value="">Seleziona conto...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Form inserimento */}
      <form
        onSubmit={handleSubmit}
        className="d-flex flex-wrap justify-content-center gap-3"
      >
        <select
          name="type"
          className="form-select w-auto"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
          <option value="risparmio">Risparmio</option>
        </select>

        <select
          name="categoria"
          className="form-select w-auto"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        >
          <option value="">Categoria...</option>
          {categorie.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="importo"
          className="form-control w-auto"
          placeholder="Importo €"
          value={form.importo}
          onChange={(e) => setForm({ ...form, importo: e.target.value })}
        />

        <input
          type="date"
          name="data"
          className="form-control w-auto"
          value={form.data}
          onChange={(e) => {
            const date = new Date(e.target.value);
            setSelectedMonth(date.getMonth());
            setSelectedYear(date.getFullYear());
            setForm({ ...form, data: e.target.value });
          }}
        />

        <button type="submit" className="btn btn-primary">
          Aggiungi
        </button>
      </form>

      {/* 🔸 ALERT POPUP */}
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
    </div>
  );
}
