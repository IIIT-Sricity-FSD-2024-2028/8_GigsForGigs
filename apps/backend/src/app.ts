import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "db";
import { env } from "./lib/env.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { clientRouter } from "./modules/client/client.route.js";
import { managerRouter } from "./modules/manager/manager.route.js";
import { gigRouter } from "./modules/gig/gig.route.js";
import { adminRouter } from "./modules/admin/admin.route.js";
import paymentRouter from "./modules/payment/payment.route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { globalLimiter, authLimiter, paymentLimiter } from "./middleware/rateLimit.middleware.js";
import { rejectUnsafeInput } from "./lib/validation.js";

export const app = express();

app.disable("x-powered-by");
// Behind a load balancer/reverse proxy, req.ip must come from X-Forwarded-For
// or every user shares the proxy's IP and one rate-limit bucket.
app.set("trust proxy", env.trustProxy);

app.use(helmet());
app.use(
  cors({
    origin: env.isProduction ? env.corsOrigins : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use(morgan(env.isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(rejectUnsafeInput);

app.get("/", (_req, res) => {
  res.json({ success: true, service: "GigsForGigs API" });
});

// Liveness + DB readiness for load balancers / uptime checks.
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", database: "unreachable", timestamp: new Date().toISOString() });
  }
});

app.use("/api", globalLimiter);

// IMPORTANT: clientRouter is mounted at bare "/api" and applies
// `roleGuard("client")` unconditionally via `.use()` with no path — that guard
// fires for every request that reaches it. Mounting it LAST lets the more
// specific routers handle their own routes first; only requests none of them
// matched fall through to clientRouter.
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentLimiter, paymentRouter);
app.use("/api/gig", gigRouter);
app.use("/api", managerRouter);
app.use("/api", clientRouter);

app.use(notFoundHandler);
app.use(errorHandler);
