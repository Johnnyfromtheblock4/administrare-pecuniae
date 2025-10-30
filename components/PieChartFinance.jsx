import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4CAF50", "#FF6B6B"];

export default function PieChartFinance({ transactions }) {
  const data = useMemo(() => {
    const entrate = transactions
      .filter((t) => t.type === "entrata")
      .reduce((sum, t) => sum + Number(t.importo), 0);
    const uscite = transactions
      .filter((t) => t.type === "uscita")
      .reduce((sum, t) => sum + Number(t.importo), 0);

    return [
      { name: "Entrate", value: entrate },
      { name: "Uscite", value: uscite },
    ];
  }, [transactions]);

  return (
    <div className="my-5">
      <h4 className="text-center mb-4">Bilancio Mensile</h4>
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={150}
              cx="50%"
              cy="50%"
              label
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
