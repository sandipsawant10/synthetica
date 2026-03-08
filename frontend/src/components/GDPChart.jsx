import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function GDPChart({ history = [] }) {
  return (
    <LineChart width={500} height={250} data={history}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="gdp" stroke="#10b981" strokeWidth={2} />
    </LineChart>
  );
}

export default GDPChart;
