import { z } from "zod";
import { personName } from "../../lib/validation.js";

export const signupSchema = z.object({
  name: personName(100),
  email: z.string().trim().toLowerCase().email().max(100),
  // bcrypt silently truncates beyond 72 bytes; cap here so that's never surprising.
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  role: z.enum(["client", "gig_professional"]),
});
export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().max(254).email(),
  password: z.string().min(1).max(200),
  role: z.enum(["client", "gig_professional", "manager", "admin"]).optional(),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const acceptManagerInviteSchema = z.object({
  /** Signed invite token from the link the client shared. */
  token: z.string().min(1).max(2048),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type AcceptManagerInviteDto = z.infer<typeof acceptManagerInviteSchema>;
