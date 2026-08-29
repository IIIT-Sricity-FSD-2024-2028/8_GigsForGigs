import type { Request, Response } from "express";
import { getValidated } from "../../middleware/validate.js";
import * as authService from "./auth.service.js";
import type { AcceptManagerInviteDto, LoginDto, SignupDto } from "./auth.dto.js";

// Express 5 forwards a rejected async handler's promise to errorHandler
// automatically — no try/catch or asyncHandler wrapper needed here.

export async function signup(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<SignupDto>(res, "body");
  const result = await authService.signup(dto);
  res.status(201).json(result);
}

export async function login(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<LoginDto>(res, "body");
  const result = await authService.login(dto);
  res.status(200).json(result);
}

export async function managerLogin(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<LoginDto>(res, "body");
  const result = await authService.managerLogin(dto);
  res.status(200).json(result);
}

/** Stateless logout: no tokenVersion/session table to revoke, so this is a no-op 200. */
export function managerLogout(_req: Request, res: Response): void {
  res.status(200).json({ success: true });
}

export async function acceptManagerInvite(_req: Request, res: Response): Promise<void> {
  const dto = getValidated<AcceptManagerInviteDto>(res, "body");
  const result = await authService.acceptManagerInvite(dto);
  res.status(201).json(result);
}
