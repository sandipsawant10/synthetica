import { useEffect, useState } from "react";
import socket from "../services/socketService";

function Dashboard() {
  const [worldState, setWorldState] = useState({
    day: 0,
    gdp: 0,
    crimeRate: 0,
    avgHappiness: 0,
    unemployment: 0,
    taxRate: 0,
    topTenWealthShare: 0,
    bottomFiftyWealthShare: 0,
    totalWealth: 0,
  });

  useEffect(() => {
    socket.on("worldUpdate", (data) => {
      console.log("Received worldUpdate:", data);
      setWorldState(data);
    });

    return () => {
      socket.off("worldUpdate");
    };
  }, []);

  const handleTaxChange = async (e) => {
    const newTax = parseFloat(e.target.value);

    // Update local state immediately for responsive UI
    setWorldState((prev) => ({ ...prev, taxRate: newTax }));

    try {
      const response = await fetch("http://localhost:3000/policy/tax", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taxRate: newTax }),
      });

      if (!response.ok) {
        console.error("Failed to update tax rate:", response.status);
      }
    } catch (error) {
      console.error("Error updating tax rate:", error);
    }
  };

  return (
    <div>
      <h2>Day: {worldState.day}</h2>
      <p>GDP: {worldState.gdp.toFixed(0)}</p>
      <p>Crime Rate: {worldState.crimeRate}</p>
      <p>Happiness: {worldState.avgHappiness.toFixed(2)}</p>
      <p>Unemployment: {(worldState.unemployment * 100).toFixed(2)}%</p>
      <p>Tax Rate: {(worldState.taxRate * 100).toFixed(2)}%</p>
      <p>Top 10% Wealth Share: {(worldState.topTenWealthShare * 100).toFixed(2)}%</p>
      <p>Bottom 50% Wealth Share: {(worldState.bottomFiftyWealthShare * 100).toFixed(2)}%</p>
      <p>Total Wealth: {worldState.totalWealth.toFixed(0)}</p>
      <label>
        Tax Rate: {(worldState.taxRate * 100).toFixed(0)}%
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={worldState.taxRate}
          onChange={handleTaxChange}
        />
      </label>
    </div>
  );
}

export default Dashboard;
