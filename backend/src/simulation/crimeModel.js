import { happiness, risk, panic } from "./agentState.js";
import { getPolicy } from "./policyEngine.js";

/**
 * Process crime for a single agent
 * @param {number} i - Agent index
 * @param {number} economicPressure - Unemployment pressure (0 to 1)
 * @returns {boolean} - Whether crime was committed
 */
function processCrime(i, economicPressure) {
  const policy = getPolicy();
  const stress = 1 - happiness[i];

  let crimeProbability = stress * risk[i] * (1 - policy.policeStrength);

  // Tax burden and unemployment pressure increase baseline crime risk.
  crimeProbability *= 1 + policy.taxRate;
  crimeProbability *= 1 + economicPressure;

  crimeProbability += panic[i] * 0.1;

  crimeProbability = Math.max(0, Math.min(1, crimeProbability));

  return Math.random() < crimeProbability;
}

export { processCrime };
