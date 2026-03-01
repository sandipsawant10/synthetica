import { generateAgents, getAgents } from "./agentManager.js";

let city = {
  day: 0,
  taxRate: 0.1,
  agents: [],
  gdp: 0,
  crimeCount: 0,
  unemployment: 0,
  avyHappiness: 0,
};

function initializeCity() {
  city.agents = generateAgents(1000);
}

function runSimulationTrick() {
  city.day++;
  city.gdp = 0;
  city.crimeCount = 0;

  let happinessSum = 0;
  let unemployedCount = 0;

  for (let index = 0; index < city.agents.length; index++) {
    const agent = city.agents[index];

    let baseIncome = agent.income;

    if (!agent.employed) {
      baseIncome = 0;
    }

    const effectiveIncome = baseIncome * (1 - city.taxRate);
    const spendingAmount = effectiveIncome * agent.spending;

    city.gdp += spendingAmount;

    if (!agent.employed) {
      agent.happiness -= 0.03;
    } else {
      agent.happiness += 0.01;
    }

    agent.happiness -= city.taxRate * 0.03;

    agent.happiness = Math.max(0, Math.min(1, agent.happiness));

    if (!agent.employed) {
      unemployedCount++;
    }

    // job loss
    if (agent.employed && Math.random() < 0.008) {
      agent.employed = false;
    }

    // rehire
    if (!agent.employed && Math.random() < 0.015) {
      agent.employed = true;
    }

    const stress = 1 - agent.happiness;

    const economicPressure = city.unemployment;

    const crimeProbability =
      stress * agent.risk * (0.5 * city.taxRate + 0.5 * economicPressure);

    if (Math.random() < crimeProbability) {
      city.crimeCount++;
    }

    happinessSum += agent.happiness;
  }

  city.unemployment = unemployedCount / city.agents.length;
  city.avyHappiness = happinessSum / city.agents.length;

  console.log(
    `Day ${city.day} | GDP: ${city.gdp.toFixed(0)}
    | Crime: ${city.crimeCount} | Happiness: ${city.avyHappiness.toFixed(2)} | Unemployment: ${(city.unemployment * 100).toFixed(2)}%`,
  );
}

function startSimulation() {
  initializeCity();
  setInterval(runSimulationTrick, 1000);
}

export { startSimulation, city };
