const agentCount = 1000;

const simulationState = {
  agents: {
    income: new Float64Array(agentCount),
    happiness: new Float32Array(agentCount),
    employed: new Uint8Array(agentCount),
    savings: new Float64Array(agentCount),
    wealth: new Float64Array(agentCount),
    capital: new Float64Array(agentCount),
    risk: new Float32Array(agentCount),
    spending: new Float32Array(agentCount),
    influence: new Float32Array(agentCount),
    trust: new Float32Array(agentCount),
    panic: new Float32Array(agentCount),
    connections: [],
  },

  metrics: {
    day: 0,
    gdp: 0,
    crime: 0,
    unemployment: 0,
    avyHappiness: 0,
    totalWealth: 0,
    topTenWealthShare: 0,
    bottomFiftyWealthShare: 0,
    stimulusActive: false,
    fakeNewsEvent: false,
  },

  history: {
    days: [],
    gdp: [],
    crime: [],
    unemployment: [],
    happiness: [],
    inequality: [],
  },

  policy: {
    taxRate: 0.1,
    policeStrength: 0.2,
    welfareRate: 0.25,
    stimulusMultiplier: 1,
  },
};

// Build a deterministic baseline ring network.
// generateAgents() replaces this each simulation start.
const { connections } = simulationState.agents;

// Step 1: Build ring network with local connections
for (let i = 0; i < agentCount; i++) {
  const neighbors = [];
  for (let j = 1; j <= 3; j++) {
    neighbors.push((i + j) % agentCount);
    neighbors.push((i - j + agentCount) % agentCount);
  }
  connections.push(neighbors);
}

export { agentCount, simulationState };
