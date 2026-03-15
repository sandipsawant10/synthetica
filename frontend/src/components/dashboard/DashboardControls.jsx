import { Button } from "@mui/material";

function DashboardControls({
  worldState,
  scenarios,
  selectedScenario,
  selectedSeed,
  isStartingSimulation,
  onScenarioChange,
  onSeedChange,
  onStartSimulation,
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
  const selectedScenarioMeta =
    scenarios.find((scenario) => scenario.key === selectedScenario) || null;

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h3>Simulation Controls</h3>
        <p>
          Day {worldState.day} of {worldState.maxDays}
          {worldState.limitReached ? " (finished)" : ""}
        </p>
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="scenario-select" style={{ marginRight: "8px" }}>
            Scenario
          </label>
          <select
            id="scenario-select"
            value={selectedScenario}
            onChange={(event) => onScenarioChange(event.target.value)}
            disabled={worldState.status === "running" || isStartingSimulation}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.key} value={scenario.key}>
                {scenario.name || scenario.label}
              </option>
            ))}
          </select>
          <Button
            variant="contained"
            color="success"
            onClick={onStartSimulation}
            disabled={worldState.status === "running" || isStartingSimulation}
            style={{ marginLeft: "10px" }}
          >
            {isStartingSimulation ? "Starting..." : "Start Scenario"}
          </Button>
        </div>
        {selectedScenarioMeta?.description ? (
          <p style={{ marginTop: "-4px", marginBottom: "12px", opacity: 0.8 }}>
            Scenario: {selectedScenarioMeta.name || selectedScenarioMeta.label}
            <br />
            Description: {selectedScenarioMeta.description}
          </p>
        ) : null}
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="seed-input" style={{ marginRight: "8px" }}>
            Seed
          </label>
          <input
            id="seed-input"
            type="number"
            value={selectedSeed}
            onChange={(event) => onSeedChange(event.target.value)}
            disabled={worldState.status === "running" || isStartingSimulation}
            style={{ width: "140px" }}
          />
          <span style={{ marginLeft: "10px", opacity: 0.75 }}>
            Same scenario + same seed = same results
          </span>
        </div>
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
