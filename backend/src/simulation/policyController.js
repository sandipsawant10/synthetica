import { getPolicy } from "./policyEngine.js";

/**
 * Determine if stimulus should be active based on GDP
 * @param {number} gdp - Current GDP
 * @returns {boolean} - Whether stimulus should be active
 */
function shouldActivateStimulus(gdp) {
  return gdp < 18000000;
}

/**
 * Calculate unemployment benefit based on policy welfareRate
 * @param {number} baseIncome - Agent's base income
 * @returns {number} - Unemployment benefit amount
 */
function calculateUnemploymentBenefit(baseIncome) {
  const policy = getPolicy();
  return baseIncome * policy.welfareRate;
}

/**
 * Get effective hiring multiplier when stimulus is active
 * @param {boolean} stimulusActive - Whether stimulus is currently active
 * @returns {number} - Hiring multiplier
 */
function getHiringMultiplier(stimulusActive) {
  if (!stimulusActive) {
    return 1;
  }
  const policy = getPolicy();
  return policy.stimulusMultiplier;
}

export {
  shouldActivateStimulus,
  calculateUnemploymentBenefit,
  getHiringMultiplier,
};
