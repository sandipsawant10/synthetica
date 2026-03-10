import { agentCount } from "./agentState.js";
import {
  calculateUnemploymentBenefit,
  getHiringMultiplier,
} from "./policyController.js";

/**
 * Process economic cycle for a single agent
 * @param {number} i - Agent index
 * @param {object} state - Simulation state
 * @returns {number} - Spending amount that contributes to GDP
 */
function processAgentEconomy(i, state) {
  const { agents, metrics, policy } = state;
  let baseIncome = agents.income[i];

  if (!agents.employed[i]) {
    baseIncome = calculateUnemploymentBenefit(agents.income[i], policy);
  }

  agents.spending[i] *= 1 - agents.panic[i] * 0.3;

  let spendingRate = agents.spending[i];

  // Rich save more
  if (agents.income[i] > 80000) {
    spendingRate = 0.4;
  }

  // Poor save less
  if (agents.income[i] < 40000) {
    spendingRate = 0.8;
  }

  const effectiveIncome = baseIncome * (1 - policy.taxRate);
  const spendingAmount = effectiveIncome * spendingRate;
  const savedAmount = effectiveIncome - spendingAmount;

  if (agents.wealth[i] > 50000) {
    agents.capital[i] += savedAmount * 0.7;
  } else {
    agents.capital[i] += savedAmount * 0.2;
  }

  agents.savings[i] += savedAmount;
  agents.wealth[i] = agents.savings[i];

  // Investment returns on accumulated wealth
  let investmentReturnRate = 0.0015; // 0.15% per day

  agents.wealth[i] += agents.wealth[i] * investmentReturnRate;

  // Random financial shock for low income agents
  if (agents.income[i] < 40000 && Math.random() < 0.02) {
    const shock = agents.wealth[i] * 0.05; // 5% loss
    agents.wealth[i] -= shock;
  }

  // Capital returns
  const capitalReturnRate = 0.002;
  const capitalReturn = agents.capital[i] * capitalReturnRate;
  agents.wealth[i] += capitalReturn;

  if (agents.wealth[i] < 20000 && Math.random() < 0.005) {
    agents.wealth[i] *= 0.92;
  }

  // Employment changes
  processEmploymentChanges(i, state);

  // Income growth/stagnation
  if (agents.employed[i] && agents.wealth[i] > 200000) {
    agents.income[i] *= 1.001; // 0.1% daily income growth
  }

  if (agents.employed[i] && agents.wealth[i] < 20000) {
    agents.income[i] *= 0.999; // stagnation
  }

  return spendingAmount;
}

/**
 * Process employment changes (job loss and hiring)
 * @param {number} i - Agent index
 * @param {object} state - Simulation state
 */
function processEmploymentChanges(i, state) {
  const { agents, metrics, policy } = state;

  // job loss
  if (agents.employed[i] && Math.random() < 0.003) {
    agents.employed[i] = 0;
    return;
  }

  const hiringMultiplier = getHiringMultiplier(metrics.stimulusActive, policy);

  if (!agents.employed[i] && Math.random() < 0.005 * hiringMultiplier) {
    agents.employed[i] = 1;
    return;
  }

  // rehiring based on economic conditions
  const economicStrength = metrics.gdp / 25000000; // normalize approx

  if (!agents.employed[i] && Math.random() < 0.01 * economicStrength) {
    agents.employed[i] = 1;
  }
}

function triggerEconomicShock(state) {
  const { agents } = state;
  const affectedAgents = Math.floor(agentCount * 0.15);

  for (let i = 0; i < affectedAgents; i++) {
    const index = Math.floor(Math.random() * agentCount);

    agents.employed[index] = 0;
    agents.happiness[index] *= 0.8;
    agents.panic[index] = Math.min(1, agents.panic[index] + 0.3);
  }

  console.log("Economic shock triggered");
}

export { processAgentEconomy, triggerEconomicShock };
