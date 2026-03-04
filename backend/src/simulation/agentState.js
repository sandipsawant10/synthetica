const agentCount = 1000;

const income = new Float64Array(agentCount);
const happiness = new Float32Array(agentCount);
const employed = new Uint8Array(agentCount);
const savings = new Float64Array(agentCount);
const wealth = new Float64Array(agentCount);
const capital = new Float64Array(agentCount);
const risk = new Float32Array(agentCount);
const spending = new Float32Array(agentCount);
const influence = new Float32Array(agentCount);
const trust = new Float32Array(agentCount);
const panic = new Float32Array(agentCount);
const connections = [];

export {
  agentCount,
  income,
  happiness,
  employed,
  savings,
  wealth,
  capital,
  risk,
  spending,
  influence,
  trust,
  panic,
  connections,
};
