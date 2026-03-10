/**
 * Process crime for a single agent
 * @param {number} i - Agent index
 * @param {object} state - Simulation state
 * @returns {boolean} - Whether crime was committed
 */
function processCrime(i, state) {
  const { agents, metrics, policy } = state;
  const stress = 1 - agents.happiness[i];

  let crimeProbability = stress * agents.risk[i] * (1 - policy.policeStrength);

  // Tax burden and unemployment pressure increase baseline crime risk.
  crimeProbability *= 1 + policy.taxRate;
  crimeProbability *= 1 + metrics.unemployment;

  crimeProbability += agents.panic[i] * 0.1;

  crimeProbability = Math.max(0, Math.min(1, crimeProbability));

  return Math.random() < crimeProbability;
}

export { processCrime };
