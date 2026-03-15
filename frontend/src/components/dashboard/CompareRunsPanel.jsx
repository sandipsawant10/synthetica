import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compareRuns } from "../../services/simulationService";

const COLORS = { A: "#10b981", B: "#f59e0b" };

function formatSummaryValue(key, value) {
  if (value === null || value === undefined) return "-";
  if (key === "avgUnemployment") return `${(value * 100).toFixed(1)}%`;
  if (key === "avgGDP") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(1);
  }
  if (key === "finalInequality" || key === "maxPanicLevel")
    return value.toFixed(3);
  if (key === "daysSimulated") return value;
  return value.toFixed(2);
}

const SUMMARY_LABELS = {
  avgGDP: "Avg GDP",
  avgCrime: "Avg Crime",
  avgUnemployment: "Avg Unemployment",
  avgHappiness: "Avg Happiness",
  finalInequality: "Final Inequality",
  maxPanicLevel: "Max Panic",
  daysSimulated: "Days Simulated",
};

function buildChartData(runA, runB, seriesKey) {
  const a = Array.isArray(runA?.[seriesKey]) ? runA[seriesKey] : [];
  const b = Array.isArray(runB?.[seriesKey]) ? runB[seriesKey] : [];
  const len = Math.max(a.length, b.length);
  if (len === 0) return [];

  const daysA = Array.isArray(runA?.days) ? runA.days : [];
  const daysB = Array.isArray(runB?.days) ? runB.days : [];

  return Array.from({ length: len }, (_, i) => ({
    day: daysA[i] ?? daysB[i] ?? i + 1,
    runA: a[i] ?? null,
    runB: b[i] ?? null,
  }));
}

function OverlayChart({ title, data, formatter }) {
  if (data.length === 0) {
    return <p style={{ opacity: 0.6 }}>No data for {title}.</p>;
  }

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h4 style={{ marginBottom: "0.35rem" }}>{title}</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            label={{ value: "Day", position: "insideBottom", offset: -2 }}
          />
          <YAxis tickFormatter={formatter} width={64} />
          <Tooltip
            formatter={(v, name) => [formatter ? formatter(v) : v, name]}
          />
          <Legend verticalAlign="top" />
          <Line
            type="monotone"
            dataKey="runA"
            name="Run A"
            stroke={COLORS.A}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="runB"
            name="Run B"
            stroke={COLORS.B}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryTable({ runA, runB }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "1.5rem",
        fontSize: "0.9rem",
      }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "0.4rem 0.5rem" }}>
            Metric
          </th>
          <th
            style={{
              textAlign: "right",
              padding: "0.4rem 0.5rem",
              color: COLORS.A,
            }}
          >
            Run A — {runA.runId}
          </th>
          <th
            style={{
              textAlign: "right",
              padding: "0.4rem 0.5rem",
              color: COLORS.B,
            }}
          >
            Run B — {runB.runId}
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(SUMMARY_LABELS).map(([key, label]) => {
          const vA = runA[key];
          const vB = runB[key];
          return (
            <tr key={key}>
              <td style={{ padding: "0.3rem 0.5rem" }}>{label}</td>
              <td style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>
                {formatSummaryValue(key, vA)}
              </td>
              <td style={{ textAlign: "right", padding: "0.3rem 0.5rem" }}>
                {formatSummaryValue(key, vB)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CompareRunsPanel({ runs }) {
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const canCompare =
    selectedA && selectedB && selectedA !== selectedB && !isLoading;

  const handleCompare = async () => {
    setIsLoading(true);
    setError(null);
    setComparison(null);

    try {
      const response = await compareRuns(selectedA, selectedB);
      setComparison(response.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to compare runs.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setComparison(null);
    setError(null);
    setSelectedA("");
    setSelectedB("");
  };

  const gdpData = useMemo(
    () => buildChartData(comparison?.runA, comparison?.runB, "gdp"),
    [comparison],
  );
  const crimeData = useMemo(
    () => buildChartData(comparison?.runA, comparison?.runB, "crime"),
    [comparison],
  );
  const unemploymentData = useMemo(
    () => buildChartData(comparison?.runA, comparison?.runB, "unemployment"),
    [comparison],
  );

  return (
    <section
      style={{
        marginTop: "2rem",
        textAlign: "left",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        paddingTop: "1.25rem",
      }}
    >
      <h2>Compare Runs</h2>
      <p style={{ opacity: 0.7, marginBottom: "0.75rem" }}>
        Select two finished runs to overlay their curves and compare summary
        statistics.
      </p>

      {runs.length < 2 ? (
        <p>At least two saved runs are needed to compare.</p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <label>
              Run A
              <select
                value={selectedA}
                onChange={(e) => setSelectedA(e.target.value)}
                disabled={isLoading}
                style={{ marginLeft: "0.5rem" }}
              >
                <option value="">— select —</option>
                {runs.map((r) => (
                  <option
                    key={r.runId}
                    value={r.runId}
                    disabled={r.runId === selectedB}
                  >
                    {r.runId}
                    {r.parameters
                      ? ` (tax ${((r.parameters.taxRate ?? 0) * 100).toFixed(0)}% / welfare ${((r.parameters.welfareRate ?? 0) * 100).toFixed(0)}%)`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Run B
              <select
                value={selectedB}
                onChange={(e) => setSelectedB(e.target.value)}
                disabled={isLoading}
                style={{ marginLeft: "0.5rem" }}
              >
                <option value="">— select —</option>
                {runs.map((r) => (
                  <option
                    key={r.runId}
                    value={r.runId}
                    disabled={r.runId === selectedA}
                  >
                    {r.runId}
                    {r.parameters
                      ? ` (tax ${((r.parameters.taxRate ?? 0) * 100).toFixed(0)}% / welfare ${((r.parameters.welfareRate ?? 0) * 100).toFixed(0)}%)`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleCompare}
              disabled={!canCompare}
            >
              {isLoading ? "Loading…" : "Compare"}
            </button>

            {comparison || error ? (
              <button type="button" onClick={handleClear}>
                Clear
              </button>
            ) : null}
          </div>

          {error ? <p style={{ color: "#f87171" }}>Error: {error}</p> : null}

          {comparison ? (
            <>
              <SummaryTable runA={comparison.runA} runB={comparison.runB} />

              <OverlayChart
                title="GDP over Time"
                data={gdpData}
                formatter={(v) => {
                  if (v === null) return "—";
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                  return String(v);
                }}
              />

              <OverlayChart
                title="Crime over Time"
                data={crimeData}
                formatter={(v) => (v === null ? "—" : v.toFixed(1))}
              />

              <OverlayChart
                title="Unemployment over Time"
                data={unemploymentData}
                formatter={(v) =>
                  v === null ? "—" : `${(v * 100).toFixed(1)}%`
                }
              />
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

export default CompareRunsPanel;
