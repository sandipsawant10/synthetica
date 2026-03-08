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

export const getSimulationStatus = async () => {
  return axios.get(`${API_BASE_URL}/simulation/status`);
};
