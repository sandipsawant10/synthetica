import { Button } from "@mui/material";

function DashboardControls({
  worldState,
  isTogglingFakeNews,
  onToggleFakeNews,
  onTriggerEconomicShock,
  onTaxChange,
  onPoliceFundingChange,
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggleFakeNews}
        disabled={isTogglingFakeNews}
      >
        {isTogglingFakeNews
          ? "Updating..."
          : worldState.autoFakeNewsEnabled
            ? "Stop Trigger Fake News"
            : "Start Trigger Fake News"}
      </button>

      <Button
        variant="contained"
        color="warning"
        onClick={onTriggerEconomicShock}
      >
        Trigger Economic Shock
      </Button>

      <label>
        Tax Rate: {(worldState.taxRate * 100).toFixed(0)}%
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={worldState.taxRate}
          onChange={onTaxChange}
        />
      </label>

      <label>
        Police Funding: {(worldState.policeStrength * 100).toFixed(0)}%
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={worldState.policeStrength}
          onChange={onPoliceFundingChange}
        />
      </label>
    </>
  );
}

export default DashboardControls;
