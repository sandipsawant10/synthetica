import { happiness, risk, panic } from "./agentState.js";

/**
 * Process crime for a single agent
 * @param {number} i - Agent index
 * @param {number} taxRate - Current tax rate
 * @param {number} unemployment - Current unemployment rate
 * @returns {boolean} - Whether crime was committed
 */
function processCrime(i, taxRate, unemployment) {
  const stress = 1 - happiness[i];

  const economicPressure = unemployment;

  let crimeProbability =
    stress * risk[i] * (0.5 * taxRate + 0.5 * economicPressure);

  crimeProbability += panic[i] * 0.1;

  return Math.random() < crimeProbability;
}

export { processCrime };
