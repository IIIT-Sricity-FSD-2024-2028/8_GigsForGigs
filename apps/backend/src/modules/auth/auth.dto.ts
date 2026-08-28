import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  // bcrypt silently truncates beyond 72 bytes; cap here so that's never surprising.
  password: z.string().min(6).max(72),
  role: z.enum(["client", "gig_professional"]),
});
export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;
