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
  "#4CAF50",
  "#2196F3",
  "#FF9800",
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
  selectedYear,
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

  const monthLabel = new Date(selectedYear, selectedMonth).toLocaleString(
    "it-IT",
    {
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">
          Bilancio di {monthLabel}
          {selectedAccountId &&
            ` • ${
              accounts.find((a) => a.id === selectedAccountId)?.nome ||
              "Conto selezionato"
            }`}
        </h4>

        {/* 🏦 Selettore conto */}
        {accounts.length > 0 && (
          <select
            className="form-select w-auto"
            value={selectedAccountId}
            onChange={(e) => onSelectAccount(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        )}
      </div>

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
    </div>
  );
}
