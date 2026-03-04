import { generateAgents, getAgentCount } from "./agentManager.js";
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
  panic,
} from "./agentState.js";
import { processAgentEconomy } from "./economyModel.js";
import { processCrime } from "./crimeModel.js";
import {
  processPanicSpread,
  processFakeNewsEvent,
} from "./misinformationModel.js";
import { shouldActivateStimulus } from "./policyController.js";

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

let city = {
  day: 0,
  taxRate: 0.1,
  gdp: 0,
  crimeCount: 0,
  unemployment: 0,
  avyHappiness: 0,
  totalWealth: 0,
  topTenWealthShare: 0,
  bottomFiftyWealthShare: 0,
  stimulusActive: false,
  fakeNewsEvent: false,
};

function initializeCity() {
  generateAgents(1000);
}

function runSimulationTrick() {
  city.day++;
  city.gdp = 0;
  city.crimeCount = 0;

  city.fakeNewsEvent = processFakeNewsEvent();
  processPanicSpread();

  let happinessSum = 0;
  let unemployedCount = 0;

  for (let i = 0; i < agentCount; i++) {
    // Process economy for this agent
    const spendingAmount = processAgentEconomy(
      i,
      city.taxRate,
      city.stimulusActive,
      city.gdp,
    );

    city.gdp += spendingAmount;

    // Update happiness
    if (!employed[i]) {
      happiness[i] -= 0.03;
    } else {
      happiness[i] += 0.01;
    }

    happiness[i] -= city.taxRate * 0.03;
    happiness[i] -= panic[i] * 0.02;

    happiness[i] = Math.max(0, Math.min(1, happiness[i]));

    if (!employed[i]) {
      unemployedCount++;
    }

    // Process crime
    if (processCrime(i, city.taxRate, city.unemployment)) {
      city.crimeCount++;
    }

    happinessSum += happiness[i];
  }

  city.unemployment = unemployedCount / agentCount;
  city.avyHappiness = happinessSum / agentCount;

  // Update stimulus status
  city.stimulusActive = shouldActivateStimulus(city.gdp);

  console.log(
    `Day ${city.day} | GDP: ${city.gdp.toFixed(0)}
    | Crime: ${city.crimeCount} | Happiness: ${city.avyHappiness.toFixed(2)} | Unemployment: ${(city.unemployment * 100).toFixed(2)}% | Tax: ${(city.taxRate * 100).toFixed(2)}% | Total Wealth: ${city.totalWealth.toFixed(0)} | Top 10% Wealth Share: ${(city.topTenWealthShare * 100).toFixed(2)}% | Bottom 50% Wealth Share: ${(city.bottomFiftyWealthShare * 100).toFixed(2)}%`,
  );

  // Create array of indices sorted by wealth
  const indices = new Uint32Array(agentCount);
  for (let i = 0; i < agentCount; i++) {
    indices[i] = i;
  }

  // Sort indices by wealth (descending)
  const sortedIndices = Array.from(indices).sort(
    (a, b) => wealth[b] - wealth[a],
  );

  const topTenWealthCount = Math.floor(agentCount * 0.1);
  const bottomFiftyPercentCount = Math.floor(agentCount * 0.5);

  let totalWealth = 0;
  let topWealth = 0;
  let bottomWealth = 0;

  for (let i = 0; i < agentCount; i++) {
    totalWealth += wealth[i];
  }

  for (let i = 0; i < topTenWealthCount; i++) {
    topWealth += wealth[sortedIndices[i]];
  }

  for (let i = agentCount - bottomFiftyPercentCount; i < agentCount; i++) {
    bottomWealth += wealth[sortedIndices[i]];
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
      fakeNewsEvent: city.fakeNewsEvent,
    });
  }
}

function startSimulation() {
  initializeCity();
  setInterval(runSimulationTrick, 1000);
}

export { startSimulation, city, setIO };
