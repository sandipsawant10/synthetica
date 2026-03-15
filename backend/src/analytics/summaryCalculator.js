function average(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export default function calculateSummary(history = {}, options = {}) {
  const daysSimulated = Array.isArray(history.days)
    ? history.days.length
    : Array.isArray(history.gdp)
      ? history.gdp.length
      : 0;

  const inequality = Array.isArray(history.inequality)
    ? history.inequality
    : [];
  const finalInequality =
    inequality.length > 0 ? inequality[inequality.length - 1] : 0;

  return {
    daysSimulated,
    avgGDP: average(history.gdp),
    avgCrime: average(history.crime),
    avgUnemployment: average(history.unemployment),
    avgHappiness: average(history.happiness),
    finalInequality,
    maxPanicLevel:
      typeof options.maxPanicLevel === "number" ? options.maxPanicLevel : 0,
  };
}
