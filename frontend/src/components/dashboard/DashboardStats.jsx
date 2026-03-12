function formatAverageGdp(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toFixed(1);
}

function DashboardStats({ worldState, avgPanic, maxPanic }) {
  const summary = worldState.summary;

  return (
    <>
      <h2>Day: {worldState.day}</h2>
      <p>GDP: {worldState.gdp.toFixed(0)}</p>
      <p>Crime Rate: {worldState.crimeRate}</p>
      <p>Happiness: {worldState.avgHappiness.toFixed(2)}</p>
      <p>Unemployment: {(worldState.unemployment * 100).toFixed(2)}%</p>
      <p>Tax Rate: {(worldState.taxRate * 100).toFixed(2)}%</p>
      <p>
        Top 10% Wealth Share: {(worldState.topTenWealthShare * 100).toFixed(2)}%
      </p>
      <p>
        Bottom 50% Wealth Share:{" "}
        {(worldState.bottomFiftyWealthShare * 100).toFixed(2)}%
      </p>
      <p>Total Wealth: {worldState.totalWealth.toFixed(0)}</p>
      <p>Fake News Event: {worldState.fakeNewsEvent ? "Yes" : "No"}</p>
      <p>Average Panic: {avgPanic.toFixed(3)}</p>
      <p>Max Panic: {maxPanic.toFixed(3)}</p>

      {summary ? (
        <>
          <h3>Simulation Summary</h3>
          <p>Days simulated: {summary.daysSimulated}</p>
          <p>Average GDP: {formatAverageGdp(summary.averageGdp)}</p>
          <p>Average Crime: {summary.averageCrime.toFixed(1)}</p>
          <p>
            Average Unemployment:{" "}
            {(summary.averageUnemployment * 100).toFixed(1)}%
          </p>
          <p>Final Inequality: {summary.finalInequality.toFixed(2)}</p>
          <p>Max Panic Level: {summary.maxPanicLevel.toFixed(3)}</p>
        </>
      ) : null}
    </>
  );
}

export default DashboardStats;
