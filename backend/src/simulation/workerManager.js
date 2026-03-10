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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let worker = null;
let io = null;
let messageHandlers = {};

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

      case EVENT_TYPES.SIMULATION_STARTED:
      case EVENT_TYPES.SIMULATION_PAUSED:
      case EVENT_TYPES.SIMULATION_RESUMED:
      case EVENT_TYPES.SIMULATION_RESET:
        io.emit("simulationStatusChanged", {
          type: message.type,
          payload: message.payload,
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
export function startSimulation() {
  return sendCommand(COMMAND_TYPES.START_SIMULATION);
}

export function pauseSimulation() {
  return sendCommand(COMMAND_TYPES.PAUSE_SIMULATION);
}

export function resumeSimulation() {
  return sendCommand(COMMAND_TYPES.RESUME_SIMULATION);
}

export function stepSimulation() {
  return sendCommand(COMMAND_TYPES.STEP_SIMULATION);
}

export function resetSimulation() {
  return sendCommand(COMMAND_TYPES.RESET_SIMULATION);
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
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stepSimulation,
  resetSimulation,
  updatePolicy,
  triggerFakeNews,
  toggleAutoFakeNews,
  triggerEconomicShock,
  getStatus,
  terminateWorker,
};
