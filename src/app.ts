import express from "express";
import mongoose from "mongoose";
import router from "./routes/laptop.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.get("/health", (_req, res) => {
  return res.status(503).json({
    status: "error",
    mongodb: "forced healthcheck failure",
    readyState: mongoose.connection.readyState,
  });
});

app.use(express.json());
app.use("/api/laptops", router);
app.use(errorHandler);

export default app;