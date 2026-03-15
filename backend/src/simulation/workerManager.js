/**
 * Simulation Worker Manager
 * Handles worker lifecycle, message routing, and provides a clean API
 * for the Express server to interact with the worker thread.
 */

import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import {
  COMMAND_TYPES,
  EVENT_TYPES,
  createCommand,
} from "./messageProtocol.js";
import { saveSimulationRun } from "../services/simulationRunService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let worker = null;
let io = null;
let messageHandlers = {};
let simulationLifecycleStatus = "idle";
const statusChangeListeners = new Set();

function setSimulationLifecycleStatus(nextStatus) {
  if (simulationLifecycleStatus === nextStatus) {
    return;
  }

  simulationLifecycleStatus = nextStatus;

  for (const listener of statusChangeListeners) {
    try {
      listener(simulationLifecycleStatus);
    } catch (error) {
      console.error("[MANAGER] Status listener error:", error.message);
    }
  }
}

export function getSimulationLifecycleStatus() {
  return simulationLifecycleStatus;
}

export function onSimulationStatusChange(listener) {
  statusChangeListeners.add(listener);
  return () => statusChangeListeners.delete(listener);
}

async function persistCompletedRun(run) {
  if (!run?.runId) {
    console.warn(
      "[MANAGER] Missing runId. Skipping simulation run persistence.",
    );
    return null;
  }

  try {
    const savedRun = await saveSimulationRun(run);
    console.log(`[MANAGER] Saved simulation run: ${savedRun.runId}`);
    return savedRun;
  } catch (error) {
    console.error("[MANAGER] Failed to save simulation run:", error.message);
    return null;
  }
}

/**
 * Initialize the simulation worker
 */
export function initializeWorker() {
  console.log("[MANAGER] Initializing simulation worker...");

  worker = new Worker(path.join(__dirname, "simulationWorker.js"));

  worker.on("message", handleWorkerMessage);

  worker.on("error", (error) => {
    console.error("[MANAGER] Worker error:", error);
  });

  worker.on("exit", (code) => {
    console.log(`[MANAGER] Worker exited with code ${code}`);
    worker = null;
  });

  return new Promise((resolve) => {
    // Wait for INITIALIZATION_COMPLETE message
    const timeout = setTimeout(() => {
      console.error("[MANAGER] Worker initialization timeout");
      resolve(false);
    }, 5000);

    const handler = (msg) => {
      if (msg.type === EVENT_TYPES.INITIALIZATION_COMPLETE) {
        clearTimeout(timeout);
        worker.removeListener("message", handler);
        console.log("[MANAGER] Worker initialized successfully");
        resolve(true);
      }
    };

    worker.on("message", handler);
  });
}

/**
 * Set the Socket.IO instance for broadcasting updates
 */
export function setIO(ioInstance) {
  io = ioInstance;
  console.log("[MANAGER] Socket.IO instance registered");
}

/**
 * Handle messages from the worker
 */
function handleWorkerMessage(message) {
  console.log(
    `[MANAGER] Received message from worker: ${message.type} at ${new Date(message.timestamp).toISOString()}`,
  );

  // Broadcast to all connected clients via WebSocket
  if (io) {
    switch (message.type) {
      case EVENT_TYPES.STATE_UPDATE:
        io.emit("fastUpdate", message.payload);
        break;

      case EVENT_TYPES.METRICS_UPDATE:
        io.emit("slowUpdate", message.payload);
        break;

      case EVENT_TYPES.HISTORY_UPDATE:
        io.emit("historyUpdate", message.payload.history);
        break;

      case EVENT_TYPES.PROGRESS:
        io.emit("simulationProgress", message.payload);
        break;

      case EVENT_TYPES.SIMULATION_STARTED:
        setSimulationLifecycleStatus("running");
        io.emit("simulationStatusChanged", {
          type: message.type,
          payload: message.payload,
        });
        break;

      case EVENT_TYPES.SIMULATION_PAUSED:
        setSimulationLifecycleStatus("idle");
        io.emit("simulationStatusChanged", {
          type: message.type,
          payload: message.payload,
        });
        break;

      case EVENT_TYPES.SIMULATION_RESUMED:
        setSimulationLifecycleStatus("running");
        io.emit("simulationStatusChanged", {
          type: message.type,
          payload: message.payload,
        });
        break;

      case EVENT_TYPES.SIMULATION_RESET:
        setSimulationLifecycleStatus("running");
        io.emit("simulationStatusChanged", {
          type: message.type,
          payload: message.payload,
        });
        break;

      case EVENT_TYPES.SIMULATION_COMPLETED:
        setSimulationLifecycleStatus("completed");
        io.emit("simulationStatusChanged", {
          type: message.type,
          payload: message.payload,
        });

        void persistCompletedRun(message.payload?.run).then((savedRun) => {
          if (savedRun && io) {
            io.emit("simulationRunSaved", {
              runId: savedRun.runId,
              createdAt: savedRun.createdAt,
            });
          }
        });
        break;

      case EVENT_TYPES.STATUS_RESPONSE:
        // Handle status queries
        if (messageHandlers[message.type]) {
          messageHandlers[message.type](message.payload);
        }
        break;

      default:
        console.warn(`[MANAGER] Unhandled message type: ${message.type}`);
    }
  }

  // Call any registered handlers for this message type
  if (messageHandlers[message.type]) {
    messageHandlers[message.type](message.payload);
  }
}

