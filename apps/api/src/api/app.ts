import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwtAuth } from "./auth";
import admin from "./routes/admin";
import auth from "./routes/auth";
import data from "./routes/data";
import documents from "./routes/documents";
import images from "./routes/images";
import people from "./routes/people";
import roles from "./routes/roles";
import webhooks from "./routes/webhooks";

export const api = new Hono();

// CORS
api.use(
  "*",
  cors({
    origin: [
      "https://dashboard.atmagaming.com",
      "https://atma-dashboard.vercel.app",
      "https://atmagaming.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// JWT auth on all routes (extracts user if present, doesn't block)
api.use("*", jwtAuth);

// Public routes (no auth required)
api.route("/auth", auth);
api.route("/webhooks", webhooks);

// Protected routes
api.route("/people", people);
api.route("/data", data);
api.route("/roles", roles);
api.route("/admin", admin);
api.route("/documents", documents);
api.route("/images", images);

// Health check
api.get("/", (c) => c.json({ status: "ok" }));
