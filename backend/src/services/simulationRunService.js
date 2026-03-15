import mongoose from "mongoose";
import SimulationRun from "../models/SimulationRun.js";

function sanitizeSummary(summary = {}) {
  return {
    avgGDP: summary.avgGDP ?? null,
    avgCrime: summary.avgCrime ?? null,
    avgUnemployment: summary.avgUnemployment ?? null,
    avgHappiness: summary.avgHappiness ?? null,
    finalInequality: summary.finalInequality ?? null,
    maxPanicLevel: summary.maxPanicLevel ?? null,
    daysSimulated: summary.daysSimulated ?? null,
  };
}

function sanitizeHistory(history = {}) {
  return {
    days: Array.isArray(history.days) ? history.days : [],
    gdp: Array.isArray(history.gdp) ? history.gdp : [],
    crime: Array.isArray(history.crime) ? history.crime : [],
    unemployment: Array.isArray(history.unemployment)
      ? history.unemployment
      : [],
    happiness: Array.isArray(history.happiness) ? history.happiness : [],
    inequality: Array.isArray(history.inequality) ? history.inequality : [],
  };
}

async function findRunForComparison(idOrRunId, includeHistory = false) {
  const projection = includeHistory
    ? { _id: 0, runId: 1, summary: 1, history: 1 }
    : { _id: 0, runId: 1, summary: 1 };

  const byRunId = await SimulationRun.findOne(
    { runId: idOrRunId },
    projection,
  ).lean();

  if (byRunId) {
    return byRunId;
  }

  if (!mongoose.Types.ObjectId.isValid(idOrRunId)) {
    return null;
  }

  return SimulationRun.findById(idOrRunId, projection).lean();
}

export async function saveSimulationRun(runPayload) {
  const saved = await SimulationRun.create(runPayload);
  return saved.toObject();
}

export async function listSimulationRuns(limit = 50) {
  return SimulationRun.find(
    {},
    {
      _id: 0,
      runId: 1,
      startTime: 1,
      createdAt: 1,
      parameters: 1,
      summary: 1,
    },
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getSimulationRunById(runId) {
  return SimulationRun.findOne({ runId }, { _id: 0 }).lean();
}

export async function getSimulationRunForExport(idOrRunId) {
  const byRunId = await SimulationRun.findOne(
    { runId: idOrRunId },
    { _id: 0 },
  ).lean();

  if (byRunId) {
    return byRunId;
  }

  if (!mongoose.Types.ObjectId.isValid(idOrRunId)) {
    return null;
  }

  return SimulationRun.findById(idOrRunId, { _id: 0 }).lean();
}

export async function deleteSimulationRunById(runId) {
  const result = await SimulationRun.deleteOne({ runId });
  return result.deletedCount > 0;
}

export async function compareSimulationRuns(runAId, runBId, options = {}) {
  const includeSeries = options.includeSeries === true;

  const [runA, runB] = await Promise.all([
    findRunForComparison(runAId, includeSeries),
    findRunForComparison(runBId, includeSeries),
  ]);

  return {
    runA: runA
      ? {
          runId: runA.runId,
          ...sanitizeSummary(runA.summary),
          ...(includeSeries ? sanitizeHistory(runA.history) : {}),
        }
      : null,
    runB: runB
      ? {
          runId: runB.runId,
          ...sanitizeSummary(runB.summary),
          ...(includeSeries ? sanitizeHistory(runB.history) : {}),
        }
      : null,
  };
}
