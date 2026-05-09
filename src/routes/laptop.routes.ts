import { Router, Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import { requireAuth } from "../middleware/auth";

import {
  getAllLaptops,
  getBudgetLaptops,
  getLaptopById,
  createLaptop,
  updateLaptop,
  deleteLaptop,
} from "../storage/laptop.storage";

import {
  createLaptopSchema,
  updateLaptopSchema,
} from "../schemas/laptop.schema";

import { validate } from "../middleware/validate";

const router = Router();

const checkOwner = (ownerId: unknown, userId?: string): boolean => {
  return String(ownerId) === String(userId);
};

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: {
      brand?: string;
      maxPrice?: number;
      sort?: string;
      page?: number;
      limit?: number;
    } = {};

    if (typeof req.query.brand === "string") {
      filters.brand = req.query.brand;
    }

    if (typeof req.query.maxPrice === "string") {
      const parsedMaxPrice = Number(req.query.maxPrice);
      if (Number.isFinite(parsedMaxPrice)) {
        filters.maxPrice = parsedMaxPrice;
      }
    }

    if (typeof req.query.sort === "string") {
      filters.sort = req.query.sort;
    }

    if (typeof req.query.page === "string") {
      const parsedPage = Number(req.query.page);
      if (Number.isFinite(parsedPage)) {
        filters.page = parsedPage;
      }
    }

    if (typeof req.query.limit === "string") {
      const parsedLimit = Number(req.query.limit);
      if (Number.isFinite(parsedLimit)) {
        filters.limit = parsedLimit;
      }
    }

    const result = await getAllLaptops(filters);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/budget", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const laptops = await getBudgetLaptops();
    return res.status(200).json(laptops);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid laptop id format" });
    }

    const laptop = await getLaptopById(req.params.id);

    if (!laptop) {
      return res.status(404).json({ message: "Laptop not found" });
    }

    return res.status(200).json(laptop);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireAuth,
  validate(createLaptopSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const laptop = await createLaptop(req.body, req.userId as string);
      return res.status(201).json(laptop);
    } catch (error) {
      next(error);
    }
  }
);

const updateLaptopHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid laptop id format" });
    }

    const laptop = await getLaptopById(req.params.id);

    if (!laptop) {
      return res.status(404).json({ message: "Laptop not found" });
    }

    if (!checkOwner(laptop.ownerId, req.userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedLaptop = await updateLaptop(req.params.id, req.body);
    return res.status(200).json(updatedLaptop);
  } catch (error) {
    next(error);
  }
};

router.patch("/:id", requireAuth, validate(updateLaptopSchema), updateLaptopHandler);
router.put("/:id", requireAuth, validate(updateLaptopSchema), updateLaptopHandler);

router.delete(
  "/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid laptop id format" });
      }

      const laptop = await getLaptopById(req.params.id);

      if (!laptop) {
        return res.status(404).json({ message: "Laptop not found" });
      }

      if (!checkOwner(laptop.ownerId, req.userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await deleteLaptop(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;