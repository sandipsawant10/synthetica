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

function sanitizeEvents(events = []) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events.map((event) => ({
    id: typeof event?.id === "string" ? event.id : null,
    timestamp:
      typeof event?.timestamp === "number" ? event.timestamp : Date.now(),
    day: typeof event?.day === "number" ? event.day : 0,
    type: typeof event?.type === "string" ? event.type : "UNKNOWN",
    source: typeof event?.source === "string" ? event.source : "unknown",
    message: typeof event?.message === "string" ? event.message : "",
    details:
      event?.details && typeof event.details === "object" ? event.details : {},
  }));
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
  const sanitizedPayload = {
    ...runPayload,
    runName:
      typeof runPayload?.runName === "string" &&
      runPayload.runName.trim() !== ""
        ? runPayload.runName.trim()
        : null,
    scenario:
      typeof runPayload?.scenario === "string" &&
      runPayload.scenario.trim() !== ""
        ? runPayload.scenario.trim()
        : null,
    maxDays:
      typeof runPayload?.maxDays === "number" &&
      Number.isFinite(runPayload.maxDays)
        ? runPayload.maxDays
        : null,
    speedMode:
      typeof runPayload?.speedMode === "string" &&
      runPayload.speedMode.trim() !== ""
        ? runPayload.speedMode.trim()
        : null,
    duration:
      typeof runPayload?.duration === "number" &&
      Number.isFinite(runPayload.duration)
        ? runPayload.duration
        : null,
    history: sanitizeHistory(runPayload?.history),
    summary: sanitizeSummary(runPayload?.summary),
    events: sanitizeEvents(runPayload?.events),
  };

  const saved = await SimulationRun.create(sanitizedPayload);
  return saved.toObject();
}

export async function listSimulationRuns({
  page = 1,
  limit = 20,
  scenario,
  search,
} = {}) {
  const query = {};
  if (scenario) query.scenario = scenario;
  if (search) query.runName = { $regex: search, $options: "i" };

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const skip = (safePage - 1) * safeLimit;

  const projection = {
    _id: 0,
    runId: 1,
    runName: 1,
    scenario: 1,
    startTime: 1,
    createdAt: 1,
    maxDays: 1,
    speedMode: 1,
    duration: 1,
    parameters: 1,
    summary: 1,
  };

  const [runs, total] = await Promise.all([
    SimulationRun.find(query, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    SimulationRun.countDocuments(query),
  ]);

  return {
    runs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
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
