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
}) {
  // 🎯 Filtra per mese/anno selezionati
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.data);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear]);

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
      monthTransactions.filter((t) => t.type === "entrata")
    );
  }, [monthTransactions]);

  const usciteData = useMemo(() => {
    return groupByCategory(
      monthTransactions.filter((t) => t.type === "uscita")
    );
  }, [monthTransactions]);

  return (
    <div className="my-5">
      <h4 className="text-center mb-4">
        Bilancio di{" "}
        {new Date(selectedYear, selectedMonth).toLocaleString("it-IT", {
          month: "long",
          year: "numeric",
        })}
      </h4>

      <div className="row">
        {/* Entrate */}
        <div className="col-md-6 col-12 mb-4">
          <h5 className="text-center text-success">Entrate</h5>
          {entrateData.length > 0 ? (
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={entrateData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={150}
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
        <div className="col-md-6 col-12 mb-4">
          <h5 className="text-center text-danger">Uscite</h5>
          {usciteData.length > 0 ? (
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={usciteData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={150}
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
      </div>
    </div>
  );
}
