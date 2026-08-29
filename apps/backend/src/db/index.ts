/**
 * Single Prisma Client entry point for the whole backend.
 *
 * Prisma 7's `prisma-client` generator requires an explicit driver adapter —
 * there is no implicit connection-string constructor anymore. This module is
 * the one place that instantiates `PrismaClient`; every other package/module
 * must import `prisma` from here rather than constructing its own client.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

// Global omit: hashPassword must never leave the process over the wire,
// no matter which module/service pulls in a related User row.
export const prisma = new PrismaClient({
  adapter,
  omit: { user: { hashPassword: true } },
});

export * from "./generated/prisma/client.js";
