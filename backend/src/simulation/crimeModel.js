import { happiness, risk, panic } from "./agentState.js";

/**
 * Process crime for a single agent
 * @param {number} i - Agent index
 * @param {number} taxRate - Current tax rate (0 to 0.5)
 * @param {number} economicPressure - Unemployment pressure (0 to 1)
 * @param {number} policeStrength - Police funding/presence level (0 to 0.5)
 * @returns {boolean} - Whether crime was committed
 */
function processCrime(i, taxRate, economicPressure, policeStrength) {
  const stress = 1 - happiness[i];

  let crimeProbability = stress * risk[i] * (1 - policeStrength);

  // Tax burden and unemployment pressure increase baseline crime risk.
  crimeProbability *= 1 + taxRate;
  crimeProbability *= 1 + economicPressure;

  crimeProbability += panic[i] * 0.1;

  crimeProbability = Math.max(0, Math.min(1, crimeProbability));

  return Math.random() < crimeProbability;
}

export { processCrime };
