import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");
import "dotenv/config";
import assert from "node:assert/strict";
import * as authService from "./auth.service.js";
import { verifyToken } from "../../lib/jwt.js";

async function runLiveAuthTests() {
  console.log("=== RUNNING LIVE DATABASE AUTH TESTS ===");

  // 1. Client login
  console.log("\n1. Testing Client Login (aditya@techstart.io)...");
  const clientRes = await authService.login({
    email: "aditya@techstart.io",
    password: "password123",
  });
  assert.equal(clientRes.success, true);
  assert.equal(clientRes.user.role, "client");
  assert.equal((clientRes.user as any).hashPassword, undefined);
  const clientJwt = verifyToken(clientRes.token);
  assert.equal(clientJwt.role, "client");
  console.log(`  ✓ Client login succeeded: Name=${clientRes.user.name}, Role=${clientRes.user.role}, Token payload verified`);

  // 2. Manager login
  console.log("\n2. Testing Manager Login (curtis45@hotmail.com)...");
  const managerRes = await authService.login({
    email: "curtis45@hotmail.com",
    password: "password123",
  });
  assert.equal(managerRes.success, true);
  assert.equal(managerRes.user.role, "manager");
  const managerJwt = verifyToken(managerRes.token);
  assert.equal(managerJwt.role, "manager");
  console.log(`  ✓ Manager login succeeded: Name=${managerRes.user.name}, Role=${managerRes.user.role}, Token payload verified`);

  // 3. Gig Professional login
  console.log("\n3. Testing Gig Professional Login (elena@gigpro.io)...");
  const gigRes = await authService.login({
    email: "elena@gigpro.io",
    password: "password123",
  });
  assert.equal(gigRes.success, true);
  assert.equal(gigRes.user.role, "gig_professional");
  const gigJwt = verifyToken(gigRes.token);
  assert.equal(gigJwt.role, "gig_professional");
  console.log(`  ✓ Gig Pro login succeeded: Name=${gigRes.user.name}, Role=${gigRes.user.role}, Token payload verified`);

  // 4. Super Admin login
  console.log("\n4. Testing Super Admin Login (chaitanya.admin@gigsforgigs.internal)...");
  const adminRes = await authService.login({
    email: "chaitanya.admin@gigsforgigs.internal",
    password: "password123",
  });
  assert.equal(adminRes.success, true);
  assert.equal(adminRes.user.role, "admin");
  const adminJwt = verifyToken(adminRes.token);
  assert.equal(adminJwt.role, "admin");
  console.log(`  ✓ Super Admin login succeeded: Name=${adminRes.user.name}, Role=${adminRes.user.role}, Token payload verified`);

  // 5. Spoofed role attempt - Client attempts to send role: "admin"
  console.log("\n5. Testing Role Spoofing Immunity (Client sending role='admin')...");
  const spoofedRes = await authService.login({
    email: "aditya@techstart.io",
    password: "password123",
    role: "admin",
  });
  assert.equal(spoofedRes.user.role, "client", "Role must be resolved from DB, NOT client input");
  const spoofedJwt = verifyToken(spoofedRes.token);
  assert.equal(spoofedJwt.role, "client", "JWT role must be 'client', NOT 'admin'");
  console.log("  ✓ Role spoofing successfully ignored — database record was authoritative");

  // 6. Incorrect password
  console.log("\n6. Testing Incorrect Password...");
  try {
    await authService.login({
      email: "aditya@techstart.io",
      password: "wrong_password_999",
    });
    assert.fail("Should have rejected incorrect password");
  } catch (err: any) {
    assert.equal(err.status, 401);
    assert.equal(err.message, "Invalid email or password");
    console.log("  ✓ Incorrect password safely rejected with 401 Unauthorized");
  }

  // 7. Unknown email
  console.log("\n7. Testing Unknown Email...");
  try {
    await authService.login({
      email: "nonexistent.user.404@example.com",
      password: "password123",
    });
    assert.fail("Should have rejected unknown email");
  } catch (err: any) {
    assert.equal(err.status, 401);
    assert.equal(err.message, "Invalid email or password");
    console.log("  ✓ Unknown email safely rejected with 401 Unauthorized");
  }

  console.log("\n=======================================================");
  console.log("ALL LIVE DATABASE AUTHENTICATION TESTS PASSED!");
  console.log("=======================================================\n");
}

runLiveAuthTests().then(() => process.exit(0)).catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
