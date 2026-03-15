/**
 * Simulation Worker
 * Runs the core simulation loop in a separate thread, processing agents,
 * economy, crime, panic, and policy effects every tick.
 *
 * Messages in from API server, broadcasts state updates back.
 */

import { parentPort } from "worker_threads";
import { generateAgents, getAgentCount } from "./agentManager.js";
import { agentCount, simulationState } from "./agentState.js";
import {
  processAgentEconomy,
  triggerEconomicShock as triggerEconomicShockModel,
} from "./economyModel.js";
import { processCrime } from "./crimeModel.js";
import {
  processPanicSpread,
  processFakeNewsEvent,
  triggerFakeNewsEvent,
} from "./misinformationModel.js";
import { shouldActivateStimulus } from "./policyController.js";
import { clearHistory, recordSnapshot, getHistory } from "./historyManger.js";
import { updatePolicy } from "./policyEngine.js";
import { DEFAULT_MAX_DAYS, parseMaxDays } from "../config/simulationConfig.js";
import { COMMAND_TYPES, EVENT_TYPES, createEvent } from "./messageProtocol.js";
import { getSeed, setSeed } from "./rng.js";
import calculateSummary from "../analytics/summaryCalculator.js";

// Simulation state management
let simulationRunning = false;
let forceFakeNewsNextTick = false;
let autoFakeNewsEnabled = false;
let tickCount = 0;
let intervalHandle = null;
let maxDays = DEFAULT_MAX_DAYS;
let runTotals = {
  maxPanicLevel: 0,
};
let simulationSummary = null;
let runMetadata = null;
const TICK_INTERVAL = 1000; // 1 second

function getProgressPayload() {
  const day = simulationState.metrics.day;
  const safeMaxDays = maxDays > 0 ? maxDays : 1;

  return {
    day,
    maxDays,
    progress: Math.min(day / safeMaxDays, 1),
  };
}

function resetRunSummary() {
  runTotals = {
    maxPanicLevel: 0,
  };
  simulationSummary = null;
}

function finalizeSimulation() {
  simulationRunning = false;
  const historySnapshot = getHistory();
  const persistedSummary = calculateSummary(historySnapshot, {
    maxPanicLevel: runTotals.maxPanicLevel,
  });

  // Preserve existing websocket payload shape expected by current dashboard.
  simulationSummary = {
    daysSimulated: persistedSummary.daysSimulated,
    averageGdp: persistedSummary.avgGDP,
    averageCrime: persistedSummary.avgCrime,
    averageUnemployment: persistedSummary.avgUnemployment,
    averageHappiness: persistedSummary.avgHappiness,
    finalInequality: persistedSummary.finalInequality,
    maxPanicLevel: persistedSummary.maxPanicLevel,
  };

  const completedRunPayload = {
    runId: runMetadata?.runId,
    startTime: runMetadata?.startTime,
    parameters: runMetadata?.parameters,
    summary: persistedSummary,
    history: historySnapshot,
  };

  console.log(
    `[WORKER] Simulation finished at day ${simulationState.metrics.day}`,
  );

  parentPort.postMessage(
    createEvent(EVENT_TYPES.STATE_UPDATE, {
      day: simulationState.metrics.day,
      running: false,
      maxDays,
      limitReached: true,
      summary: simulationSummary,
    }),
  );

  parentPort.postMessage(
    createEvent(EVENT_TYPES.SIMULATION_COMPLETED, {
      summary: simulationSummary,
      day: simulationState.metrics.day,
      maxDays,
      run: completedRunPayload,
    }),
  );

  parentPort.postMessage(
    createEvent(EVENT_TYPES.PROGRESS, getProgressPayload()),
  );
}

/**
 * Core simulation tick - processes all agents and systems for one time unit
 */
