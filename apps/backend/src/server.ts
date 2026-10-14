import { prisma } from "db";
import { app } from "./app.js";
import { env } from "./lib/env.js";

const server = app.listen(env.port, () => {
  console.log(`GigsForGigs API listening on port ${env.port} (${env.isProduction ? "production" : "development"})`);
});

// Drain in-flight requests and close the DB pool on deploy/restart signals.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
