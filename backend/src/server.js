import express from "express";
import { startSimulation } from "./simulation/simulationEngine.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startSimulation();
});
