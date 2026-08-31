/**
 * Single Prisma Client entry point for the whole backend.
 *
 * Prisma 7's `prisma-client` generator requires an explicit driver adapter —
 * there is no implicit connection-string constructor anymore. This module is
 * the one place that instantiates `PrismaClient`; every other package/module
 * must import `prisma` from here rather than constructing its own client.
 */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5433/gigsforge";

const isSsl =
  connectionString.includes("sslmode") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("supabase.co") ||
  connectionString.includes("aivencloud.com") ||
  connectionString.includes("render.com") ||
  connectionString.includes("aws");

const cleanConnectionString = connectionString
  .replace(/[?&]sslmode=[^&]+/g, "")
  .replace(/[?&]ssl=[^&]+/g, "");

const pool = new pg.Pool({
  connectionString: cleanConnectionString,
  ssl: isSsl ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

// Global omit: hashPassword must never leave the process over the wire,
// no matter which module/service pulls in a related User row.
export const prisma = new PrismaClient({
  adapter,
  omit: { user: { hashPassword: true } },
});

export * from "./generated/prisma/client.js";
