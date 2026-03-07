import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../services/socketService";
import PanicHeatmap from "./PanicHeatmap";

function Dashboard() {
  const [isTogglingFakeNews, setIsTogglingFakeNews] = useState(false);

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
    fakeNewsEvent: false,
    autoFakeNewsEnabled: false,
    panicLevels: [],
  });

  useEffect(() => {
    // Fast stream: real-time metrics (every tick)
    socket.on("fastUpdate", (data) => {
      setWorldState((prev) => ({ ...prev, ...data }));
    });

    // Slow stream: analytics metrics (every 5 ticks)
    socket.on("slowUpdate", (data) => {
      setWorldState((prev) => ({ ...prev, ...data }));
    });

    return () => {
      socket.off("fastUpdate");
      socket.off("slowUpdate");
    };
  }, []);

  const handleTaxChange = async (e) => {
    const newTax = parseFloat(e.target.value);

    // Update local state immediately for responsive UI
    setWorldState((prev) => ({ ...prev, taxRate: newTax }));

    try {
      await axios.post("http://localhost:3000/policy/tax", {
        taxRate: newTax,
      });
    } catch (error) {
      console.error("Error updating tax rate:", error);
    }
  };

  const handleToggleFakeNews = async () => {
    setIsTogglingFakeNews(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/policy/fake-news/toggle",
      );

      setWorldState((prev) => ({
        ...prev,
        autoFakeNewsEnabled: response.data.autoFakeNewsEnabled,
      }));
    } catch (error) {
      console.error("Error toggling fake news trigger:", error);
    } finally {
      setIsTogglingFakeNews(false);
    }
  };

  const panicLevels = worldState.panicLevels || [];
  const avgPanic =
    panicLevels.length > 0
      ? panicLevels.reduce((sum, value) => sum + value, 0) / panicLevels.length
      : 0;

  const maxPanic = panicLevels.length > 0 ? Math.max(...panicLevels) : 0;

  return (
    <div>
      <h2>Day: {worldState.day}</h2>
      <p>GDP: {worldState.gdp.toFixed(0)}</p>
      <p>Crime Rate: {worldState.crimeRate}</p>
      <p>Happiness: {worldState.avgHappiness.toFixed(2)}</p>
      <p>Unemployment: {(worldState.unemployment * 100).toFixed(2)}%</p>
      <p>Tax Rate: {(worldState.taxRate * 100).toFixed(2)}%</p>
      <p>
        Top 10% Wealth Share: {(worldState.topTenWealthShare * 100).toFixed(2)}%
      </p>
      <p>
        Bottom 50% Wealth Share:{" "}
        {(worldState.bottomFiftyWealthShare * 100).toFixed(2)}%
      </p>
      <p>Total Wealth: {worldState.totalWealth.toFixed(0)}</p>
      <p>Fake News Event: {worldState.fakeNewsEvent ? "Yes" : "No"}</p>
      <p>Average Panic: {avgPanic.toFixed(3)}</p>
      <p>Max Panic: {maxPanic.toFixed(3)}</p>
      <PanicHeatmap panicLevels={worldState.panicLevels} />

      <button
        type="button"
        onClick={handleToggleFakeNews}
        disabled={isTogglingFakeNews}
      >
        {isTogglingFakeNews
          ? "Updating..."
          : worldState.autoFakeNewsEnabled
            ? "Stop Trigger Fake News"
            : "Start Trigger Fake News"}
      </button>

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
