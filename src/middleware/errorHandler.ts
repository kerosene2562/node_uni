import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Database validation error",
      errors: Object.values(error.errors).map((err) => ({
        path: err.path,
        message: err.message,
      })),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `Invalid ${error.path}: ${String(error.value)}`,
    });
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate key error",
      keyValue: error.keyValue,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};