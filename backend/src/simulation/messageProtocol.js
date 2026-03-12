/**
 * Message Protocol for Simulation Worker
 * Defines all message types and their structure for communication between
 * the API server and the simulation worker thread.
 */

// Message types sent FROM the API server TO the worker
export const COMMAND_TYPES = {
  // Simulation lifecycle
  START_SIMULATION: "START_SIMULATION",
  PAUSE_SIMULATION: "PAUSE_SIMULATION",
  RESUME_SIMULATION: "RESUME_SIMULATION",
  STEP_SIMULATION: "STEP_SIMULATION",
  RESET_SIMULATION: "RESET_SIMULATION",
  SET_SIMULATION_CONFIG: "SET_SIMULATION_CONFIG",

  // Policy updates
  UPDATE_POLICY: "UPDATE_POLICY",

  // Event triggers
  TRIGGER_FAKE_NEWS: "TRIGGER_FAKE_NEWS",
  TOGGLE_AUTO_FAKE_NEWS: "TOGGLE_AUTO_FAKE_NEWS",
  TRIGGER_ECONOMIC_SHOCK: "TRIGGER_ECONOMIC_SHOCK",

  // Query status
  GET_STATUS: "GET_STATUS",
};

// Message types sent FROM the worker TO the API server
export const EVENT_TYPES = {
  // State updates
  STATE_UPDATE: "STATE_UPDATE",
  METRICS_UPDATE: "METRICS_UPDATE",
  FULL_STATE_UPDATE: "FULL_STATE_UPDATE",

  // Status responses
  STATUS_RESPONSE: "STATUS_RESPONSE",
  INITIALIZATION_COMPLETE: "INITIALIZATION_COMPLETE",

  // Lifecycle
  SIMULATION_STARTED: "SIMULATION_STARTED",
  SIMULATION_PAUSED: "SIMULATION_PAUSED",
  SIMULATION_RESUMED: "SIMULATION_RESUMED",
  SIMULATION_RESET: "SIMULATION_RESET",
  SIMULATION_COMPLETED: "SIMULATION_COMPLETED",

  // Data available
  HISTORY_UPDATE: "HISTORY_UPDATE",
};

/**
 * Command message structure
 * @typedef {Object} CommandMessage
 * @property {string} type - One of COMMAND_TYPES
 * @property {*} payload - Command-specific data
 * @property {number} timestamp - Unix timestamp of command
 * @property {string} id - Unique command ID for tracking
 */

/**
 * Event message structure
 * @typedef {Object} EventMessage
 * @property {string} type - One of EVENT_TYPES
 * @property {*} payload - Event-specific data
 * @property {number} timestamp - Unix timestamp of event
 */

/**
 * Creates a command message
 * @param {string} type - Command type from COMMAND_TYPES
 * @param {*} payload - Command payload
 * @returns {CommandMessage}
 */
export function createCommand(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: Date.now(),
    id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Creates an event message
 * @param {string} type - Event type from EVENT_TYPES
 * @param {*} payload - Event payload
 * @returns {EventMessage}
 */
export function createEvent(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * State Update Payload
 * Sent regularly during fast updates (every tick)
 * @typedef {Object} StateUpdatePayload
 * @property {number} day - Current simulation day
 * @property {number} gdp - Current GDP
 * @property {number} crimeRate - Crime count this tick
 * @property {number} avgHappiness - Average happiness across agents
 * @property {number} unemployment - Unemployment percentage
 * @property {number} policeStrength - Current police funding level
 * @property {boolean} fakeNewsEvent - Was a fake news event triggered
 * @property {boolean} autoFakeNewsEnabled - Is auto-fake news enabled
 * @property {Float32Array} panicLevels - Panic levels for all agents
 */

/**
 * Metrics Update Payload
 * Sent on slow updates (every 5 ticks) with heavier analytics
 * @typedef {Object} MetricsUpdatePayload
 * @property {number} taxRate - Tax rate policy
 * @property {number} policeStrength - Police strength policy
 * @property {number} topTenWealthShare - Top 10% wealth distribution
 * @property {number} bottomFiftyWealthShare - Bottom 50% wealth distribution
 * @property {number} totalWealth - Total wealth in system
 */

/**
 * Full State Update Payload
 * Sent when a full state snapshot is needed
 * Contains complete simulation state including all agent data
 */

export const MESSAGE_PROTOCOL = {
  COMMAND_TYPES,
  EVENT_TYPES,
  createCommand,
  createEvent,
};

export default MESSAGE_PROTOCOL;
