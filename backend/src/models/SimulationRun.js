import mongoose from "mongoose";

const simulationRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    runName: {
      type: String,
      default: null,
    },
    scenario: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      required: true,
    },
    maxDays: {
      type: Number,
      default: null,
    },
    speedMode: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    parameters: {
      taxRate: Number,
      policeStrength: Number,
      welfareRate: Number,
      maxDays: Number,
      seed: Number,
    },
    summary: {
      avgGDP: Number,
      avgCrime: Number,
      avgUnemployment: Number,
      avgHappiness: Number,
      finalInequality: Number,
      maxPanicLevel: Number,
      daysSimulated: Number,
    },
    history: {
      days: [Number],
      gdp: [Number],
      crime: [Number],
      unemployment: [Number],
      happiness: [Number],
      inequality: [Number],
    },
    events: [
      {
        id: String,
        timestamp: Number,
        day: Number,
        type: String,
        source: String,
        message: String,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SimulationRun =
  mongoose.models.SimulationRun ||
  mongoose.model("SimulationRun", simulationRunSchema);

export default SimulationRun;
