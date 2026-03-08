import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function CrimeChart({ history = [] }) {
  return (
    <LineChart width={500} height={250} data={history}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="crime" stroke="#3b82f6" strokeWidth={2} />
    </LineChart>
  );
}

export default CrimeChart;