function runSimulationTick() {
  if (!simulationRunning) return;

  const state = simulationState;
  const { agents, metrics, policy } = state;

  if (metrics.day >= maxDays) {
    finalizeSimulation();
    return;
  }

  metrics.day++;
  metrics.gdp = 0;
  metrics.crime = 0;

  let fakeNewsTriggeredThisTick = false;

  // Handle fake news events
  if (forceFakeNewsNextTick || autoFakeNewsEnabled) {
    triggerFakeNewsEvent(state);
    fakeNewsTriggeredThisTick = true;
    forceFakeNewsNextTick = false;
  } else {
    fakeNewsTriggeredThisTick = processFakeNewsEvent(state);
  }

  // Process panic propagation through social network
  processPanicSpread(state);

  let happinessSum = 0;
  let unemployedCount = 0;

  // Process each agent
  for (let i = 0; i < agentCount; i++) {
    // Process economy for this agent
    const spendingAmount = processAgentEconomy(i, state);
    metrics.gdp += spendingAmount;

    // Update happiness based on employment and policy
    if (!agents.employed[i]) {
      agents.happiness[i] -= 0.03;
    } else {
      agents.happiness[i] += 0.01;
    }

    agents.happiness[i] -= policy.taxRate * 0.03;
    agents.happiness[i] -= agents.panic[i] * 0.02;

    agents.happiness[i] = Math.max(0, Math.min(1, agents.happiness[i]));

    if (!agents.employed[i]) {
      unemployedCount++;
    }

    // Process crime
    if (processCrime(i, state)) {
      metrics.crime++;
    }

    happinessSum += agents.happiness[i];
  }

  // Update aggregate metrics
  metrics.unemployment = unemployedCount / agentCount;
  metrics.avyHappiness = happinessSum / agentCount;
  metrics.fakeNewsEvent = fakeNewsTriggeredThisTick || autoFakeNewsEnabled;
  metrics.stimulusActive = shouldActivateStimulus(metrics.gdp);

  // Calculate wealth inequality
  const indices = new Uint32Array(agentCount);
  for (let i = 0; i < agentCount; i++) {
    indices[i] = i;
  }

  const sortedIndices = Array.from(indices).sort(
    (a, b) => agents.wealth[b] - agents.wealth[a],
  );

  const topTenWealthCount = Math.floor(agentCount * 0.1);
  const bottomFiftyPercentCount = Math.floor(agentCount * 0.5);

  let totalWealth = 0;
  let topWealth = 0;
  let bottomWealth = 0;

  for (let i = 0; i < agentCount; i++) {
    totalWealth += agents.wealth[i];
  }

  for (let i = 0; i < topTenWealthCount; i++) {
    topWealth += agents.wealth[sortedIndices[i]];
  }

  for (let i = agentCount - bottomFiftyPercentCount; i < agentCount; i++) {
    bottomWealth += agents.wealth[sortedIndices[i]];
  }

  metrics.totalWealth = totalWealth;
  metrics.topTenWealthShare = totalWealth === 0 ? 0 : topWealth / totalWealth;
  metrics.bottomFiftyWealthShare =
    totalWealth === 0 ? 0 : bottomWealth / totalWealth;

  const avgPanic =
    agents.panic.reduce((sum, value) => sum + value, 0) / agentCount;
  const maxPanic = Math.max(...agents.panic);

  runTotals.maxPanicLevel = Math.max(runTotals.maxPanicLevel, maxPanic);

  // Log to worker console
  console.log(
    `[WORKER] Day: ${metrics.day} | GDP: ${metrics.gdp.toFixed(0)} | Crime: ${metrics.crime} | Happiness: ${metrics.avyHappiness.toFixed(2)} | Unemployment: ${(metrics.unemployment * 100).toFixed(2)}% | Panic: ${avgPanic.toFixed(3)}`,
  );

  tickCount++;

  // Record historical data
  recordSnapshot(state);

  // Emit fast update (real-time metrics every tick)
  parentPort.postMessage(
    createEvent(EVENT_TYPES.STATE_UPDATE, {
      day: metrics.day,
      gdp: metrics.gdp,
      crimeRate: metrics.crime,
      avgHappiness: metrics.avyHappiness,
      running: simulationRunning,
      maxDays,
      limitReached: false,
      summary: simulationSummary,
      unemployment: metrics.unemployment,
      policeStrength: policy.policeStrength,
      fakeNewsEvent: metrics.fakeNewsEvent,
      autoFakeNewsEnabled,
      panicLevels: Array.from(agents.panic),
    }),
  );

  parentPort.postMessage(
    createEvent(EVENT_TYPES.PROGRESS, getProgressPayload()),
  );

  // Emit slow update (heavy analytics every 5 ticks)
  if (tickCount % 5 === 0) {
    parentPort.postMessage(
      createEvent(EVENT_TYPES.METRICS_UPDATE, {
        taxRate: policy.taxRate,
        policeStrength: policy.policeStrength,
        topTenWealthShare: metrics.topTenWealthShare,
        bottomFiftyWealthShare: metrics.bottomFiftyWealthShare,
        totalWealth: metrics.totalWealth,
      }),
    );

    parentPort.postMessage(
      createEvent(EVENT_TYPES.HISTORY_UPDATE, {
        history: getHistory(),
      }),
    );
  }
}

