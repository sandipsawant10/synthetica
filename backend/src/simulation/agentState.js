const agentCount = 1000;

const income = new Float64Array(agentCount);
const happiness = new Float32Array(agentCount);
const employed = new Uint8Array(agentCount);
const savings = new Float64Array(agentCount);
const wealth = new Float64Array(agentCount);
const capital = new Float64Array(agentCount);
const risk = new Float32Array(agentCount);
const spending = new Float32Array(agentCount);
const influence = new Float32Array(agentCount);
const trust = new Float32Array(agentCount);
const panic = new Float32Array(agentCount);

// Small-world network parameters
const neighborsPerAgent = 6; // k
const rewireProbability = 0.1; // p

// Step 1: Build ring network with local connections
const connections = [];
for (let i = 0; i < agentCount; i++) {
  const neighbors = [];
  // Connect to 3 nearest neighbors on each side
  for (let j = 1; j <= 3; j++) {
    neighbors.push((i + j) % agentCount);
    neighbors.push((i - j + agentCount) % agentCount);
  }
  connections.push(neighbors);
}

// Step 2: Rewire edges to create long-distance connections
for (let i = 0; i < agentCount; i++) {
  for (let j = 0; j < connections[i].length; j++) {
    if (Math.random() < rewireProbability) {
      connections[i][j] = Math.floor(Math.random() * agentCount);
    }
  }
}

export {
  agentCount,
  income,
  happiness,
  employed,
  savings,
  wealth,
  capital,
  risk,
  spending,
  influence,
  trust,
  panic,
  connections,
};
