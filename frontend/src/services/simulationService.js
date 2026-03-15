import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export const updatePolicy = async (policyPatch) => {
  return axios.post(`${API_BASE_URL}/policy/update`, policyPatch);
};

export const updateTaxRate = async (taxRate) => {
  return updatePolicy({ taxRate });
};

export const updatePoliceStrength = async (policeStrength) => {
  return updatePolicy({ policeStrength });
};

export const toggleFakeNews = async () => {
  return axios.post(`${API_BASE_URL}/policy/fake-news/toggle`);
};

export const triggerEconomicShock = async () => {
  return axios.post(`${API_BASE_URL}/event/economic-shock`);
};

export const pauseSimulation = async () => {
  return axios.post(`${API_BASE_URL}/simulation/pause`);
};

export const resumeSimulation = async () => {
  return axios.post(`${API_BASE_URL}/simulation/resume`);
};

export const stepSimulation = async () => {
  return axios.post(`${API_BASE_URL}/simulation/step`);
};

export const resetSimulation = async () => {
  return axios.post(`${API_BASE_URL}/simulation/reset`);
};

export const updateSimulationConfig = async (maxDays) => {
  return axios.post(`${API_BASE_URL}/simulation/config`, { maxDays });
};

export const getSimulationStatus = async () => {
  return axios.get(`${API_BASE_URL}/simulation/status`);
};

export const fetchSimulationRuns = async (limit = 50) => {
  return axios.get(`${API_BASE_URL}/simulation/runs`, {
    params: { limit },
  });
};

export const fetchSimulationRunById = async (runId) => {
  return axios.get(`${API_BASE_URL}/simulation/runs/${runId}`);
};

export const fetchScenarioTemplates = async () => {
  return axios.get(`${API_BASE_URL}/simulation/scenarios`);
};

export const startSimulation = async (scenario = "baseline", seed = 42) => {
  return axios.post(`${API_BASE_URL}/simulation/start`, { scenario, seed });
};

export const compareRuns = async (runAId, runBId) => {
  return axios.get(`${API_BASE_URL}/runs/compare`, {
    params: { runA: runAId, runB: runBId, includeSeries: "true" },
  });
};

export const deleteSimulationRun = async (runId) => {
  return axios.delete(
    `${API_BASE_URL}/simulation/runs/${encodeURIComponent(runId)}`,
  );
};
