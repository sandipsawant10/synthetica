const history = {
  days: [],
  gdp: [],
  crime: [],
  unemployment: [],
  happiness: [],
  inequality: [],
};

const maxHistory = 500;

function recordSnapshot(city) {
  history.days.push(city.day);
  history.gdp.push(city.gdp);
  history.crime.push(city.crimeCount);
  history.unemployment.push(city.unemployment);
  history.happiness.push(city.avyHappiness);
  history.inequality.push(city.topTenWealthShare);

  // Trim old data if exceeds max
  if (history.days.length > maxHistory) {
    history.days.shift();
    history.gdp.shift();
    history.crime.shift();
    history.unemployment.shift();
    history.happiness.shift();
    history.inequality.shift();
  }
}

function getHistory() {
  return history;
}

function clearHistory() {
  history.days = [];
  history.gdp = [];
  history.crime = [];
  history.unemployment = [];
  history.happiness = [];
  history.inequality = [];
}

export { history as default, recordSnapshot, getHistory, clearHistory };
