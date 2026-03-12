import { Button } from "@mui/material";

function DashboardControls({
  worldState,
  isTogglingFakeNews,
  onToggleFakeNews,
  onTriggerEconomicShock,
  onTaxChange,
  onPoliceFundingChange,
  onPause,
  onResume,
  onStep,
  onReset,
  onSetMaxDays,
}) {
  const dayPresets = [100, 500, 1000];

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h3>Simulation Controls</h3>
        <p>
          Day {worldState.day} of {worldState.maxDays}
          {worldState.limitReached ? " (finished)" : ""}
        </p>
        <Button variant="contained" color="primary" onClick={onPause}>
          Pause
        </Button>{" "}
        <Button variant="contained" color="primary" onClick={onResume}>
          Resume
        </Button>{" "}
        <Button variant="contained" color="secondary" onClick={onStep}>
          Step (Next Day)
        </Button>{" "}
        <Button variant="contained" color="error" onClick={onReset}>
          Reset
        </Button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Simulation Limit</h3>
        {dayPresets.map((days) => (
          <Button
            key={days}
            variant={worldState.maxDays === days ? "contained" : "outlined"}
            color="success"
            onClick={() => onSetMaxDays(days)}
            style={{ marginRight: "8px" }}
          >
            Run {days} days
          </Button>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Events</h3>
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
        </button>{" "}
        <Button
          variant="contained"
          color="warning"
          onClick={onTriggerEconomicShock}
        >
          Trigger Economic Shock
        </Button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Policy Settings</h3>
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
      </div>
    </>
  );
}

export default DashboardControls;
