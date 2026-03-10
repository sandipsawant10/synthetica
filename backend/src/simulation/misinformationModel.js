import { agentCount } from "./agentState.js";

const panicNext = new Float32Array(agentCount);

function processPanicSpread(state) {
  const { panic, influence, trust, connections } = state.agents;

  for (let i = 0; i < agentCount; i++) {
    panicNext[i] = panic[i] * 0.92; // Base decay: panic drops by 8% each tick.

    let newPanic = panicNext[i]; // Start from decayed panic, then add neighbor effects.
    const neighbors = connections[i];

    for (let n = 0; n < neighbors.length; n++) {
      const j = neighbors[n];

      // Neighbor influence scaled by trust and current panic.
      const influencePower = influence[j] * trust[i] * panic[j];

      // Spread contribution from this neighbor.
      newPanic += influencePower * 0.02;
    }

    // Keep panic value in [0, 1].
    panicNext[i] = Math.min(1, newPanic);
  }

  // Commit next-step panic values.
  for (let i = 0; i < agentCount; i++) {
    panic[i] = panicNext[i];
  }
}

function processFakeNewsEvent(state) {
  // Small daily chance to spike one random agent to max panic.
  if (Math.random() < 0.002) {
    triggerFakeNewsEvent(state);
    return true;
  }

  return false;
}

function triggerFakeNewsEvent(state) {
  const seed = Math.floor(Math.random() * agentCount);
  state.agents.panic[seed] = 1;
  return seed;
}

export { processPanicSpread, processFakeNewsEvent, triggerFakeNewsEvent };
