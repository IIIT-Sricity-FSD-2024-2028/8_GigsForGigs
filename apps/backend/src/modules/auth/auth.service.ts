import { prisma } from "db";
import type { User } from "db";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { signToken } from "../../lib/jwt.js";
import type { TokenPayload } from "../../lib/jwt.js";
import { conflict, unauthorized } from "../../lib/httpError.js";
import type { LoginDto, SignupDto } from "./auth.dto.js";

function sanitizeUser(user: User) {
  return { userId: user.userId, name: user.name, email: user.email, role: user.role };
}

/** Builds the role-specific JWT payload by looking up the side profile the role implies. */
async function buildTokenPayload(user: User): Promise<TokenPayload> {
  switch (user.role) {
    case "client": {
      const client = await prisma.client.findUniqueOrThrow({ where: { userId: user.userId } });
      return { role: "client", userId: user.userId, clientId: client.clientId };
    }
    case "manager": {
      const manager = await prisma.manager.findUniqueOrThrow({ where: { userId: user.userId } });
      return {
        role: "manager",
        userId: user.userId,
        managerId: manager.managerId,
        clientId: manager.clientId,
      };
    }
    case "gig_professional": {
      const profile = await prisma.gigProfessionalProfile.findUniqueOrThrow({
        where: { userId: user.userId },
      });
      return { role: "gig_professional", userId: user.userId, gigProfileId: profile.gigProfileId };
    }
    case "admin":
      return { role: "admin", userId: user.userId };
    default:
      // Prisma's generated client ships every file with @ts-nocheck, which
      // under this toolchain collapses `User` (and every other model type)
      // to `any` for consumers — confirmed by direct probing, not a bug in
      // this switch. TS can't see user.role as the closed union it really
      // is, so it can't prove exhaustiveness here without this branch.
      throw new Error(`Unhandled role: ${String(user.role)}`);
  }
}

export async function signup(dto: SignupDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) {
    throw conflict("Email already in use");
  }

  const hashedPassword = await hashPassword(dto.password);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- $transaction's
  // tx param can't be inferred while `prisma` itself types as `any` (see the
  // buildTokenPayload comment above); tx.user/.client/.gigProfessionalProfile
  // all still work correctly at runtime.
  const { user, payload } = await prisma.$transaction(async (tx: any) => {
    const created = await tx.user.create({
      data: { name: dto.name, email: dto.email, hashPassword: hashedPassword, role: dto.role },
    });

    let tokenPayload: TokenPayload;
    if (dto.role === "client") {
      const client = await tx.client.create({
        data: { userId: created.userId, clientName: dto.name },
      });
      tokenPayload = { role: "client", userId: created.userId, clientId: client.clientId };
    } else {
      const profile = await tx.gigProfessionalProfile.create({
        data: { userId: created.userId },
      });
      tokenPayload = {
        role: "gig_professional",
        userId: created.userId,
        gigProfileId: profile.gigProfileId,
      };
    }

    return { user: created, payload: tokenPayload };
  });

  return { success: true, token: signToken(payload), user: sanitizeUser(user) };
}

/** Shared by /login and /manager/login. requiredRole narrows manager login to manager accounts only. */
async function authenticate(dto: LoginDto, requiredRole?: TokenPayload["role"]) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });

  // Same message whether the email is unknown, the role doesn't match, or
  // the password is wrong — never reveal which one it was.
  if (!user || (requiredRole && user.role !== requiredRole)) {
    throw unauthorized("Invalid email or password");
  }

  const validPassword = await comparePassword(dto.password, user.hashPassword);
  if (!validPassword) {
    throw unauthorized("Invalid email or password");
  }

  const payload = await buildTokenPayload(user);
  return { success: true, token: signToken(payload), user: sanitizeUser(user) };
}

export function login(dto: LoginDto) {
  return authenticate(dto);
}

export function managerLogin(dto: LoginDto) {
  return authenticate(dto, "manager");
}
