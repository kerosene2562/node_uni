describe("initMongoConnection", () => {
  const originalMongoUri = process.env.MONGODB_URI;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.resetModules();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.dontMock("mongoose");
    jest.resetModules();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }
  });

  it("should throw when MONGODB_URI is not defined", async () => {
    delete process.env.MONGODB_URI;

    const { initMongoConnection } = await import("../src/config/database");

    await expect(initMongoConnection()).rejects.toThrow("MONGODB_URI is not defined in .env file");
  });

  it("should connect to MongoDB and register connection handlers", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test-db";

    const connect = jest.fn().mockResolvedValue(undefined);
    const on = jest.fn();

    jest.doMock("mongoose", () => ({
      __esModule: true,
      default: {
        connect,
        connection: {
          on,
        },
      },
    }));

    const { initMongoConnection } = await import("../src/config/database");

    await initMongoConnection();

    expect(connect).toHaveBeenCalledWith("mongodb://localhost:27017/test-db");
    expect(on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(on).toHaveBeenCalledWith("disconnected", expect.any(Function));
    expect(console.log).toHaveBeenCalledWith("Connected to db successfully");

    const errorCallback = on.mock.calls.find(([event]) => event === "error")?.[1] as (error: Error) => void;
    const disconnectedCallback = on.mock.calls.find(([event]) => event === "disconnected")?.[1] as () => void;

    errorCallback(new Error("connection failed"));
    disconnectedCallback();

    expect(console.error).toHaveBeenCalledWith("Mongo db connection error: Error: connection failed");
    expect(console.log).toHaveBeenCalledWith("Disconnected from db");
  });
});