/**
 * Send a command to the worker
 */
function sendCommand(type, payload = {}) {
  if (!worker) {
    console.error("[MANAGER] Worker not initialized");
    return false;
  }

  const command = createCommand(type, payload);
  worker.postMessage(command);
  console.log(`[MANAGER] Sent command to worker: ${type}`);
  return true;
}

/**
 * Simulation lifecycle commands
 */
export function startSimulation(options = {}) {
  const sent = sendCommand(COMMAND_TYPES.START_SIMULATION, options);
  if (sent) {
    setSimulationLifecycleStatus("running");
  }
  return sent;
}

export function pauseSimulation() {
  const sent = sendCommand(COMMAND_TYPES.PAUSE_SIMULATION);
  if (sent) {
    setSimulationLifecycleStatus("idle");
  }
  return sent;
}

export function resumeSimulation() {
  const sent = sendCommand(COMMAND_TYPES.RESUME_SIMULATION);
  if (sent) {
    setSimulationLifecycleStatus("running");
  }
  return sent;
}

export function stepSimulation() {
  return sendCommand(COMMAND_TYPES.STEP_SIMULATION);
}

export function resetSimulation() {
  const sent = sendCommand(COMMAND_TYPES.RESET_SIMULATION);
  if (sent) {
    setSimulationLifecycleStatus("running");
  }
  return sent;
}

export function updateSimulationConfig(config) {
  return sendCommand(COMMAND_TYPES.SET_SIMULATION_CONFIG, config);
}

/**
 * Policy updates
 */
export function updatePolicy(policyChanges) {
  return sendCommand(COMMAND_TYPES.UPDATE_POLICY, policyChanges);
}

/**
 * Event triggers
 */
export function triggerFakeNews() {
  return sendCommand(COMMAND_TYPES.TRIGGER_FAKE_NEWS);
}

export function toggleAutoFakeNews() {
  return sendCommand(COMMAND_TYPES.TOGGLE_AUTO_FAKE_NEWS);
}

export function triggerEconomicShock() {
  return sendCommand(COMMAND_TYPES.TRIGGER_ECONOMIC_SHOCK);
}

/**
 * Get simulation status
 * Returns a promise that resolves with the status
 */
export function getStatus() {
  return new Promise((resolve) => {
    const handler = (payload) => {
      // Remove the handler after getting response
      delete messageHandlers[EVENT_TYPES.STATUS_RESPONSE];
      resolve(payload);
    };

    messageHandlers[EVENT_TYPES.STATUS_RESPONSE] = handler;

    sendCommand(COMMAND_TYPES.GET_STATUS);

    // Timeout after 5 seconds
    setTimeout(() => {
      delete messageHandlers[EVENT_TYPES.STATUS_RESPONSE];
      resolve({ error: "Status request timeout" });
    }, 5000);
  });
}

/**
 * Terminate the worker
 */
export function terminateWorker() {
  if (worker) {
    console.log("[MANAGER] Terminating worker");
    worker.terminate();
    worker = null;
  }
}

export default {
  initializeWorker,
  setIO,
  getSimulationLifecycleStatus,
  onSimulationStatusChange,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  updateSimulationConfig,
  updatePolicy,
  triggerFakeNews,
  toggleAutoFakeNews,
  triggerEconomicShock,
  getStatus,
  terminateWorker,
};
