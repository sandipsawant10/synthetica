import {
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
} from "./agentState.js";

function generateAgents(count) {
  connections.length = 0;

  for (let i = 0; i < agentCount; i++) {
    const neighbors = [];

    for (let j = 0; j < 10; j++) {
      neighbors.push(Math.floor(Math.random() * agentCount));
    }

    connections.push(neighbors);

    income[i] = Math.floor(Math.random() * 80000) + 20000; // Random income between 20k and 100k
    happiness[i] = Math.random() * 0.4 + 0.4; // Random happiness between 0.4 and 0.8
    employed[i] = Math.random() > 0.2 ? 1 : 0; // 80% chance of being employed
    risk[i] = Math.random();
    spending[i] = Math.random() * 0.5 + 0.3; // Random spending between 0.3 and 0.8
    influence[i] = Math.random();
    trust[i] = Math.random();
    panic[i] = 0;
    savings[i] = 0;
    wealth[i] = 0;
    capital[i] = 0;

    capital[i] = savings[i] * 0.3;
  }
  return agentCount;
}

function getAgentCount() {
  return agentCount;
}

export { generateAgents, getAgentCount };
