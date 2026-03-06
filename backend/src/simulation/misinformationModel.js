import {
  agentCount,
  influence,
  trust,
  panic,
  connections,
} from "./agentState.js";

const panicCurrent = panic;
const panicNext = new Float32Array(agentCount);

function processPanicSpread() {
  for (let i = 0; i < agentCount; i++) {
    let newPanic = panicCurrent[i];
    const neighbors = connections[i];

    for (let n = 0; n < neighbors.length; n++) {
      const j = neighbors[n];

      const influencePower = influence[j] * trust[i] * panicCurrent[j];

      newPanic += influencePower * 0.02;
    }

    panicNext[i] = Math.min(1, newPanic);
  }

  for (let i = 0; i < agentCount; i++) {
    panicCurrent[i] = panicNext[i];
  }
}

function processFakeNewsEvent() {
  if (Math.random() < 0.002) {
    const seed = Math.floor(Math.random() * agentCount);
    panicCurrent[seed] = 1;
    return true;
  }

  return false;
}

export { processPanicSpread, processFakeNewsEvent };
