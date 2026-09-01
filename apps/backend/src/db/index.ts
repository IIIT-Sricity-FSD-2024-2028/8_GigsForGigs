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

// Strip sslmode/ssl via URL.searchParams rather than regex — a regex that
// deletes "?sslmode=..." also eats the leading "?", which corrupts the URL
// when another param follows (e.g. "...?sslmode=require&x=1" -> "...&x=1",
// with no "?" left to start the query string at all).
function stripSslParams(raw: string): string {
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("ssl");
  return url.toString();
}

const cleanConnectionString = stripSslParams(connectionString);

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
