import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  getSimulationStatus,
  setIO,
  triggerFakeNewsNow,
  toggleAutoFakeNews,
  getAutoFakeNewsEnabled,
  triggerEconomicShock,
} from "./simulation/simulationEngine.js";
import { getHistory } from "./simulation/historyManger.js";
import { getPolicy, updatePolicy } from "./simulation/policyEngine.js";

const POLICY_LIMITS = {
  taxRate: { min: 0, max: 0.5 },
  policeStrength: { min: 0, max: 0.5 },
  welfareRate: { min: 0, max: 1 },
  stimulusMultiplier: { min: 0, max: 5 },
};

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

setIO(io);

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

  updatePolicy(req.body);

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
  triggerFakeNewsNow();
  return res.json({
    success: true,
    message: "Fake news event will trigger on the next simulation tick.",
  });
});

app.post("/policy/fake-news/toggle", (req, res) => {
  const enabled = toggleAutoFakeNews();
  return res.json({
    success: true,
    autoFakeNewsEnabled: enabled,
    message: enabled
      ? "Auto fake-news triggering started."
      : "Auto fake-news triggering stopped.",
  });
});

app.get("/policy/fake-news/toggle", (req, res) => {
  return res.json({
    success: true,
    autoFakeNewsEnabled: getAutoFakeNewsEnabled(),
  });
});

app.get("/history", (req, res) => {
  return res.json({
    success: true,
    data: getHistory(),
  });
});

app.post("/event/economic-shock", (req, res) => {
  triggerEconomicShock();
  return res.json({ success: true });
});

app.post("/simulation/pause", (req, res) => {
  pauseSimulation();
  return res.json({
    success: true,
    status: "paused",
  });
});

app.post("/simulation/resume", (req, res) => {
  resumeSimulation();
  return res.json({
    success: true,
    status: "running",
  });
});

app.post("/simulation/step", (req, res) => {
  stepSimulation();
  return res.json({
    success: true,
    status: "step executed",
  });
});

app.post("/simulation/reset", (req, res) => {
  resetSimulation();
  return res.json({
    success: true,
    status: "reset",
  });
});

app.get("/simulation/status", (req, res) => {
  return res.json({
    success: true,
    ...getSimulationStatus(),
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startSimulation();
});
