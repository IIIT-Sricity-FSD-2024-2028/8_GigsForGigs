import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { acceptManagerInviteSchema, loginSchema, signupSchema } from "./auth.dto.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

// Register a new client or gig professional account.
authRouter.post("/signup", validate(signupSchema), authController.signup);
// Log in any role (client, gig professional, manager, admin).
authRouter.post("/login", validate(loginSchema), authController.login);
// Log in restricted to manager accounts only.
authRouter.post("/manager/login", validate(loginSchema), authController.managerLogin);
// Turn a pending manager invite into a real manager account.
authRouter.post(
  "/manager/accept-invite",
  validate(acceptManagerInviteSchema),
  authController.acceptManagerInvite,
);
// Log out a manager. JWTs are stateless, so this is a no-op that just returns success for the client to drop its token.
authRouter.post(
  "/manager/logout",
  authGuard,
  roleGuard("manager"),
  authController.managerLogout,
);
