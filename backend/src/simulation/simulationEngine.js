/**
 * Simulation Engine (Backward Compatibility Wrapper)
 *
 * This module provides backward-compatible API while delegating
 * all simulation logic to the worker thread via workerManager.
 *
 * The actual heavy computation now runs in a separate thread,
 * freeing up the Node event loop for API requests.
 *
 * MIGRATION NOTES:
 * - Old in-process simulation has been moved to simulationWorker.js
 * - All commands now go through workerManager to the worker thread
 * - Key benefit: API server stays responsive while simulation runs independently
 */

import workerManager from "./workerManager.js";

/**
 * DEPRECATED: Use workerManager directly for new code
 * Kept for backward compatibility
 */

// Simulation lifecycle commands
const startSimulation = () => workerManager.startSimulation();
const pauseSimulation = () => workerManager.pauseSimulation();
const resumeSimulation = () => workerManager.resumeSimulation();
const stepSimulation = () => workerManager.stepSimulation();
const resetSimulation = () => workerManager.resetSimulation();

// Policy and event triggers
const triggerFakeNewsNow = () => workerManager.triggerFakeNews();
const toggleAutoFakeNews = () => workerManager.toggleAutoFakeNews();
const triggerEconomicShock = () => workerManager.triggerEconomicShock();

/**
 * Get simulation status
 * Note: This is now async because status lives in the worker thread
 * For synchronous patterns, use workerManager.getStatus() directly
 */
const getSimulationStatus = async () => {
  const status = await workerManager.getStatus();
  return {
    running: status.running,
    day: status.day,
  };
};

/**
 * Register Socket.IO instance for broadcasting updates
 */
const setIO = (io) => workerManager.setIO(io);

/**
 * Get auto fake news enabled status
 * Note: This is now async because state lives in the worker thread
 */
const getAutoFakeNewsEnabled = async () => {
  const status = await workerManager.getStatus();
  return status.autoFakeNewsEnabled || false;
};

export {
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
};
