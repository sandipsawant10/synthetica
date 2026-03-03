import { generateAgents, getAgents } from "./agentManager.js";

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

let city = {
  day: 0,
  taxRate: 0.1,
  agents: [],
  gdp: 0,
  crimeCount: 0,
  unemployment: 0,
  avyHappiness: 0,
  totalWealth: 0,
  topTenWealthShare: 0,
  bottomFiftyWealthShare: 0,
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
      baseIncome = agent.income * 0.25; // Unemployed get 25% of their income as benefits
    }

    let savingsRate = agent.spending;

    //Rich save more
    if (agent.income > 80000) {
      savingsRate = 0.4;
    }

    // Poor save less
    if (agent.income < 40000) {
      savingsRate = 0.8;
    }

    const effectiveIncome = baseIncome * (1 - city.taxRate);
    const spendingAmount = effectiveIncome * savingsRate;
    const savedAmount = effectiveIncome - spendingAmount;

    agent.savings += savedAmount;
    agent.totalWealth = agent.savings;

    // Investment returns on accumulated wealth
    let investmentReturnRate = 0.0015; // 0.2% per day

    // if (agent.totalWealth > 200000) {
    //   investmentReturnRate = 0.004; // 0.4% for wealthier agents
    // }
    agent.totalWealth += agent.totalWealth * investmentReturnRate;

    // Random financial shock for low income agents
    if (agent.income < 40000 && Math.random() < 0.02) {
      const shock = agent.totalWealth * 0.05; // 5% loss
      agent.totalWealth -= shock;
    }

    city.gdp += spendingAmount;

    if (city.gdp < 18000000){
      city.stimulusActive = true;
    } else {
      city.stimulusActive = false;
    }

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

    let hiringMultiplier = 1;

    if(city.stimulusActive) {
      hiringMultiplier = 2;
    }

    if(!agent.employed && Math.random() < 0.01 * hiringMultiplier) {
      agent.employed = true;
    }

    // rehiring based on economic conditions
    const economicStrength = city.gdp / 25000000; // normalize approx

    
    if (!agent.employed && Math.random() < 0.01 * economicStrength) {
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
    | Crime: ${city.crimeCount} | Happiness: ${city.avyHappiness.toFixed(2)} | Unemployment: ${(city.unemployment * 100).toFixed(2)}% | Tax: ${(city.taxRate * 100).toFixed(2)}% | Total Wealth: ${city.totalWealth.toFixed(0)} | Top 10% Wealth Share: ${(city.topTenWealthShare * 100).toFixed(2)}% | Bottom 50% Wealth Share: ${(city.bottomFiftyWealthShare * 100).toFixed(2)}%`,
  );

  const sortedAgents = [...city.agents].sort(
    (a, b) => b.totalWealth - a.totalWealth,
  );

  const topTenWealthCount = Math.floor(sortedAgents.length * 0.1);
  const bottomFiftyPercentCount = Math.floor(sortedAgents.length * 0.5);

  let totalWealth = 0;
  let topWealth = 0;
  let bottomWealth = 0;

  for (let i = 0; i < sortedAgents.length; i++) {
    totalWealth += sortedAgents[i].totalWealth;
  }

  for (let i = 0; i < topTenWealthCount; i++) {
    topWealth += sortedAgents[i].totalWealth;
  }

  for (
    let i = sortedAgents.length - bottomFiftyPercentCount;
    i < sortedAgents.length;
    i++
  ) {
    bottomWealth += sortedAgents[i].totalWealth;
  }

  city.totalWealth = totalWealth;
  city.topTenWealthShare = totalWealth === 0 ? 0 : topWealth / totalWealth;
  city.bottomFiftyWealthShare =
    totalWealth === 0 ? 0 : bottomWealth / totalWealth;

  // Emit data to connected clients
  if (ioInstance) {
    ioInstance.emit("worldUpdate", {
      day: city.day,
      taxRate: city.taxRate,
      gdp: city.gdp,
      crimeRate: city.crimeCount,
      avgHappiness: city.avyHappiness,
      unemployment: city.unemployment,
      topTenWealthShare: city.topTenWealthShare,
      bottomFiftyWealthShare: city.bottomFiftyWealthShare,
      totalWealth: city.totalWealth,
    });
  }
}

function startSimulation() {
  initializeCity();
  setInterval(runSimulationTrick, 1000);
}

export { startSimulation, city, setIO };
