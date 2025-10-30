import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#4CAF50", // entrate
  "#2196F3", // risparmi
  "#FF9800", // uscite
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  "#8BC34A",
  "#FFC107",
  "#795548",
  "#607D8B",
];

export default function PieChartFinance({
  transactions,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  accounts,
  selectedAccountId,
  onSelectAccount,
}) {
  // 🎯 Filtra per mese/anno e conto
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

  // 🧮 Raggruppa per categoria
  const groupByCategory = (list) => {
    const result = {};
    list.forEach((t) => {
      if (!result[t.categoria]) result[t.categoria] = 0;
      result[t.categoria] += Number(t.importo);
    });
    return Object.entries(result).map(([name, value]) => ({ name, value }));
  };

  const entrateData = useMemo(() => {
    return groupByCategory(
      filteredTransactions.filter((t) => t.type === "entrata")
    );
  }, [filteredTransactions]);

  const usciteData = useMemo(() => {
    return groupByCategory(
      filteredTransactions.filter((t) => t.type === "uscita")
    );
  }, [filteredTransactions]);

  const risparmiData = useMemo(() => {
    return groupByCategory(
      filteredTransactions.filter((t) => t.type === "risparmio")
    );
  }, [filteredTransactions]);

  // 💰 Calcola totali aggregati
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

  return (
    <div className="card p-4 my-5">
      <h5 className="mb-4 text-center fw-bold">📊 Analisi Finanziaria</h5>

      {/* 🔽 FILTRI: CONTO + MESE/ANNO */}
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-4">
        {/* Conto */}
        <select
          className="form-select w-auto"
          value={selectedAccountId}
          onChange={(e) => onSelectAccount(e.target.value)}
        >
          {accounts.length === 0 ? (
            <option>Nessun conto</option>
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
        Bilancio di {monthLabel}
        {selectedAccountId &&
          ` • ${
            accounts.find((a) => a.id === selectedAccountId)?.nome ||
            "Conto selezionato"
          }`}
      </h6>

      {/* 🎂 GRAFICI PER TIPO */}
      <div className="row">
        {/* Entrate */}
        <div className="col-lg-4 col-md-6 col-12 mb-4">
          <h5 className="text-center text-success">Entrate</h5>
          {entrateData.length > 0 ? (
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={entrateData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    cx="50%"
                    cy="50%"
                    label
                  >
                    {entrateData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted">
              Nessuna entrata per questo mese.
            </p>
          )}
        </div>

        {/* Uscite */}
        <div className="col-lg-4 col-md-6 col-12 mb-4">
          <h5 className="text-center text-danger">Uscite</h5>
          {usciteData.length > 0 ? (
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={usciteData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    cx="50%"
                    cy="50%"
                    label
                  >
                    {usciteData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted">
              Nessuna uscita per questo mese.
            </p>
          )}
        </div>

        {/* Risparmi */}
        <div className="col-lg-4 col-md-6 col-12 mb-4">
          <h5 className="text-center text-primary">Risparmi</h5>
          {risparmiData.length > 0 ? (
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={risparmiData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    cx="50%"
                    cy="50%"
                    label
                  >
                    {risparmiData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted">
              Nessun risparmio per questo mese.
            </p>
          )}
        </div>
      </div>

      {/* 🔵 TORTA RIASSUNTIVA TOTALE */}
      <div className="mt-5">
        <h4 className="text-center mb-3">Totale Mensile</h4>
        {totaleData.length > 0 ? (
          <div
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
                  cx="50%"
                  cy="50%"
                  label={({ name, value }) => `${name}: €${value.toFixed(2)}`}
                >
                  {totaleData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `€${v.toFixed(2)}`} />
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
    </div>
  );
}
