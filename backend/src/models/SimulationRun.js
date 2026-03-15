import mongoose from "mongoose";

const simulationRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
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
