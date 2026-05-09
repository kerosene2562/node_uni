import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email must be valid").transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6, "Password must contain at least 6 characters"),
});

export const loginSchema = registerSchema;

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;