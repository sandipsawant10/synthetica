import { useEffect, useMemo, useState } from "react";
import {
  updatePolicy,
  toggleFakeNews,
  triggerEconomicShock,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  updateSimulationConfig,
  fetchSimulationRuns,
  fetchSimulationRunById,
  fetchScenarioTemplates,
  startSimulation,
  deleteSimulationRun,
} from "../../services/simulationService";
import useSimulationStream from "../../hooks/useSimulationStream";
import PanicHeatmap from "../PanicHeatmap";
import CrimeChart from "../CrimeChart";
import GDPChart from "../GDPChart";
import DashboardStats from "./DashboardStats";
import DashboardControls from "./DashboardControls";
import SimulationRunsPanel from "./SimulationRunsPanel";
import CompareRunsPanel from "./CompareRunsPanel";
import { transformHistoryPayload } from "../../services/historyService";

function Dashboard() {
  const [isTogglingFakeNews, setIsTogglingFakeNews] = useState(false);
  const [runs, setRuns] = useState([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [scenarios, setScenarios] = useState([
    {
      key: "baseline",
      name: "Baseline Economy",
      label: "Baseline Economy",
      description: "Standard economic conditions with balanced policy levers.",
    },
    {
      key: "highTax",
      name: "High Tax Economy",
      label: "High Tax Economy",
      description:
        "Higher taxation to fund redistribution and public services.",
    },
    {
      key: "highWelfare",
      name: "High Welfare Economy",
      label: "High Welfare Economy",
      description: "Expanded welfare support to reduce social vulnerability.",
    },
    {
      key: "highPolice",
      name: "High Police Economy",
      label: "High Police Economy",
      description: "Increased policing emphasis for crime suppression.",
    },
    {
      key: "economicCrisis",
      name: "Economic Crisis",
      label: "Economic Crisis",
      description: "Stress scenario with elevated welfare and active stimulus.",
    },
  ]);
  const [selectedScenario, setSelectedScenario] = useState("baseline");
  const [selectedSeed, setSelectedSeed] = useState("42");
  const [isStartingSimulation, setIsStartingSimulation] = useState(false);
  const { worldState, history, lastSavedRunId, mergeWorldState } =
    useSimulationStream();

  const displayedHistory = useMemo(() => {
    if (!selectedRun?.history) {
      return history;
    }

    return transformHistoryPayload(selectedRun.history);
  }, [history, selectedRun]);

  const loadRuns = async () => {
    setIsLoadingRuns(true);

    try {
      const response = await fetchSimulationRuns(50);
      setRuns(response.data?.data ?? []);
    } catch (error) {
      console.error("Error loading simulation runs:", error);
    } finally {
      setIsLoadingRuns(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await fetchScenarioTemplates();
      const scenarioMap = response.data?.data ?? {};
      const scenarioList = Object.entries(scenarioMap).map(([key, value]) => ({
        key,
        name: value?.name || value?.label || key,
        label: value?.label || value?.name || key,
        description: value?.description || "",
      }));

      if (scenarioList.length > 0) {
        setScenarios(scenarioList);

        if (
          !scenarioList.some((scenario) => scenario.key === selectedScenario)
        ) {
          setSelectedScenario(scenarioList[0].key);
        }
      }
    } catch (error) {
      console.error("Error loading scenarios:", error);
    }
  };

  const handleStartScenario = async () => {
    setIsStartingSimulation(true);

    try {
      const parsedSeed = Number.parseInt(selectedSeed, 10);
      const response = await startSimulation(
        selectedScenario,
        Number.isFinite(parsedSeed) ? parsedSeed : 42,
      );
      mergeWorldState({
        status: response.data?.status || "running",
        running: true,
        day: 0,
        limitReached: false,
        summary: null,
        seed: response.data?.seed,
      });
      setSelectedRun(null);
    } catch (error) {
      console.error("Error starting simulation:", error);
    } finally {
      setIsStartingSimulation(false);
    }
  };

  const handleViewRun = async (runId) => {
    try {
      const response = await fetchSimulationRunById(runId);
      setSelectedRun(response.data?.data ?? null);
    } catch (error) {
      console.error("Error loading simulation run:", error);
    }
  };

  const handleClearSelection = () => {
    setSelectedRun(null);
  };

  const handleDeleteRun = async (runId) => {
    if (!window.confirm(`Delete run ${runId}? This cannot be undone.`)) return;

    try {
      await deleteSimulationRun(runId);
      if (selectedRun?.runId === runId) setSelectedRun(null);
      setRuns((prev) => prev.filter((r) => r.runId !== runId));
    } catch (error) {
      console.error("Error deleting simulation run:", error);
    }
  };

  useEffect(() => {
    void loadRuns();
    void loadScenarios();
  }, []);

  useEffect(() => {
    if (lastSavedRunId) {
      void loadRuns();
    }
  }, [lastSavedRunId]);

  const handleTaxChange = async (e) => {
    const newTax = parseFloat(e.target.value);

    // Update local state immediately for responsive UI
    mergeWorldState({ taxRate: newTax });

    try {
      await updatePolicy({ taxRate: newTax });
    } catch (error) {
      console.error("Error updating tax rate:", error);
    }
  };

  const handlePoliceFundingChange = async (e) => {
    const newPoliceStrength = parseFloat(e.target.value);

    mergeWorldState({ policeStrength: newPoliceStrength });

    try {
      await updatePolicy({ policeStrength: newPoliceStrength });
    } catch (error) {
      console.error("Error updating police funding:", error);
    }
  };

  const handleToggleFakeNews = async () => {
    setIsTogglingFakeNews(true);

    try {
      const response = await toggleFakeNews();

      mergeWorldState({
        autoFakeNewsEnabled: response.data.autoFakeNewsEnabled,
      });
    } catch (error) {
      console.error("Error toggling fake news trigger:", error);
    } finally {
      setIsTogglingFakeNews(false);
    }
  };

  const handleTriggerEconomicShock = async () => {
    try {
      await triggerEconomicShock();
    } catch (error) {
      console.error("Error triggering economic shock:", error);
    }
  };

  const handlePause = async () => {
    try {
      await pauseSimulation();
    } catch (error) {
      console.error("Error pausing simulation:", error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeSimulation();
    } catch (error) {
      console.error("Error resuming simulation:", error);
    }
  };

  const handleStep = async () => {
    try {
      await stepSimulation();
    } catch (error) {
      console.error("Error stepping simulation:", error);
    }
  };

  const handleReset = async () => {
    try {
      await resetSimulation();
    } catch (error) {
      console.error("Error resetting simulation:", error);
    }
  };

  const handleSetMaxDays = async (maxDays) => {
    try {
      await updateSimulationConfig(maxDays);
      mergeWorldState({
        maxDays,
        limitReached: worldState.day >= maxDays,
        summary: null,
        running: worldState.day >= maxDays ? false : worldState.running,
      });
    } catch (error) {
      console.error("Error updating simulation max days:", error);
    }
  };

  const panicLevels = worldState.panicLevels || [];
  const avgPanic =
    panicLevels.length > 0
      ? panicLevels.reduce((sum, value) => sum + value, 0) / panicLevels.length
      : 0;

  const maxPanic = panicLevels.length > 0 ? Math.max(...panicLevels) : 0;

  const statusMeta = {
    running: { icon: "🟢", label: "Running" },
    idle: { icon: "🟡", label: "Idle" },
    completed: { icon: "🔵", label: "Completed" },
  };

  const activeStatus = statusMeta[worldState.status] || statusMeta.idle;

  return (
    <div>
      <section style={{ textAlign: "left", marginBottom: "0.75rem" }}>
        <h2>Simulation Status</h2>
        <p>
          {activeStatus.icon} {activeStatus.label}
        </p>
      </section>

      <DashboardStats
        worldState={worldState}
        avgPanic={avgPanic}
        maxPanic={maxPanic}
      />
      {selectedRun ? (
        <p>
          Viewing saved run <strong>{selectedRun.runId}</strong>. Charts below
          are loaded from persisted history.
        </p>
      ) : null}
      <PanicHeatmap panicLevels={worldState.panicLevels} />
      <CrimeChart history={displayedHistory} />
      <br />
      <br />
      <GDPChart history={displayedHistory} />

      <SimulationRunsPanel
        runs={runs}
        selectedRunId={selectedRun?.runId ?? null}
        isLoading={isLoadingRuns}
        onRefresh={loadRuns}
        onView={handleViewRun}
        onDelete={handleDeleteRun}
        onClearSelection={handleClearSelection}
      />

      <CompareRunsPanel runs={runs} />

      <DashboardControls
        worldState={worldState}
        scenarios={scenarios}
        selectedScenario={selectedScenario}
        selectedSeed={selectedSeed}
        isStartingSimulation={isStartingSimulation}
        onScenarioChange={setSelectedScenario}
        onSeedChange={setSelectedSeed}
        onStartSimulation={handleStartScenario}
        isTogglingFakeNews={isTogglingFakeNews}
        onToggleFakeNews={handleToggleFakeNews}
        onTriggerEconomicShock={handleTriggerEconomicShock}
        onTaxChange={handleTaxChange}
        onPoliceFundingChange={handlePoliceFundingChange}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onReset={handleReset}
        onSetMaxDays={handleSetMaxDays}
      />
    </div>
  );
}

export default Dashboard;
