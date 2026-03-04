import {
  agentCount,
  influence,
  trust,
  panic,
  connections,
} from "./agentState.js";

function processPanicSpread() {
  for (let i = 0; i < agentCount; i++) {
    const neighbors = connections[i];

    for (let n = 0; n < neighbors.length; n++) {
      const j = neighbors[n];

      const influencePower = influence[j] * trust[i] * panic[j];

      panic[i] += influencePower * 0.02;
    }

    panic[i] = Math.min(1, panic[i]);
  }
}

function processFakeNewsEvent() {
  if (Math.random() < 0.002) {
    const seed = Math.floor(Math.random() * agentCount);
    panic[seed] = 1;
    return true;
  }

  return false;
}

export { processPanicSpread, processFakeNewsEvent };
