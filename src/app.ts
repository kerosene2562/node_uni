import express from "express";
import mongoose from "mongoose";
import router from "./routes/laptop.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.get("/health", (_req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  return res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? "ok" : "error",
    mongodb: isMongoConnected ? "connected" : "disconnected",
    readyState: mongoose.connection.readyState,
  });
});

app.use(express.json());
app.use("/api/laptops", router);
app.use(errorHandler);

export default app;