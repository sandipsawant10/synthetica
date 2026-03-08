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
import { processAgentEconomy, triggerEconomicShock } from "./economyModel.js";
import { processCrime } from "./crimeModel.js";
import {
  processPanicSpread,
  processFakeNewsEvent,
  triggerFakeNewsEvent,
} from "./misinformationModel.js";
import { shouldActivateStimulus } from "./policyController.js";
import { recordSnapshot, getHistory } from "./historyManger.js";
import { getPolicy } from "./policyEngine.js";

let ioInstance = null;
let forceFakeNewsNextTick = false;
let autoFakeNewsEnabled = false;
let tickCount = 0;
let simulationRunning = true;
let intervalHandle = null;

function setIO(io) {
  ioInstance = io;
}

let city = {
  day: 0,
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
  if (!simulationRunning) return;

  const policy = getPolicy();

  city.day++;
  city.gdp = 0;
  city.crimeCount = 0;

  let fakeNewsTriggeredThisTick = false;

  if (forceFakeNewsNextTick || autoFakeNewsEnabled) {
    triggerFakeNewsEvent();
    fakeNewsTriggeredThisTick = true;
    forceFakeNewsNextTick = false;
  } else {
    fakeNewsTriggeredThisTick = processFakeNewsEvent();
  }
  processPanicSpread();

  let happinessSum = 0;
  let unemployedCount = 0;

  for (let i = 0; i < agentCount; i++) {
    // Process economy for this agent
    const spendingAmount = processAgentEconomy(
      i,
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

    happiness[i] -= policy.taxRate * 0.03;
    happiness[i] -= panic[i] * 0.02;

    happiness[i] = Math.max(0, Math.min(1, happiness[i]));

    if (!employed[i]) {
      unemployedCount++;
    }

    // Process crime
    if (processCrime(i, city.unemployment)) {
      city.crimeCount++;
    }

    happinessSum += happiness[i];
  }

  city.unemployment = unemployedCount / agentCount;
  city.avyHappiness = happinessSum / agentCount;
  city.fakeNewsEvent = fakeNewsTriggeredThisTick || autoFakeNewsEnabled;

  // Update stimulus status
  city.stimulusActive = shouldActivateStimulus(city.gdp);

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

  const avgPanic = panic.reduce((sum, value) => sum + value, 0) / agentCount;
  const maxPanic = Math.max(...panic);

  console.log(
    `Day: ${city.day} | GDP: ${city.gdp.toFixed(0)} | Crime Rate: ${city.crimeCount} | Happiness: ${city.avyHappiness.toFixed(2)} | Unemployment: ${(city.unemployment * 100).toFixed(2)}% | Tax Rate: ${(policy.taxRate * 100).toFixed(2)}% | Police Funding: ${(policy.policeStrength * 100).toFixed(2)}% | Top 10% Wealth Share: ${(city.topTenWealthShare * 100).toFixed(2)}% | Bottom 50% Wealth Share: ${(city.bottomFiftyWealthShare * 100).toFixed(2)}% | Total Wealth: ${city.totalWealth.toFixed(0)} | Fake News Event: ${city.fakeNewsEvent ? "Yes" : "No"} | Average Panic: ${avgPanic.toFixed(3)} | Max Panic: ${maxPanic.toFixed(3)}`,
  );

  tickCount++;

  // Record historical data
  recordSnapshot(city);

  // Emit data to connected clients
  if (ioInstance) {
    // Fast stream: real-time metrics (every tick)
    ioInstance.emit("fastUpdate", {
      day: city.day,
      gdp: city.gdp,
      crimeRate: city.crimeCount,
      avgHappiness: city.avyHappiness,
      unemployment: city.unemployment,
      policeStrength: policy.policeStrength,
      fakeNewsEvent: city.fakeNewsEvent,
      autoFakeNewsEnabled,
      panicLevels: Array.from(panic),
    });

    // Slow stream: heavy analytics (every 5 ticks)
    if (tickCount % 5 === 0) {
      ioInstance.emit("slowUpdate", {
        taxRate: policy.taxRate,
        policeStrength: policy.policeStrength,
        topTenWealthShare: city.topTenWealthShare,
        bottomFiftyWealthShare: city.bottomFiftyWealthShare,
        totalWealth: city.totalWealth,
      });

      ioInstance.emit("historyUpdate", getHistory());
    }
  }
}

function startSimulation() {
  initializeCity();
  simulationRunning = true;
  if (!intervalHandle) {
    intervalHandle = setInterval(runSimulationTrick, 1000);
  }
}

function pauseSimulation() {
  simulationRunning = false;
}

function resumeSimulation() {
  simulationRunning = true;
}

function stepSimulation() {
  runSimulationTrick();
}

function resetSimulation() {
  // Clear interval and restart
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  // Reset state
  city.day = 0;
  city.gdp = 0;
  city.crimeCount = 0;
  city.unemployment = 0;
  city.avyHappiness = 0;
  city.totalWealth = 0;
  city.topTenWealthShare = 0;
  city.bottomFiftyWealthShare = 0;
  city.stimulusActive = false;
  city.fakeNewsEvent = false;

  forceFakeNewsNextTick = false;
  autoFakeNewsEnabled = false;
  tickCount = 0;
  simulationRunning = true;

  // Reinitialize agents
  initializeCity();

  // Restart interval
  intervalHandle = setInterval(runSimulationTrick, 1000);
}

function getSimulationStatus() {
  return {
    running: simulationRunning,
    day: city.day,
  };
}

function triggerFakeNewsNow() {
  forceFakeNewsNextTick = true;
}

function toggleAutoFakeNews() {
  autoFakeNewsEnabled = !autoFakeNewsEnabled;
  return autoFakeNewsEnabled;
}

function getAutoFakeNewsEnabled() {
  return autoFakeNewsEnabled;
}

export {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  getSimulationStatus,
  setIO,
  triggerFakeNewsNow,
  toggleAutoFakeNews,
  getAutoFakeNewsEnabled,
  triggerEconomicShock,
};
