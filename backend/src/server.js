import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import workerManager from "./simulation/workerManager.js";
import { getHistory } from "./simulation/historyManger.js";
import { getPolicy, updatePolicy } from "./simulation/policyEngine.js";
import { parseMaxDays } from "./config/simulationConfig.js";
import connectMongo from "./db/mongo.js";
import {
  compareSimulationRuns,
  deleteSimulationRunById,
  getSimulationRunById,
  getSimulationRunForExport,
  listSimulationRuns,
} from "./services/simulationRunService.js";
import {
  getScenarioByKey,
  getScenarioDetailByKey,
  getScenarioTemplates,
  listScenarios,
} from "./config/scenarios.js";
import { normalizeSeed } from "./simulation/rng.js";

let simulationStatus = "idle";

workerManager.onSimulationStatusChange((nextStatus) => {
  simulationStatus = nextStatus;
});

const POLICY_LIMITS = {
  taxRate: { min: 0, max: 0.5 },
  policeStrength: { min: 0, max: 0.5 },
  welfareRate: { min: 0, max: 1 },
  stimulusMultiplier: { min: 0, max: 5 },
};

const SIMULATION_SPEEDS = new Set(["normal", "fast"]);

function validatePolicyPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Payload must be a JSON object.";
  }

  const entries = Object.entries(payload);

  if (entries.length === 0) {
    return "Payload must include at least one policy field.";
  }

  for (const [key, value] of entries) {
    if (!(key in POLICY_LIMITS)) {
      return `Unsupported policy field: ${key}`;
    }

    if (typeof value !== "number" || Number.isNaN(value)) {
      return `Policy field ${key} must be a valid number.`;
    }

    const { min, max } = POLICY_LIMITS[key];
    if (value < min || value > max) {
      return `Policy field ${key} must be between ${min} and ${max}.`;
    }
  }

  return null;
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Register Socket.IO instance with worker manager
workerManager.setIO(io);

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

app.post("/policy/update", (req, res) => {
  const validationError = validatePolicyPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  workerManager.updatePolicy(req.body);

  return res.json({
    success: true,
    policy: getPolicy(),
  });
});

app.post("/policy/tax", (req, res) => {
  const { taxRate } = req.body;

  if (typeof taxRate === "number" && taxRate >= 0 && taxRate <= 0.5) {
    updatePolicy({ taxRate });
    return res.json({
      success: true,
      message: `Tax rate updated to ${taxRate}`,
      policy: getPolicy(),
    });
  }
  res.status(400).json({
    success: false,
    message: "Invalid tax rate. Must be between 0 and 0.5.",
  });
});

app.post("/policy/police-strength", (req, res) => {
  const { policeStrength } = req.body;

  if (
    typeof policeStrength === "number" &&
    policeStrength >= 0 &&
    policeStrength <= 0.5
  ) {
    updatePolicy({ policeStrength });
    return res.json({
      success: true,
      message: `Police strength updated to ${policeStrength}`,
      policy: getPolicy(),
    });
  }

  return res.status(400).json({
    success: false,
    message: "Invalid police strength. Must be between 0 and 0.5.",
  });
});

app.post("/policy/fake-news", (req, res) => {
  workerManager.triggerFakeNews();
  return res.json({
    success: true,
    message: "Fake news event will trigger on the next simulation tick.",
  });
});

app.post("/policy/fake-news/toggle", (req, res) => {
  workerManager.toggleAutoFakeNews();
  return res.json({
    success: true,
    message: "Auto fake-news toggling triggered.",
  });
});

app.get("/policy/fake-news/toggle", async (req, res) => {
  const status = await workerManager.getStatus();
  return res.json({
    success: true,
    autoFakeNewsEnabled: status.autoFakeNewsEnabled || false,
  });
});

app.get("/history", (req, res) => {
  return res.json({
    success: true,
    data: getHistory(),
  });
});

app.post("/event/economic-shock", (req, res) => {
  workerManager.triggerEconomicShock();
  return res.json({ success: true });
});

app.get("/events/timeline", async (req, res) => {
  const timeline = await workerManager.getEventTimeline();

  if (timeline?.error) {
    return res.status(500).json({
      success: false,
      message: timeline.error,
    });
  }

  return res.json({
    success: true,
    ...timeline,
  });
});

app.delete("/events/timeline", async (req, res) => {
  const result = await workerManager.clearEventTimeline();

  if (result?.error) {
    return res.status(500).json({
      success: false,
      message: result.error,
    });
  }

  return res.json({
    success: true,
  });
});

