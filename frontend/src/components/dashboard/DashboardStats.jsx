function DashboardStats({ worldState, avgPanic, maxPanic }) {
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
        Bottom 50% Wealth Share: {(worldState.bottomFiftyWealthShare * 100).toFixed(2)}%
      </p>
      <p>Total Wealth: {worldState.totalWealth.toFixed(0)}</p>
      <p>Fake News Event: {worldState.fakeNewsEvent ? "Yes" : "No"}</p>
      <p>Average Panic: {avgPanic.toFixed(3)}</p>
      <p>Max Panic: {maxPanic.toFixed(3)}</p>
    </>
  );
}

export default DashboardStats;
