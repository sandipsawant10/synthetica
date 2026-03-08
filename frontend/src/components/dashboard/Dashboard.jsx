import { useState } from "react";
import {
  updateTaxRate,
  updatePoliceStrength,
  toggleFakeNews,
  triggerEconomicShock,
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
      await updateTaxRate(newTax);
    } catch (error) {
      console.error("Error updating tax rate:", error);
    }
  };

  const handlePoliceFundingChange = async (e) => {
    const newPoliceStrength = parseFloat(e.target.value);

    mergeWorldState({ policeStrength: newPoliceStrength });

    try {
      await updatePoliceStrength(newPoliceStrength);
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
      />
    </div>
  );
}

export default Dashboard;
