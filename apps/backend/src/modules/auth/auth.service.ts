import { prisma } from "db";
import type { User } from "db";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { signInviteToken, signToken, verifyInviteToken } from "../../lib/jwt.js";
import type { TokenPayload } from "../../lib/jwt.js";
import { badRequest, conflict, notFound, unauthorized } from "../../lib/httpError.js";
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
      // A manager only exists through a client's invite. No MANAGER row means
      // the client removed them — never attach them to some other client.
      const manager = await prisma.manager.findUnique({ where: { userId: user.userId } });
      if (!manager) {
        throw unauthorized("This manager account is no longer linked to a client");
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

// bcrypt hash of a random string; only used to equalise timing for unknown emails.
const DUMMY_HASH = "$2b$10$yLJKZoOzAgbvCwyBkusvPeYCPWFep4dQRhf4Q8zxz.AZ4fN7Ant0W";

/** Shared by /login and /manager/login. requiredRole narrows manager login to manager accounts only. */
async function authenticate(dto: LoginDto, requiredRole?: TokenPayload["role"]) {
  const cleanEmail = dto.email.trim();
  const user = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: "insensitive" } },
    omit: { hashPassword: false },
  });

  // Always run one bcrypt compare so response time doesn't reveal whether the email exists.
  const validPassword = await comparePassword(dto.password, user?.hashPassword ?? DUMMY_HASH).catch(() => false);

  if (!user || !validPassword) {
    throw unauthorized("Invalid email or password");
  }

  if (requiredRole && user.role !== requiredRole) {
    throw unauthorized("Invalid email or password for this role portal");
  }

  const payload = await buildTokenPayload(user);
  return { success: true, token: signToken(payload), user: sanitizeUser(user) };
}

// Log in only through the selected role portal. This prevents a valid account
// from being accepted by a different portal after the frontend role picker.
export function login(dto: LoginDto) {
  return authenticate(dto, dto.role);
}

// Log in restricted to manager accounts (rejects any other role's credentials).
export function managerLogin(dto: LoginDto) {
  return authenticate(dto, "manager");
}

const MANAGER_INVITE_TTL = "14d";

/** Signed, single-purpose link token for a ManagerInvite row. */
export function managerInviteToken(invite: { inviteId: number; email: string }): string {
  return signInviteToken("manager_invite", { ref: invite.inviteId, email: invite.email }, MANAGER_INVITE_TTL);
}

/** Resolves a token to its still-pending invite, or throws. */
async function requirePendingInvite(token: string) {
  const claims = token ? verifyInviteToken("manager_invite", token) : null;
  if (!claims) throw badRequest("This invite link is invalid or has expired");
  const invite = await prisma.managerInvite.findUnique({
    where: { inviteId: claims.ref },
    include: { client: { select: { clientName: true } } },
  });
  if (!invite || invite.email.toLowerCase() !== claims.email.toLowerCase()) {
    throw notFound("Invite not found");
  }
  if (invite.status !== "pending") {
    throw conflict(invite.status === "accepted" ? "This invite has already been accepted. Please sign in." : "This invite has been revoked");
  }
  return invite;
}

export async function getManagerInvite(token: string) {
  const invite = await requirePendingInvite(token);
  return { name: invite.name, email: invite.email, clientName: invite.client.clientName };
}

/** Turns a pending ManagerInvite into a real User+Manager. The invite's own
 * email is authoritative, and only the holder of the signed link can claim it. */
export async function acceptManagerInvite(dto: AcceptManagerInviteDto) {
  const invite = await requirePendingInvite(dto.token);

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: invite.email, mode: "insensitive" } },
  });
  if (existingUser) {
    throw conflict("An account with this email already exists");
  }

  const hashedPassword = await hashPassword(dto.password);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see buildTokenPayload comment above
  const { user, manager } = await prisma.$transaction(async (tx: any) => {
    // Conditional update makes acceptance single-use even under concurrent requests.
    const claimed = await tx.managerInvite.updateMany({
      where: { inviteId: invite.inviteId, status: "pending" },
      data: { status: "accepted" },
    });
    if (claimed.count !== 1) throw conflict("This invite has already been used");

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
      data: { acceptedUserId: created.userId },
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
