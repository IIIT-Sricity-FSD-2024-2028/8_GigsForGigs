import assert from "node:assert/strict";
import { prisma } from "db";
import { loginSchema } from "./auth.dto.js";
import * as authService from "./auth.service.js";
import { verifyToken, signToken } from "../../lib/jwt.js";
import { authGuard } from "../../middleware/authGuard.js";
import { roleGuard } from "../../middleware/roleGuard.js";
import type { Request, Response, NextFunction } from "express";

async function runTests() {
  console.log("=== RUNNING AUTH & ROLE-AWARE ROUTING TEST SUITE ===\n");

  // TEST 1: Schema validation - accepts email & password without role
  console.log("Test 1: loginSchema accepts email and password without role");
  const validNoRole = loginSchema.safeParse({ email: "client@test.com", password: "password123" });
  assert.equal(validNoRole.success, true, "loginSchema should succeed without role");
  console.log("  ✓ Passed: loginSchema validates without role");

  // TEST 2: Schema validation - accepts email, password with optional role (backwards compatibility)
  console.log("Test 2: loginSchema accepts email and password with optional role");
  const validWithRole = loginSchema.safeParse({ email: "client@test.com", password: "password123", role: "client" });
  assert.equal(validWithRole.success, true, "loginSchema should succeed with optional role");
  console.log("  ✓ Passed: loginSchema accepts optional role");

  // TEST 3: Schema validation - rejects missing password or malformed email
  console.log("Test 3: loginSchema rejects invalid inputs");
  const invalidEmail = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
  assert.equal(invalidEmail.success, false, "loginSchema should fail for invalid email");
  const emptyPassword = loginSchema.safeParse({ email: "client@test.com", password: "" });
  assert.equal(emptyPassword.success, false, "loginSchema should fail for empty password");
  console.log("  ✓ Passed: loginSchema enforces email format and non-empty password");

  // Setup mock database records
  const mockUsers = {
    client: { userId: 101, name: "Alice Client", email: "client@test.com", role: "client" as const, hashPassword: "password123" },
    gigPro: { userId: 202, name: "Bob Freelancer", email: "gig@test.com", role: "gig_professional" as const, hashPassword: "password123" },
    manager: { userId: 303, name: "Charlie Manager", email: "manager@test.com", role: "manager" as const, hashPassword: "password123" },
    admin: { userId: 404, name: "Dave Admin", email: "admin@test.com", role: "admin" as const, hashPassword: "password123" },
    suspended: { userId: 505, name: "Eve Suspended", email: "suspended@test.com", role: "client" as const, hashPassword: "password123", status: "SUSPENDED" },
  };

  prisma.user.findFirst = (async ({ where }: any) => {
    const cleanEmail = where.email.equals.toLowerCase();
    for (const u of Object.values(mockUsers)) {
      if (u.email.toLowerCase() === cleanEmail) {
        return { ...u };
      }
    }
    return null;
  }) as any;

  prisma.client.findUnique = (async () => ({ clientId: 10, userId: 101, clientName: "Alice Client" })) as any;
  prisma.client.findFirst = (async () => ({ clientId: 10, userId: 101, clientName: "Alice Client" })) as any;
  prisma.gigProfessionalProfile.findUnique = (async () => ({ gigProfileId: 20, userId: 202 })) as any;
  prisma.manager.findUnique = (async () => ({ managerId: 30, clientId: 10, userId: 303 })) as any;

  // TEST 4: Client Login - role determined from DB, password hash not exposed
  console.log("Test 4: Client login determines role from DB and does not expose password hash");
  const clientRes = await authService.login({ email: "client@test.com", password: "password123" });
  assert.equal(clientRes.success, true);
  assert.equal(clientRes.user.role, "client");
  assert.equal(clientRes.user.email, "client@test.com");
  assert.equal((clientRes.user as any).hashPassword, undefined, "Password hash MUST NOT be exposed");
  const clientPayload = verifyToken(clientRes.token);
  assert.equal(clientPayload.role, "client");
  assert.equal(clientPayload.userId, 101);
  console.log("  ✓ Passed: Client login returns verified role and safe payload");

  // TEST 5: Gig Professional Login
  console.log("Test 5: Gig Professional login determines role from DB");
  const gigRes = await authService.login({ email: "gig@test.com", password: "password123" });
  assert.equal(gigRes.success, true);
  assert.equal(gigRes.user.role, "gig_professional");
  const gigPayload = verifyToken(gigRes.token);
  assert.equal(gigPayload.role, "gig_professional");
  console.log("  ✓ Passed: Gig Professional login returns verified role");

  // TEST 6: Manager Login
  console.log("Test 6: Manager login determines role from DB");
  const mgrRes = await authService.login({ email: "manager@test.com", password: "password123" });
  assert.equal(mgrRes.success, true);
  assert.equal(mgrRes.user.role, "manager");
  const mgrPayload = verifyToken(mgrRes.token);
  assert.equal(mgrPayload.role, "manager");
  console.log("  ✓ Passed: Manager login returns verified role");

  // TEST 7: Super Admin Login
  console.log("Test 7: Super Admin login determines role from DB");
  const adminRes = await authService.login({ email: "admin@test.com", password: "password123" });
  assert.equal(adminRes.success, true);
  assert.equal(adminRes.user.role, "admin");
  const adminPayload = verifyToken(adminRes.token);
  assert.equal(adminPayload.role, "admin");
  console.log("  ✓ Passed: Super Admin login returns verified role");

  // TEST 8: Role Tampering Immunity - Client sending role: "admin" is IGNORED by backend
  console.log("Test 8: Backend ignores client-supplied role tampering");
  const forgedRes = await authService.login({ email: "client@test.com", password: "password123", role: "admin" });
  assert.equal(forgedRes.user.role, "client", "Must still return role from database, NOT client-supplied 'admin'");
  const forgedPayload = verifyToken(forgedRes.token);
  assert.equal(forgedPayload.role, "client", "Token must reflect database role, not forged role");
  console.log("  ✓ Passed: Role spoofing blocked — database role remains authoritative");

  // TEST 9: Incorrect credentials rejected with 401
  console.log("Test 9: Incorrect password rejected with 401 Unauthorized");
  try {
    await authService.login({ email: "client@test.com", password: "wrong-password" });
    assert.fail("Should have thrown unauthorized");
  } catch (err: any) {
    assert.equal(err.status, 401);
    assert.equal(err.message, "Invalid email or password");
    console.log("  ✓ Passed: Incorrect password rejected with 401");
  }

  // TEST 10: Nonexistent user rejected with 401
  console.log("Test 10: Unknown email rejected with 401 Unauthorized");
  try {
    await authService.login({ email: "nonexistent@test.com", password: "password123" });
    assert.fail("Should have thrown unauthorized");
  } catch (err: any) {
    assert.equal(err.status, 401);
    assert.equal(err.message, "Invalid email or password");
    console.log("  ✓ Passed: Unknown email rejected with 401");
  }

  // TEST 11: Suspended/Disabled account rejected
  console.log("Test 11: Suspended account rejected with 401 Unauthorized");
  try {
    await authService.login({ email: "suspended@test.com", password: "password123" });
    assert.fail("Should have thrown unauthorized");
  } catch (err: any) {
    assert.equal(err.status, 401);
    assert.equal(err.message, "Account is suspended or disabled");
    console.log("  ✓ Passed: Suspended account rejected");
  }

  // TEST 12: Route Guard Protection - Missing or invalid token blocks access
  console.log("Test 12: authGuard blocks request missing Bearer token");
  const mockReqNoToken: Partial<Request> = {
    header: () => undefined,
  };
  let authErrorCaught: any = null;
  authGuard(mockReqNoToken as Request, {} as Response, (err?: any) => {
    authErrorCaught = err;
  });
  assert.ok(authErrorCaught, "Should invoke next with error");
  assert.equal(authErrorCaught.status, 401);
  console.log("  ✓ Passed: authGuard rejects missing Bearer token with 401");

  // TEST 13: Role Guard Protection - Client token accessing admin-only endpoint
  console.log("Test 13: roleGuard blocks Client token from Admin route with 403 Forbidden");
  const mockReqClient: Partial<Request> = {
    user: clientPayload,
  };
  let roleErrorCaught: any = null;
  const adminGuard = roleGuard("admin");
  adminGuard(mockReqClient as Request, {} as Response, (err?: any) => {
    roleErrorCaught = err;
  });
  assert.ok(roleErrorCaught, "Should invoke next with error");
  assert.equal(roleErrorCaught.status, 403);
  console.log("  ✓ Passed: roleGuard blocks Client token from Admin route with 403 Forbidden");

  // TEST 14: Role Guard allows Admin token on Admin route
  console.log("Test 14: roleGuard allows Admin token on Admin route");
  const mockReqAdmin: Partial<Request> = {
    user: adminPayload,
  };
  let adminGuardPassed = false;
  adminGuard(mockReqAdmin as Request, {} as Response, (err?: any) => {
    if (!err) adminGuardPassed = true;
  });
  assert.equal(adminGuardPassed, true, "Admin should be permitted on Admin route");
  console.log("  ✓ Passed: roleGuard permits authorized role");

  console.log("\n=======================================================");
  console.log("ALL 14 UNIT & INTEGRATION AUTH TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
