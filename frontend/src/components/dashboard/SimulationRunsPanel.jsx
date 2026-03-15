function SimulationRunsPanel({
  runs,
  selectedRunId,
  isLoading,
  onRefresh,
  onView,
  onDelete,
  onClearSelection,
}) {
  const formatCompactNumber = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "-";
    }

    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }

    return value.toFixed(1);
  };

  return (
    <section style={{ marginTop: "1.5rem", textAlign: "left" }}>
      <h2>Simulation Runs</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={!selectedRunId}
        >
          Back to Live Stream
        </button>
      </div>

      {runs.length === 0 ? (
        <p>No saved runs yet. Finish a simulation to persist the first run.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Run ID</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Tax</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Police</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Welfare</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>
                Max Days
              </th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Days</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Avg GDP</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>
                Avg Crime
              </th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>
                Avg Unemp
              </th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>
                Final Ineq
              </th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>
                Max Panic
              </th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Created</th>
              <th style={{ textAlign: "left", padding: "0.35rem" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.runId}
                style={{
                  backgroundColor:
                    selectedRunId === run.runId
                      ? "rgba(0, 128, 128, 0.12)"
                      : "transparent",
                }}
              >
                <td style={{ padding: "0.35rem" }}>{run.runId}</td>
                <td style={{ padding: "0.35rem" }}>
                  {((run.parameters?.taxRate ?? 0) * 100).toFixed(0)}%
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {((run.parameters?.policeStrength ?? 0) * 100).toFixed(0)}%
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {((run.parameters?.welfareRate ?? 0) * 100).toFixed(0)}%
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {run.parameters?.maxDays ?? "-"}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {run.summary?.daysSimulated ?? "-"}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {formatCompactNumber(run.summary?.avgGDP)}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {typeof run.summary?.avgCrime === "number"
                    ? run.summary.avgCrime.toFixed(1)
                    : "-"}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {typeof run.summary?.avgUnemployment === "number"
                    ? `${(run.summary.avgUnemployment * 100).toFixed(1)}%`
                    : "-"}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {typeof run.summary?.finalInequality === "number"
                    ? run.summary.finalInequality.toFixed(2)
                    : "-"}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {typeof run.summary?.maxPanicLevel === "number"
                    ? run.summary.maxPanicLevel.toFixed(3)
                    : "-"}
                </td>
                <td style={{ padding: "0.35rem" }}>
                  {run.createdAt
                    ? new Date(run.createdAt).toLocaleString()
                    : "-"}
                </td>
                <td style={{ padding: "0.35rem", whiteSpace: "nowrap" }}>
                  <button type="button" onClick={() => onView(run.runId)}>
                    View
                  </button>{" "}
                  <button
                    type="button"
                    onClick={() => onDelete(run.runId)}
                    style={{ color: "#f87171" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default SimulationRunsPanel;
