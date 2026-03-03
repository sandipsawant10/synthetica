let agents = [];

function generateAgents(count) {
  agents = [];

  for (let index = 0; index < count; index++) {
    agents.push({
      id: index,
      income: Math.floor(Math.random() * 80000) + 20000, // Random income between 20k and 100k
      happiness: Math.random() * 0.4 + 0.4, // Random happiness between 0.4 and 0.8
      employed: Math.random() > 0.2, // 80% chance of being employed
      risk: Math.random(),
      spending: Math.random() * 0.5 + 0.3, // Random spending between 0.3 and 0.8
      savings: 0,
      totalWealth: 0,
    });
  }
  return agents;
}

function getAgents() {
  return agents;
}

export { generateAgents, getAgents };
