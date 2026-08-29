/**
 * Process entry point. Loads environment variables before anything else in
 * the import graph runs — in particular before `db`'s singleton PrismaClient
 * is constructed, since it reads `process.env.DATABASE_URL` at module-load time.
 */
import { setDefaultResultOrder } from "node:dns";
import "dotenv/config";

// Neon's hostnames resolve to both A and AAAA records. On networks where
// outbound IPv6 is routable-but-blackholed (common on home ISPs/routers),
// Node's default "verbatim" lookup order can hand the pg driver an IPv6
// address first, which hangs until connectionTimeoutMillis and surfaces as
// ETIMEDOUT even though the IPv4 path works instantly. Forcing IPv4 first
// avoids that without needing a specific DATABASE_URL host workaround.
setDefaultResultOrder("ipv4first");

import "./server.js";
