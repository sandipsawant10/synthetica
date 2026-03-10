import { simulationState } from "./agentState.js";

function updatePolicy(newPolicy) {
  Object.assign(simulationState.policy, newPolicy);
}

function getPolicy() {
  return simulationState.policy;
}

export { getPolicy, updatePolicy };
