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

  return (
    <div>
      <h2>Day: {worldState.day}</h2>
      <p>GDP: {worldState.gdp.toFixed(0)}</p>
      <p>Crime Rate: {worldState.crimeRate}</p>
      <p>Happiness: {worldState.avgHappiness.toFixed(2)}</p>
      <p>Unemployment: {(worldState.unemployment * 100).toFixed(2)}%</p>
      <p>Tax Rate: {(worldState.taxRate * 100).toFixed(2)}%</p>
    </div>
  );
}

export default Dashboard;
