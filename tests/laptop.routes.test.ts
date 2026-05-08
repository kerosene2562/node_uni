import request from "supertest";
import app from "../src/app";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setup";
import { LaptopModel } from "../src/models/laptop.model";
import * as laptopStorage from "../src/storage/laptop.storage";

describe("Laptop routes", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/laptops", () => {
    it("should return 500 when storage throws on POST /", async () => {
      jest.spyOn(laptopStorage, "createLaptop").mockRejectedValueOnce(new Error("boom"));

      const response = await request(app).post("/api/laptops").send({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple 10-core GPU",
        releaseDate: "2022-07-15",
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("boom");
    });
    it("should create a laptop", async () => {
      const response = await request(app).post("/api/laptops").send({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple 10-core GPU",
        releaseDate: "2022-07-15",
      });

      expect(response.status).toBe(201);
      expect(response.body.brand).toBe("Apple");
      expect(response.body._id).toBeDefined();
    });

    it("should return 400 for invalid body", async () => {
      const response = await request(app).post("/api/laptops").send({
        brand: "",
        name: "Bad Laptop",
        price: -10,
        displaySize: 0,
        cpu: "",
        gpu: "",
        releaseDate: "invalid-date",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/laptops", () => {
    beforeEach(async () => {
      await LaptopModel.create([
        {
          brand: "Apple",
          name: "MacBook Air M2",
          price: 45999,
          displaySize: 13.6,
          cpu: "Apple M2",
          gpu: "Apple GPU",
          releaseDate: new Date("2022-07-15"),
        },
        {
          brand: "Dell",
          name: "XPS 13",
          price: 52999,
          displaySize: 13.4,
          cpu: "Intel Core i7",
          gpu: "Intel Iris Xe",
          releaseDate: new Date("2022-08-20"),
        },
        {
          brand: "HP",
          name: "Spectre x360",
          price: 56999,
          displaySize: 13.5,
          cpu: "Intel Core i7",
          gpu: "Intel Iris Xe",
          releaseDate: new Date("2023-03-18"),
        },
      ]);
    });

    it("should return paginated result", async () => {
      const response = await request(app).get("/api/laptops");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it("should sort by price descending", async () => {
      const response = await request(app).get("/api/laptops?sort=-price");

      expect(response.status).toBe(200);
      expect(response.body.data[0].price).toBeGreaterThanOrEqual(response.body.data[1].price);
    });

    it("should return pagination totals", async () => {
      const response = await request(app).get("/api/laptops?page=1&limit=2");

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalItems).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it("should return 500 when storage throws on GET /", async () => {
      jest.spyOn(laptopStorage, "getAllLaptops").mockRejectedValueOnce(new Error("boom"));

      const response = await request(app).get("/api/laptops");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("boom");
    });

    it("should filter by brand", async () => {
      const response = await request(app).get("/api/laptops?brand=apple");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].brand).toBe("Apple");
    });

    it("should filter by maxPrice", async () => {
      const response = await request(app).get("/api/laptops?maxPrice=50000");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it("should sort by price ascending", async () => {
      const response = await request(app).get("/api/laptops?sort=price");

      expect(response.status).toBe(200);
      expect(response.body.data[0].price).toBeLessThanOrEqual(response.body.data[1].price);
    });

    it("should paginate data", async () => {
      const response = await request(app).get("/api/laptops?page=2&limit=1");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe("GET /api/laptops/:id", () => {
    it("should return one laptop by id", async () => {
      const laptop = await LaptopModel.create({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple GPU",
        releaseDate: new Date("2022-07-15"),
      });

      const response = await request(app).get(`/api/laptops/${laptop._id}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(String(laptop._id));
    });

    it("should return 404 for valid but non-existing id", async () => {
      const response = await request(app).get("/api/laptops/507f1f77bcf86cd799439011");
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid id format", async () => {
      const response = await request(app).get("/api/laptops/invalid-id");
      expect(response.status).toBe(400);
    });
    it("should return 500 when storage throws on GET /:id", async () => {
      jest.spyOn(laptopStorage, "getLaptopById").mockRejectedValueOnce(new Error("boom"));

      const response = await request(app).get("/api/laptops/507f1f77bcf86cd799439011");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("boom");
    });
  });

  describe("PATCH /api/laptops/:id", () => {
    it("should return 404 when updating non-existing laptop", async () => {
      const response = await request(app)
        .patch("/api/laptops/507f1f77bcf86cd799439011")
        .send({ price: 50000 });

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid id format", async () => {
      const response = await request(app)
        .patch("/api/laptops/invalid-id")
        .send({ price: 50000 });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid update body", async () => {
      const laptop = await LaptopModel.create({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple GPU",
        releaseDate: new Date("2022-07-15"),
      });

      const response = await request(app)
        .patch(`/api/laptops/${laptop._id}`)
        .send({ price: -50 });

      expect(response.status).toBe(400);
    });

    it("should return 500 when storage throws on PATCH /:id", async () => {
      jest.spyOn(laptopStorage, "updateLaptop").mockRejectedValueOnce(new Error("boom"));

      const response = await request(app)
        .patch("/api/laptops/507f1f77bcf86cd799439011")
        .send({ price: 50000 });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("boom");
    });
    it("should update laptop", async () => {
      const laptop = await LaptopModel.create({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple GPU",
        releaseDate: new Date("2022-07-15"),
      });

      const response = await request(app)
        .patch(`/api/laptops/${laptop._id}`)
        .send({ price: 50000 });

      expect(response.status).toBe(200);
      expect(response.body.price).toBe(50000);
    });
  });

  describe("DELETE /api/laptops/:id", () => {
    it("should return 404 for non-existing laptop", async () => {
      const response = await request(app).delete("/api/laptops/507f1f77bcf86cd799439011");

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid id format", async () => {
      const response = await request(app).delete("/api/laptops/invalid-id");

      expect(response.status).toBe(400);
    });

    it("should return 500 when storage throws on DELETE /:id", async () => {
      jest.spyOn(laptopStorage, "deleteLaptop").mockRejectedValueOnce(new Error("boom"));

      const response = await request(app).delete("/api/laptops/507f1f77bcf86cd799439011");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("boom");
    });
    it("should delete laptop", async () => {
      const laptop = await LaptopModel.create({
        brand: "Apple",
        name: "MacBook Air M2",
        price: 45999,
        displaySize: 13.6,
        cpu: "Apple M2",
        gpu: "Apple GPU",
        releaseDate: new Date("2022-07-15"),
      });

      const response = await request(app).delete(`/api/laptops/${laptop._id}`);

      expect(response.status).toBe(204);
    });
  });

  describe("GET /api/laptops/budget", () => {
    it("should return 500 when storage throws on GET /budget", async () => {
      jest.spyOn(laptopStorage, "getBudgetLaptops").mockRejectedValueOnce(new Error("boom"));

      const response = await request(app).get("/api/laptops/budget");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("boom");
    });
    it("should return only budget laptops", async () => {
      await LaptopModel.create([
        {
          brand: "Apple",
          name: "MacBook Air M2",
          price: 999,
          displaySize: 13.6,
          cpu: "Apple M2",
          gpu: "Apple GPU",
          releaseDate: new Date("2022-07-15"),
        },
        {
          brand: "Dell",
          name: "Expensive XPS",
          price: 90000,
          displaySize: 13.4,
          cpu: "Intel Core i7",
          gpu: "Intel Iris Xe",
          releaseDate: new Date("2022-08-20"),
        },
      ]);

      const response = await request(app).get("/api/laptops/budget");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].price).toBeLessThanOrEqual(1000);
    });
  });
});