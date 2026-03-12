import { useState } from "react";
import {
  updatePolicy,
  toggleFakeNews,
  triggerEconomicShock,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  updateSimulationConfig,
} from "../../services/simulationService";
import useSimulationStream from "../../hooks/useSimulationStream";
import PanicHeatmap from "../PanicHeatmap";
import CrimeChart from "../CrimeChart";
import GDPChart from "../GDPChart";
import DashboardStats from "./DashboardStats";
import DashboardControls from "./DashboardControls";

function Dashboard() {
  const [isTogglingFakeNews, setIsTogglingFakeNews] = useState(false);
  const { worldState, history, mergeWorldState } = useSimulationStream();

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

  return (
    <div>
      <DashboardStats
        worldState={worldState}
        avgPanic={avgPanic}
        maxPanic={maxPanic}
      />
      <PanicHeatmap panicLevels={worldState.panicLevels} />
      <CrimeChart history={history} />
      <br />
      <br />
      <GDPChart history={history} />

      <DashboardControls
        worldState={worldState}
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
