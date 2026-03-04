/**
 * Determine if stimulus should be active based on GDP
 * @param {number} gdp - Current GDP
 * @returns {boolean} - Whether stimulus should be active
 */
function shouldActivateStimulus(gdp) {
  return gdp < 18000000;
}

export { shouldActivateStimulus };
