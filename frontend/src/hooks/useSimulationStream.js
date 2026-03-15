import { useEffect, useState } from "react";
import socket from "../services/socketService";
import {
  fetchHistory,
  transformHistoryPayload,
} from "../services/historyService";
import { getSimulationStatus } from "../services/simulationService";

const initialWorldState = {
  status: "idle",
  seed: 42,
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
  simulationSpeed: "normal",
  progress: 0,
  limitReached: false,
  summary: null,
};

function useSimulationStream() {
  const [worldState, setWorldState] = useState(initialWorldState);
  const [history, setHistory] = useState([]);
  const [lastSavedRunId, setLastSavedRunId] = useState(null);

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

    const handleSimulationProgress = (payload) => {
      const day = typeof payload?.day === "number" ? payload.day : 0;
      const maxDays =
        typeof payload?.maxDays === "number" ? payload.maxDays : 1;
      const computedProgress =
        typeof payload?.progress === "number"
          ? payload.progress
          : Math.min(day / Math.max(maxDays, 1), 1);

      setWorldState((prev) => ({
        ...prev,
        day,
        maxDays,
        progress: Math.max(0, Math.min(computedProgress, 1)),
      }));
    };

    const handleSimulationStatusChanged = ({ type, payload }) => {
      if (type === "SIMULATION_PAUSED") {
        setWorldState((prev) => ({ ...prev, running: false, status: "idle" }));
      }

      if (type === "SIMULATION_RESUMED" || type === "SIMULATION_STARTED") {
        setWorldState((prev) => ({
          ...prev,
          running: true,
          status: "running",
          seed: payload?.seed ?? prev.seed,
          progress: payload?.progress ?? prev.progress,
          limitReached: false,
          summary: null,
        }));
      }

      if (type === "SIMULATION_RESET") {
        setWorldState((prev) => ({
          ...prev,
          running: true,
          status: "running",
          day: 0,
          gdp: 0,
          crimeRate: 0,
          avgHappiness: 0,
          unemployment: 0,
          fakeNewsEvent: false,
          limitReached: false,
          progress: 0,
          panicLevels: [],
          summary: null,
        }));
      }

      if (type === "SIMULATION_COMPLETED") {
        setWorldState((prev) => ({
          ...prev,
          running: false,
          status: "completed",
          limitReached: true,
          progress: 1,
          summary: payload?.summary ?? prev.summary,
        }));
      }
    };

    const handleSimulationRunSaved = ({ runId }) => {
      setLastSavedRunId(runId);
    };

    socket.on("fastUpdate", handleFastUpdate);
    socket.on("slowUpdate", handleSlowUpdate);
    socket.on("historyUpdate", handleHistoryUpdate);
    socket.on("simulationProgress", handleSimulationProgress);
    socket.on("simulationStatusChanged", handleSimulationStatusChanged);
    socket.on("simulationRunSaved", handleSimulationRunSaved);

    return () => {
      socket.off("fastUpdate", handleFastUpdate);
      socket.off("slowUpdate", handleSlowUpdate);
      socket.off("historyUpdate", handleHistoryUpdate);
      socket.off("simulationProgress", handleSimulationProgress);
      socket.off("simulationStatusChanged", handleSimulationStatusChanged);
      socket.off("simulationRunSaved", handleSimulationRunSaved);
    };
  }, []);

  const mergeWorldState = (partialState) => {
    setWorldState((prev) => ({ ...prev, ...partialState }));
  };

  return {
    worldState,
    history,
    lastSavedRunId,
    mergeWorldState,
  };
}

export default useSimulationStream;