app.post("/simulation/pause", (req, res) => {
  workerManager.pauseSimulation();
  return res.json({
    success: true,
    status: "paused",
  });
});

app.post("/simulation/start", (req, res) => {
  if (simulationStatus === "running") {
    return res.status(409).json({
      success: false,
      error: "Simulation already running",
    });
  }

  const requestedScenario = req.body?.scenario || "baseline";
  const requestedRunName =
    typeof req.body?.runName === "string" ? req.body.runName.trim() : "";
  const runName = requestedRunName || `${requestedScenario}_run_${Date.now()}`;
  const seed = normalizeSeed(req.body?.seed);
  const scenario = getScenarioByKey(requestedScenario);
  let appliedMaxDays;

  if (!scenario) {
    return res.status(400).json({
      success: false,
      error: `Unknown scenario: ${requestedScenario}`,
      availableScenarios: Object.keys(getScenarioTemplates()),
    });
  }

  const requestedMaxDays = req.body?.maxDays;
  if (typeof requestedMaxDays !== "undefined") {
    const maxDays = parseMaxDays(requestedMaxDays);

    if (maxDays === null) {
      return res.status(400).json({
        success: false,
        message: "maxDays must be a positive integer.",
      });
    }

    workerManager.updateSimulationConfig({ maxDays });
    appliedMaxDays = maxDays;
  }

  workerManager.updatePolicy(scenario.policy);
  updatePolicy(scenario.policy);

  workerManager.startSimulation({
    seed,
    scenario: requestedScenario,
    runName,
  });
  simulationStatus = "running";

  return res.json({
    success: true,
    status: simulationStatus,
    runName,
    scenario: requestedScenario,
    seed,
    maxDays: appliedMaxDays,
    policy: scenario.policy,
  });
});

app.get("/scenarios", (req, res) => {
  return res.json({
    success: true,
    data: listScenarios(),
  });
});

app.get("/scenarios/:id", (req, res) => {
  const scenario = getScenarioDetailByKey(req.params.id);

  if (!scenario) {
    return res.status(404).json({
      success: false,
      error: `Scenario not found: ${req.params.id}`,
    });
  }

  return res.json({
    success: true,
    data: scenario,
  });
});

app.get("/simulation/scenarios", (req, res) => {
  return res.json({
    success: true,
    data: getScenarioTemplates(),
  });
});

app.post("/simulation/resume", (req, res) => {
  workerManager.resumeSimulation();
  return res.json({
    success: true,
    status: "running",
  });
});

app.post("/simulation/step", (req, res) => {
  workerManager.stepSimulation();
  return res.json({
    success: true,
    status: "step executed",
  });
});

app.post("/simulation/reset", (req, res) => {
  workerManager.resetSimulation();
  return res.json({
    success: true,
    status: "reset",
  });
});

app.post("/simulation/config", (req, res) => {
  const maxDays = parseMaxDays(req.body?.maxDays);

  if (maxDays === null) {
    return res.status(400).json({
      success: false,
      message: "maxDays must be a positive integer.",
    });
  }

  workerManager.updateSimulationConfig({ maxDays });

  return res.json({
    success: true,
    maxDays,
  });
});

app.post("/simulation/speed", (req, res) => {
  const speed = req.body?.speed;

  if (!SIMULATION_SPEEDS.has(speed)) {
    return res.status(400).json({
      success: false,
      message: `speed must be one of: ${Array.from(SIMULATION_SPEEDS).join(", ")}.`,
    });
  }

  workerManager.setSimulationSpeed(speed);

  return res.json({
    success: true,
    speed,
  });
});

app.get("/simulation/status", async (req, res) => {
  const status = await workerManager.getStatus();

  if (status?.running) {
    simulationStatus = "running";
  } else if (status?.limitReached) {
    simulationStatus = "completed";
  }

  return res.json({
    success: true,
    status: simulationStatus,
    ...status,
  });
});

app.get("/simulation/runs", async (req, res) => {
  const requestedPage = parseInt(req.query.page, 10);
  const requestedLimit = parseInt(req.query.limit, 10);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 200)
      : 20;
  const scenario = req.query.scenario || undefined;
  const search = req.query.search || undefined;

  try {
    const result = await listSimulationRuns({ page, limit, scenario, search });
    return res.json({
      success: true,
      data: result.runs,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch simulation runs: ${error.message}`,
    });
  }
});

app.get("/simulation/runs/:runId", async (req, res) => {
  try {
    const run = await getSimulationRunById(req.params.runId);

    if (!run) {
      return res.status(404).json({
        success: false,
        message: `Simulation run not found: ${req.params.runId}`,
      });
    }

    return res.json({
      success: true,
      data: run,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch simulation run: ${error.message}`,
    });
  }
});

