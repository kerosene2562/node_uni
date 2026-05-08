import { z } from "zod";

export const createLaptopSchema = z.object({
  brand: z.string().min(1).max(100).transform((v) => v.trim()),
  name: z.string().min(1).max(200).transform((v) => v.trim()),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  displaySize: z.number().positive(),
  cpu: z.string().min(1).max(100),
  gpu: z.string().min(1).max(100),
  releaseDate: z.coerce.date(),
});

export const updateLaptopSchema = createLaptopSchema.partial();

export type CreateLaptopDTO = z.infer<typeof createLaptopSchema>;
export type UpdateLaptopDTO = z.infer<typeof updateLaptopSchema>;