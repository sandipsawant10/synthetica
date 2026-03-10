import { simulationState } from "./agentState.js";

const maxHistory = 500;

function recordSnapshot(state) {
  const h = state.history;
  const m = state.metrics;

  h.days.push(m.day);
  h.gdp.push(m.gdp);
  h.crime.push(m.crime);
  h.unemployment.push(m.unemployment);
  h.happiness.push(m.avyHappiness);
  h.inequality.push(m.topTenWealthShare);

  // Trim old data if exceeds max
  if (h.days.length > maxHistory) {
    h.days.shift();
    h.gdp.shift();
    h.crime.shift();
    h.unemployment.shift();
    h.happiness.shift();
    h.inequality.shift();
  }
}

function getHistory() {
  return simulationState.history;
}

function clearHistory() {
  const h = simulationState.history;
  h.days = [];
  h.gdp = [];
  h.crime = [];
  h.unemployment = [];
  h.happiness = [];
  h.inequality = [];
}

export { recordSnapshot, getHistory, clearHistory };