/**
 * Initialize the city and agents
 */
function initializeCity() {
  generateAgents();
}

/**
 * Start the simulation
 */
function startSimulation(options = {}) {
  console.log("[WORKER] Starting simulation");
  const activeSeed = setSeed(options.seed);
  resetRunSummary();
  clearHistory();
  initializeCity();

  runMetadata = {
    runId: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    startTime: new Date().toISOString(),
    parameters: {
      taxRate: simulationState.policy.taxRate,
      policeStrength: simulationState.policy.policeStrength,
      welfareRate: simulationState.policy.welfareRate,
      maxDays,
      seed: activeSeed,
    },
  };

  simulationRunning = true;
  if (!intervalHandle) {
    intervalHandle = setInterval(runSimulationTick, TICK_INTERVAL);
  }
  parentPort.postMessage(
    createEvent(EVENT_TYPES.SIMULATION_STARTED, {
      seed: activeSeed,
      runId: runMetadata.runId,
    }),
  );

  parentPort.postMessage(
    createEvent(EVENT_TYPES.PROGRESS, getProgressPayload()),
  );
}

/**
 * Pause the simulation
 */
function pauseSimulation() {
  console.log("[WORKER] Pausing simulation");
  simulationRunning = false;
  parentPort.postMessage(createEvent(EVENT_TYPES.SIMULATION_PAUSED));
}

/**
 * Resume the simulation
 */
function resumeSimulation() {
  console.log("[WORKER] Resuming simulation");
  simulationRunning = true;
  parentPort.postMessage(createEvent(EVENT_TYPES.SIMULATION_RESUMED));
}

/**
 * Step the simulation one tick
 */
function stepSimulation() {
  runSimulationTick();
}

/**
 * Reset the simulation
 */
function resetSimulation() {
  console.log("[WORKER] Resetting simulation");

  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  // Reset metrics
  const { metrics } = simulationState;
  metrics.day = 0;
  metrics.gdp = 0;
  metrics.crime = 0;
  metrics.unemployment = 0;
  metrics.avyHappiness = 0;
  metrics.totalWealth = 0;
  metrics.topTenWealthShare = 0;
  metrics.bottomFiftyWealthShare = 0;
  metrics.stimulusActive = false;
  metrics.fakeNewsEvent = false;

  forceFakeNewsNextTick = false;
  autoFakeNewsEnabled = false;
  tickCount = 0;
  simulationRunning = true;
  resetRunSummary();
  clearHistory();

  // Reinitialize agents
  initializeCity();

  // Restart interval
  intervalHandle = setInterval(runSimulationTick, TICK_INTERVAL);
  parentPort.postMessage(createEvent(EVENT_TYPES.SIMULATION_RESET));
  parentPort.postMessage(
    createEvent(EVENT_TYPES.PROGRESS, getProgressPayload()),
  );
}

