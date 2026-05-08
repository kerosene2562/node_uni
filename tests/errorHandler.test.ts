import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { ZodError, z } from "zod";
import { errorHandler } from "../src/middleware/errorHandler";

describe("errorHandler", () => {
  const createRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it("should handle ZodError with 400", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    let zodError: ZodError | null = null;

    try {
      schema.parse({ name: "a" });
    } catch (error) {
      zodError = error as ZodError;
    }

    const res = createRes();

    errorHandler(zodError, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("should handle mongoose ValidationError with 400", () => {
    const validationError = new mongoose.Error.ValidationError();

    validationError.addError(
      "price",
      new mongoose.Error.ValidatorError({
        path: "price",
        message: "Price must be positive",
      })
    );

    const res = createRes();

    errorHandler(validationError, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Database validation error",
      errors: [
        {
          path: "price",
          message: "Price must be positive",
        },
      ],
    });
  });

  it("should handle mongoose CastError with 400", () => {
    const castError = new mongoose.Error.CastError("ObjectId", "bad-id", "id");
    const res = createRes();

    errorHandler(castError, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid id: bad-id",
    });
  });

  it("should handle MongoServerError 11000 with 409", () => {
    const mongoError = new MongoServerError({
      message: "E11000 duplicate key error",
    } as any);

    (mongoError as any).code = 11000;
    (mongoError as any).keyValue = { name: "MacBook Air M2" };

    const res = createRes();

    errorHandler(mongoError, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Duplicate key error",
      keyValue: { name: "MacBook Air M2" },
    });
  });

  it("should handle generic Error with 500", () => {
    const res = createRes();

    errorHandler(new Error("boom"), {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "boom",
    });
  });

  it("should handle unknown error with 500", () => {
    const res = createRes();

    errorHandler("unknown" as any, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
  });
});