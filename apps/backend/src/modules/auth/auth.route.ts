import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import { acceptManagerInviteSchema, loginSchema, signupSchema } from "./auth.dto.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", validate(signupSchema), authController.signup);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/manager/login", validate(loginSchema), authController.managerLogin);
authRouter.post(
  "/manager/accept-invite",
  validate(acceptManagerInviteSchema),
  authController.acceptManagerInvite,
);
authRouter.post(
  "/manager/logout",
  authGuard,
  roleGuard("manager"),
  authController.managerLogout,
);
