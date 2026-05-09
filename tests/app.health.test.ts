import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";

describe("App health route", () => {
  const originalReadyState = mongoose.connection.readyState;

  afterEach(() => {
    Object.defineProperty(mongoose.connection, "readyState", {
      value: originalReadyState,
      configurable: true,
    });
  });

  it("should return 200 when MongoDB is connected", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      value: 1,
      configurable: true,
    });

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      mongodb: "connected",
      readyState: 1,
    });
  });

  it("should return 503 when MongoDB is disconnected", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      value: 0,
      configurable: true,
    });

    const response = await request(app).get("/health");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: "error",
      mongodb: "disconnected",
      readyState: 0,
    });
  });
});
