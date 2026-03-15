import axios from "axios";

const API_URL = "http://localhost:3000/history";

export const transformHistoryPayload = (historyData) => {
  if (!historyData) {
    return [];
  }

  const inferredDays = Array.isArray(historyData.gdp)
    ? historyData.gdp.map((_, index) => index + 1)
    : [];
  const days = Array.isArray(historyData.days)
    ? historyData.days
    : inferredDays;

  return days.map((day, index) => ({
    day,
    gdp: historyData.gdp[index],
    crime: historyData.crime[index],
    unemployment: historyData.unemployment[index],
    happiness: historyData.happiness[index],
    inequality: historyData.inequality[index],
  }));
};

/**
 * Fetch and transform history data from backend
 * @returns {Promise<Array>} Array of objects with all metrics
 */
export const fetchHistory = async () => {
  try {
    const response = await axios.get(API_URL);
    return transformHistoryPayload(response.data.data);
  } catch (error) {
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
};

/**
 * Fetch and return only GDP data
 * @returns {Promise<Array>} Array of objects with day and gdp
 */
export const fetchGDPData = async () => {
  const data = await fetchHistory();
  return data.map((item) => ({
    day: item.day,
    gdp: item.gdp,
  }));
};

/**
 * Fetch and return only Crime data
 * @returns {Promise<Array>} Array of objects with day and crime
 */
export const fetchCrimeData = async () => {
  const data = await fetchHistory();
  return data.map((item) => ({
    day: item.day,
    crime: item.crime,
  }));
};

/**
 * Fetch and return only Unemployment data
 * @returns {Promise<Array>} Array of objects with day and unemployment
 */
export const fetchUnemploymentData = async () => {
  const data = await fetchHistory();
  return data.map((item) => ({
    day: item.day,
    unemployment: item.unemployment,
  }));
};

/**
 * Fetch and return only Happiness data
 * @returns {Promise<Array>} Array of objects with day and happiness
 */
export const fetchHappinessData = async () => {
  const data = await fetchHistory();
  return data.map((item) => ({
    day: item.day,
    happiness: item.happiness,
  }));
};

/**
 * Fetch and return only Inequality data
 * @returns {Promise<Array>} Array of objects with day and inequality
 */
export const fetchInequalityData = async () => {
  const data = await fetchHistory();
  return data.map((item) => ({
    day: item.day,
    inequality: item.inequality,
  }));
};
