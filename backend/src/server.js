import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { startSimulation, setIO, city } from "./simulation/simulationEngine.js";

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

app.post("/policy/tax", (req, res) => {
  const { taxRate } = req.body;

  if (taxRate >= 0 && taxRate <= 0.5) {
    city.taxRate = taxRate;
    return res.json({
      success: true,
      message: `Tax rate updated to ${taxRate}`,
    });
  }
  res.status(400).json({
    success: false,
    message: "Invalid tax rate. Must be between 0 and 0.5.",
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startSimulation();
});
