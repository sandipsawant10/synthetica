import {
  agentCount,
  income,
  happiness,
  employed,
  savings,
  wealth,
  capital,
  spending,
  panic,
} from "./agentState.js";
import { getPolicy } from "./policyEngine.js";
import {
  calculateUnemploymentBenefit,
  getHiringMultiplier,
} from "./policyController.js";

/**
 * Process economic cycle for a single agent
 * @param {number} i - Agent index
 * @param {boolean} stimulusActive - Whether stimulus is active
 * @param {number} currentGdp - Current GDP for employment calculations
 * @returns {number} - Spending amount that contributes to GDP
 */
function processAgentEconomy(i, stimulusActive, currentGdp) {
  let baseIncome = income[i];
  const policy = getPolicy();

  if (!employed[i]) {
    baseIncome = calculateUnemploymentBenefit(income[i]);
  }

  spending[i] *= 1 - panic[i] * 0.3;

  let spendingRate = spending[i];

  //Rich save more
  if (income[i] > 80000) {
    spendingRate = 0.4;
  }

  // Poor save less
  if (income[i] < 40000) {
    spendingRate = 0.8;
  }

  const effectiveIncome = baseIncome * (1 - policy.taxRate);
  const spendingAmount = effectiveIncome * spendingRate;
  const savedAmount = effectiveIncome - spendingAmount;

  if (wealth[i] > 50000) {
    capital[i] += savedAmount * 0.7;
  } else {
    capital[i] += savedAmount * 0.2;
  }

  savings[i] += savedAmount;
  wealth[i] = savings[i];

  // Investment returns on accumulated wealth
  let investmentReturnRate = 0.0015; // 0.2% per day

  wealth[i] += wealth[i] * investmentReturnRate;

  // Random financial shock for low income agents
  if (income[i] < 40000 && Math.random() < 0.02) {
    const shock = wealth[i] * 0.05; // 5% loss
    wealth[i] -= shock;
  }

  // Capital returns
  const capitalReturnRate = 0.002;
  const capitalReturn = capital[i] * capitalReturnRate;
  wealth[i] += capitalReturn;

  if (wealth[i] < 20000 && Math.random() < 0.005) {
    wealth[i] *= 0.92;
  }

  // Employment changes
  processEmploymentChanges(i, stimulusActive, currentGdp);

  // Income growth/stagnation
  if (employed[i] && wealth[i] > 200000) {
    income[i] *= 1.001; // 0.1% daily income growth
  }

  if (employed[i] && wealth[i] < 20000) {
    income[i] *= 0.999; // stagnation
  }

  return spendingAmount;
}

/**
 * Process employment changes (job loss and hiring)
 * @param {number} i - Agent index
 * @param {boolean} stimulusActive - Whether stimulus is active
 * @param {number} currentGdp - Current GDP
 */
function processEmploymentChanges(i, stimulusActive, currentGdp) {
  // job loss
  if (employed[i] && Math.random() < 0.003) {
    employed[i] = 0;
    return;
  }

  const hiringMultiplier = getHiringMultiplier(stimulusActive);

  if (!employed[i] && Math.random() < 0.005 * hiringMultiplier) {
    employed[i] = 1;
    return;
  }

  // rehiring based on economic conditions
  const economicStrength = currentGdp / 25000000; // normalize approx

  if (!employed[i] && Math.random() < 0.01 * economicStrength) {
    employed[i] = 1;
  }
}

function triggerEconomicShock() {
  const affectedAgents = Math.floor(agentCount * 0.15);

  for (let i = 0; i < affectedAgents; i++) {
    const index = Math.floor(Math.random() * agentCount);

    employed[index] = 0;
    happiness[index] *= 0.8;
    panic[index] = Math.min(1, panic[index] + 0.3);
  }

  console.log("Economic shock triggered");
}

export { processAgentEconomy, triggerEconomicShock };
