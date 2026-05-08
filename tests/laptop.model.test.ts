import { connectTestDB, disconnectTestDB, clearTestDB } from "./setup";
import { LaptopModel } from "../src/models/laptop.model";

describe("Laptop model", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("successful creation", () => {
    it("should create laptop with valid data", async () => {
      const laptop = await LaptopModel.create({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple 10-core GPU",
        releaseDate: new Date("2022-07-15"),
      });

      expect(laptop._id).toBeDefined();
      expect(laptop.brand).toBe("Apple");
      expect(laptop.name).toBe("MacBook Air M2");
    });

    it("should set default description", async () => {
      const laptop = await LaptopModel.create({
        brand: "Dell",
        name: "XPS 13",
        price: 50000,
        displaySize: 13.4,
        cpu: "Intel Core i7",
        gpu: "Intel Iris Xe",
        releaseDate: new Date("2023-01-01"),
      });

      expect(laptop.description).toBe("");
    });

    it("should add timestamps", async () => {
      const laptop = await LaptopModel.create({
        brand: "HP",
        name: "Spectre x360",
        price: 55000,
        displaySize: 13.5,
        cpu: "Intel Core i7",
        gpu: "Intel Iris Xe",
        releaseDate: new Date("2023-03-18"),
      });

      expect(laptop.createdAt).toBeDefined();
      expect(laptop.updatedAt).toBeDefined();
    });

    it("should return virtual fullName", async () => {
      const laptop = await LaptopModel.create({
        brand: "Lenovo",
        name: "ThinkPad X1 Carbon",
        price: 62000,
        displaySize: 14,
        cpu: "Intel Core i7",
        gpu: "Intel Iris Xe",
        releaseDate: new Date("2023-05-10"),
      });

      const json = laptop.toJSON() as { fullName?: string };
      expect(json.fullName).toBe("Lenovo ThinkPad X1 Carbon");
    });

    it("should trim brand", async () => {
      const laptop = await LaptopModel.create({
        brand: "   Apple   ",
        name: "MacBook Pro",
        price: 70000,
        displaySize: 14,
        cpu: "Apple M3",
        gpu: "Apple GPU",
        releaseDate: new Date("2023-11-07"),
      });

      expect(laptop.brand).toBe("Apple");
    });
  });

  describe("validation", () => {
    it("should fail without required fields", async () => {
      await expect(
        LaptopModel.create({
          brand: "Apple",
        })
      ).rejects.toThrow();
    });

    it("should fail if brand is not allowed", async () => {
      await expect(
        LaptopModel.create({
          brand: "UnknownBrand",
          name: "Model X",
          price: 30000,
          displaySize: 15,
          cpu: "Intel Core i5",
          gpu: "Intel UHD",
          releaseDate: new Date("2022-01-01"),
        })
      ).rejects.toThrow();
    });

    it("should fail if price is not positive", async () => {
      await expect(
        LaptopModel.create({
          brand: "Apple",
          name: "Bad Laptop",
          price: -10,
          displaySize: 13,
          cpu: "Apple M1",
          gpu: "Apple GPU",
          releaseDate: new Date("2022-01-01"),
        })
      ).rejects.toThrow();
    });

    it("should fail if displaySize is outside custom validator range", async () => {
      await expect(
        LaptopModel.create({
          brand: "Dell",
          name: "Huge Laptop",
          price: 30000,
          displaySize: 30,
          cpu: "Intel Core i5",
          gpu: "Intel UHD",
          releaseDate: new Date("2022-01-01"),
        })
      ).rejects.toThrow();
    });

    it("should fail if releaseDate is in the future", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(
        LaptopModel.create({
          brand: "HP",
          name: "Future Laptop",
          price: 30000,
          displaySize: 14,
          cpu: "Intel Core i5",
          gpu: "Intel UHD",
          releaseDate: futureDate,
        })
      ).rejects.toThrow();
    });
  });
});