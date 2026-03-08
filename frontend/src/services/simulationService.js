import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

export const updateTaxRate = async (taxRate) => {
  return axios.post(`${API_BASE_URL}/policy/tax`, {
    taxRate,
  });
};

export const updatePoliceStrength = async (policeStrength) => {
  return axios.post(`${API_BASE_URL}/policy/police-strength`, {
    policeStrength,
  });
};

export const toggleFakeNews = async () => {
  return axios.post(`${API_BASE_URL}/policy/fake-news/toggle`);
};

export const triggerEconomicShock = async () => {
  return axios.post(`${API_BASE_URL}/event/economic-shock`);
};
