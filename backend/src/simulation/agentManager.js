import { agentCount, simulationState } from "./agentState.js";

function generateAgents() {
  const { agents } = simulationState;
  agents.connections.length = 0;

  for (let i = 0; i < agentCount; i++) {
    const neighbors = [];

    for (let j = 0; j < 10; j++) {
      neighbors.push(Math.floor(Math.random() * agentCount));
    }

    agents.connections.push(neighbors);

    agents.income[i] = Math.floor(Math.random() * 80000) + 20000; // Random income between 20k and 100k
    agents.happiness[i] = Math.random() * 0.4 + 0.4; // Random happiness between 0.4 and 0.8
    agents.employed[i] = Math.random() > 0.2 ? 1 : 0; // 80% chance of being employed
    agents.risk[i] = Math.random();
    agents.spending[i] = Math.random() * 0.5 + 0.3; // Random spending between 0.3 and 0.8
    agents.influence[i] = Math.random();
    agents.trust[i] = Math.random();
    agents.panic[i] = 0;
    agents.savings[i] = 0;
    agents.wealth[i] = 0;
    agents.capital[i] = 0;

    agents.capital[i] = agents.savings[i] * 0.3;
  }
  return agentCount;
}

function getAgentCount() {
  return agentCount;
}

export { generateAgents, getAgentCount };
