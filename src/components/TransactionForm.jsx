import React from "react";
import { db } from "../firebaseConfig";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";

export default function TransactionForm({
  user,
  accounts,
  chartAccountId,
  setChartAccountId,
  transactions,
  setTransactions,
  customCategories,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}) {
  const [form, setForm] = React.useState({
    type: "entrata",
    categoria: "",
    importo: "",
    data: "",
    conto: chartAccountId || "",
  });

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
    if (!form.importo || !form.data || !form.categoria || !chartAccountId)
      return alert("Compila tutti i campi!");

    const importoNum = Number(form.importo);
    const selectedAccount = accounts.find((a) => a.id === chartAccountId);
    if (!selectedAccount) return alert("Conto non valido");

    let nuovoSaldo = selectedAccount.saldoIniziale;
    if (form.type === "entrata") nuovoSaldo += importoNum;
    if (form.type === "uscita" || form.type === "risparmio")
      nuovoSaldo -= importoNum;

    await updateDoc(doc(db, "accounts", selectedAccount.id), {
      saldoIniziale: nuovoSaldo,
    });

    setTransactions((prev) => [
      ...prev,
      { ...form, conto: chartAccountId, importo: importoNum, uid: user?.uid },
    ]);

    await addDoc(collection(db, "transactions"), {
      ...form,
      conto: chartAccountId,
      importo: importoNum,
      uid: user?.uid,
      createdAt: new Date(),
    });

    setForm({
      type: "entrata",
      categoria: "",
      importo: "",
      data: "",
      conto: chartAccountId,
    });
  };

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

  return (
    <div className="card p-3 mb-5">
      <h5 className="mb-3 fw-semibold">Aggiungi transazione</h5>

      {/* Conto */}
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3">
        <select
          className="form-select w-auto"
          value={chartAccountId}
          onChange={(e) => {
            setChartAccountId(e.target.value);
            setForm((f) => ({ ...f, conto: e.target.value }));
          }}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Form inserimento */}
      <form
        onSubmit={handleSubmit}
        className="d-flex flex-wrap justify-content-center gap-3 mb-4"
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
          <option value="">Seleziona categoria...</option>
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
    </div>
  );
}