app.delete("/simulation/runs/:runId", async (req, res) => {
  try {
    const deleted = await deleteSimulationRunById(req.params.runId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Simulation run not found: ${req.params.runId}`,
      });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to delete simulation run: ${error.message}`,
    });
  }
});

async function handleRunJsonExport(req, res) {
  try {
    const run = await getSimulationRunForExport(req.params.runId);

    if (!run) {
      return res.status(404).json({
        success: false,
        message: `Simulation run not found: ${req.params.runId}`,
      });
    }

    const safeRunId = String(run.runId || req.params.runId).replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=simulation_${safeRunId}.json`,
    );
    return res.json(run);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to export simulation run: ${error.message}`,
    });
  }
}

async function handleRunCsvExport(req, res) {
  try {
    const run = await getSimulationRunForExport(req.params.runId);

    if (!run) {
      return res.status(404).json({
        success: false,
        message: `Simulation run not found: ${req.params.runId}`,
      });
    }

    const history = run.history || {};
    const days = Array.isArray(history.days) ? history.days : [];
    const gdp = Array.isArray(history.gdp) ? history.gdp : [];
    const crime = Array.isArray(history.crime) ? history.crime : [];
    const unemployment = Array.isArray(history.unemployment)
      ? history.unemployment
      : [];
    const happiness = Array.isArray(history.happiness) ? history.happiness : [];
    const inequality = Array.isArray(history.inequality)
      ? history.inequality
      : [];

    let csv = "day,gdp,crime,unemployment,happiness,inequality\n";

    for (let i = 0; i < days.length; i += 1) {
      csv += `${days[i] ?? ""},${gdp[i] ?? ""},${crime[i] ?? ""},${unemployment[i] ?? ""},${happiness[i] ?? ""},${inequality[i] ?? ""}\n`;
    }

    const safeRunId = String(run.runId || req.params.runId).replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=simulation_${safeRunId}.csv`,
    );
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to export simulation run as CSV: ${error.message}`,
    });
  }
}

app.get("/simulation/runs/:runId/export", handleRunJsonExport);
app.get("/simulation/runs/:runId/export/csv", handleRunCsvExport);
app.get("/runs/:runId/export", handleRunJsonExport);
app.get("/runs/:runId/export/csv", handleRunCsvExport);

app.get("/runs/compare", async (req, res) => {
  const runA = typeof req.query.runA === "string" ? req.query.runA.trim() : "";
  const runB = typeof req.query.runB === "string" ? req.query.runB.trim() : "";

  if (!runA || !runB) {
    return res.status(400).json({
      success: false,
      message: "Query parameters runA and runB are required.",
    });
  }

  if (runA === runB) {
    return res.status(400).json({
      success: false,
      message: "runA and runB must be different runs.",
    });
  }

  const includeSeries = req.query.includeSeries === "true";

  try {
    const comparison = await compareSimulationRuns(runA, runB, {
      includeSeries,
    });

    if (!comparison.runA || !comparison.runB) {
      return res.status(404).json({
        success: false,
        message: "One or both simulation runs were not found.",
      });
    }

    return res.json(comparison);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to compare simulation runs: ${error.message}`,
    });
  }
});

app.get("/runs", async (req, res) => {
  try {
    const requestedPage = parseInt(req.query.page, 10);
    const requestedLimit = parseInt(req.query.limit, 10);
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 200)
        : 20;
    const scenario = req.query.scenario || undefined;
    const search = req.query.search || undefined;

    const result = await listSimulationRuns({ page, limit, scenario, search });
    return res.json({
      runs: result.runs,
      pagination: result.pagination,
    });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to fetch runs: ${error.message}`,
    });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Keep simulation usable even if MongoDB is temporarily unavailable.
  await connectMongo();

  // Initialize the simulation worker
  const workerReady = await workerManager.initializeWorker();

  if (workerReady) {
    console.log("Worker initialized and waiting for simulation start");
    simulationStatus = "idle";
  } else {
    console.error("Failed to initialize worker");
    process.exit(1);
  }
});
