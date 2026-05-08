import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { initMongoConnection } from "./config/database";
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

const startServer = async (): Promise<void> => {
  try {
    await initMongoConnection();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");

      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed");
          process.exit(0);
        } catch (error) {
          console.error("Error while closing MongoDB connection:", error);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

void startServer();