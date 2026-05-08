import { CreateLaptopDTO, UpdateLaptopDTO } from "../schemas/laptop.schema";
import { LaptopModel } from "../models/laptop.model";

type LaptopFilters = {
  brand?: string;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T) => {
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries);
};

export const getAllLaptops = async (filters: LaptopFilters = {}) => {
  const {
    brand,
    maxPrice,
    sort = "createdAt",
    page = 1,
    limit = 10,
  } = filters;

  const mongoFilter: Record<string, unknown> = {};

  if (brand) {
    mongoFilter.brand = { $regex: brand, $options: "i" };
  }

  if (maxPrice !== undefined) {
    mongoFilter.price = { $lte: maxPrice };
  }

  let sortField = "createdAt";
  let sortOrder: 1 | -1 = 1;

  if (sort.startsWith("-")) {
    sortField = sort.slice(1);
    sortOrder = -1;
  } else {
    sortField = sort;
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [data, totalItems] = await Promise.all([
    LaptopModel.find(mongoFilter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(safeLimit),
    LaptopModel.countDocuments(mongoFilter),
  ]);

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages: Math.ceil(totalItems / safeLimit),
    },
  };
};

export const getBudgetLaptops = async () => {
  return LaptopModel.find({ price: { $lte: 1000 } }).sort({ price: 1 });
};

export const getLaptopById = async (id: string) => {
  return LaptopModel.findById(id);
};

export const createLaptop = async (data: CreateLaptopDTO) => {
  const cleanData = removeUndefinedFields(data);
  return LaptopModel.create(cleanData);
};

export const updateLaptop = async (id: string, data: UpdateLaptopDTO) => {
  const cleanData = removeUndefinedFields(data);

  return LaptopModel.findByIdAndUpdate(id, cleanData, {
    new: true,
    runValidators: true,
  });
};

export const deleteLaptop = async (id: string) => {
  return LaptopModel.findByIdAndDelete(id);
};