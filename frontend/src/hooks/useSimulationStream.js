import { useEffect, useState } from "react";
import socket from "../services/socketService";
import {
  fetchHistory,
  transformHistoryPayload,
} from "../services/historyService";

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

    loadInitialHistory();

    const handleFastUpdate = (data) => {
      setWorldState((prev) => ({ ...prev, ...data }));
    };

    const handleSlowUpdate = (data) => {
      setWorldState((prev) => ({ ...prev, ...data }));
    };

    const handleHistoryUpdate = (rawHistory) => {
      setHistory(transformHistoryPayload(rawHistory));
    };

    socket.on("fastUpdate", handleFastUpdate);
    socket.on("slowUpdate", handleSlowUpdate);
    socket.on("historyUpdate", handleHistoryUpdate);

    return () => {
      socket.off("fastUpdate", handleFastUpdate);
      socket.off("slowUpdate", handleSlowUpdate);
      socket.off("historyUpdate", handleHistoryUpdate);
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