/**
 * Get current simulation status
 */
function getStatus() {
  return {
    running: simulationRunning,
    day: simulationState.metrics.day,
    tickCount,
    autoFakeNewsEnabled,
    maxDays,
    limitReached: simulationState.metrics.day >= maxDays,
    summary: simulationSummary,
    seed: runMetadata?.parameters?.seed ?? getSeed(),
    progress: getProgressPayload().progress,
  };
}

function setSimulationConfig(config = {}) {
  const nextMaxDays = parseMaxDays(config.maxDays);

  if (nextMaxDays === null) {
    throw new Error("maxDays must be a positive integer.");
  }

  maxDays = nextMaxDays;

  if (simulationState.metrics.day >= maxDays) {
    finalizeSimulation();
    return;
  }

  parentPort.postMessage(
    createEvent(EVENT_TYPES.STATE_UPDATE, {
      day: simulationState.metrics.day,
      running: simulationRunning,
      maxDays,
      limitReached: false,
      summary: simulationSummary,
    }),
  );

  parentPort.postMessage(
    createEvent(EVENT_TYPES.PROGRESS, getProgressPayload()),
  );
}

/**
 * Handle incoming commands from API server
 */
parentPort.on("message", (command) => {
  console.log(
    `[WORKER] Received command: ${command.type} at ${new Date().toISOString()}`,
  );

  try {
    switch (command.type) {
      case COMMAND_TYPES.START_SIMULATION:
        startSimulation(command.payload);
        break;

      case COMMAND_TYPES.PAUSE_SIMULATION:
        pauseSimulation();
        break;

      case COMMAND_TYPES.RESUME_SIMULATION:
        resumeSimulation();
        break;

      case COMMAND_TYPES.STEP_SIMULATION:
        stepSimulation();
        break;

      case COMMAND_TYPES.RESET_SIMULATION:
        resetSimulation();
        break;

      case COMMAND_TYPES.SET_SIMULATION_CONFIG:
        setSimulationConfig(command.payload);
        console.log(`[WORKER] Simulation config updated: maxDays=${maxDays}`);
        break;

      case COMMAND_TYPES.UPDATE_POLICY:
        updatePolicy(command.payload);
        console.log(`[WORKER] Policy updated:`, command.payload);
        break;

      case COMMAND_TYPES.TRIGGER_FAKE_NEWS:
        forceFakeNewsNextTick = true;
        console.log("[WORKER] Fake news will trigger next tick");
        break;

      case COMMAND_TYPES.TOGGLE_AUTO_FAKE_NEWS:
        autoFakeNewsEnabled = !autoFakeNewsEnabled;
        console.log(`[WORKER] Auto fake news toggled: ${autoFakeNewsEnabled}`);
        parentPort.postMessage(
          createEvent(EVENT_TYPES.STATE_UPDATE, {
            autoFakeNewsEnabled,
          }),
        );
        break;

      case COMMAND_TYPES.TRIGGER_ECONOMIC_SHOCK:
        triggerEconomicShockModel(simulationState);
        console.log("[WORKER] Economic shock triggered");
        break;

      case COMMAND_TYPES.GET_STATUS:
        parentPort.postMessage(
          createEvent(EVENT_TYPES.STATUS_RESPONSE, getStatus()),
        );
        break;

      default:
        console.warn(`[WORKER] Unknown command type: ${command.type}`);
    }
  } catch (error) {
    console.error(`[WORKER] Error processing command ${command.type}:`, error);
    parentPort.postMessage(
      createEvent(EVENT_TYPES.STATUS_RESPONSE, {
        error: error.message,
        command: command.type,
      }),
    );
  }
});

// Signal that worker is ready
parentPort.postMessage(createEvent(EVENT_TYPES.INITIALIZATION_COMPLETE));
console.log("[WORKER] Simulation worker initialized and ready");
