import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.route.js";
import { clientRouter } from "./modules/client/client.route.js";
import { managerRouter } from "./modules/manager/manager.route.js";
import { gigRouter } from "./modules/gig/gig.route.js";
import { adminRouter } from "./modules/admin/admin.route.js";
import paymentRouter from "./modules/payment/payment.route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "🚀 GigsForGigs Express Backend API Server is running!",
    frontendUrl: "http://localhost:5173",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      payments: "/api/payments",
      admin: "/api/admin",
      gig: "/api/gig"
    }
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "GigsForGigs Express Backend", timestamp: new Date().toISOString() });
});

// Note: gigRouter mounts under /api/gig — gigApi.ts's API_BASE_URL is
// 'http://localhost:3000/api' and every gig fetch call appends '/gig/...'.
//
// IMPORTANT: clientRouter is mounted at bare "/api" (not "/api/client") and
// applies `roleGuard("client")` unconditionally via `.use()` with no path —
// that guard fires for every request that reaches this router, regardless of
// whether any of its routes actually match the URL. Since Express matches
// app.use() mounts in registration order, mounting clientRouter before the
// other bare-"/api"/prefixed routers meant EVERY /api/* request (manager,
// gig, admin — anything not role "client") got a blanket 403
// "Requires role: client" here before ever reaching managerRouter/gigRouter/
// adminRouter. Mounting clientRouter LAST ensures the more specific routers
// get first chance to match/handle their own routes; only requests that
// don't match any of them fall through to clientRouter's routes.
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/gig", gigRouter);
app.use("/api", managerRouter);
app.use("/api", clientRouter);

app.use(notFoundHandler);
app.use(errorHandler);
