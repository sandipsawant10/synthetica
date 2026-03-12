import { useEffect, useState } from "react";
import socket from "../services/socketService";
import {
  fetchHistory,
  transformHistoryPayload,
} from "../services/historyService";
import { getSimulationStatus } from "../services/simulationService";

const initialWorldState = {
  day: 0,
  gdp: 0,
  crimeRate: 0,
  avgHappiness: 0,
  unemployment: 0,
  taxRate: 0,
  policeStrength: 0.2,
  topTenWealthShare: 0,
  bottomFiftyWealthShare: 0,
  totalWealth: 0,
  fakeNewsEvent: false,
  autoFakeNewsEnabled: false,
  panicLevels: [],
  running: false,
  maxDays: 500,
  limitReached: false,
  summary: null,
};

function useSimulationStream() {
  const [worldState, setWorldState] = useState(initialWorldState);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadInitialHistory = async () => {
      try {
        const initialHistory = await fetchHistory();
        setHistory(initialHistory);
      } catch (error) {
        console.error("Error fetching initial history:", error);
      }
    };

    const loadInitialStatus = async () => {
      try {
        const response = await getSimulationStatus();
        setWorldState((prev) => ({ ...prev, ...response.data }));
      } catch (error) {
        console.error("Error fetching initial simulation status:", error);
      }
    };

    loadInitialHistory();
    loadInitialStatus();

    const handleFastUpdate = (data) => {
      setWorldState((prev) => ({ ...prev, ...data }));
    };

    const handleSlowUpdate = (data) => {
      setWorldState((prev) => ({ ...prev, ...data }));
    };

    const handleHistoryUpdate = (rawHistory) => {
      setHistory(transformHistoryPayload(rawHistory));
    };

    const handleSimulationStatusChanged = ({ type, payload }) => {
      if (type === "SIMULATION_PAUSED") {
        setWorldState((prev) => ({ ...prev, running: false }));
      }

      if (type === "SIMULATION_RESUMED" || type === "SIMULATION_STARTED") {
        setWorldState((prev) => ({
          ...prev,
          running: true,
          limitReached: false,
          summary: null,
        }));
      }

      if (type === "SIMULATION_RESET") {
        setWorldState((prev) => ({
          ...prev,
          running: true,
          day: 0,
          gdp: 0,
          crimeRate: 0,
          avgHappiness: 0,
          unemployment: 0,
          fakeNewsEvent: false,
          limitReached: false,
          panicLevels: [],
          summary: null,
        }));
      }

      if (type === "SIMULATION_COMPLETED") {
        setWorldState((prev) => ({
          ...prev,
          running: false,
          limitReached: true,
          summary: payload?.summary ?? prev.summary,
        }));
      }
    };

    socket.on("fastUpdate", handleFastUpdate);
    socket.on("slowUpdate", handleSlowUpdate);
    socket.on("historyUpdate", handleHistoryUpdate);
    socket.on("simulationStatusChanged", handleSimulationStatusChanged);

    return () => {
      socket.off("fastUpdate", handleFastUpdate);
      socket.off("slowUpdate", handleSlowUpdate);
      socket.off("historyUpdate", handleHistoryUpdate);
      socket.off("simulationStatusChanged", handleSimulationStatusChanged);
    };
  }, []);

  const mergeWorldState = (partialState) => {
    setWorldState((prev) => ({ ...prev, ...partialState }));
  };

  return {
    worldState,
    history,
    mergeWorldState,
  };
}

export default useSimulationStream;
