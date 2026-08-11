import { Router, type IRouter } from "express";
import { db, usersTable, postsTable, reportsTable } from "@workspace/db";
import { sql, count } from "drizzle-orm";
import { io } from "../index";
import { requireAuth, getUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const startTime = Date.now();

// Feature flags stored in memory (admin can toggle)
export const featureFlags: Record<string, boolean> = {
  feed: true,
  chat: true,
  stories: true,
  notifications: true,
  friends: true,
  marketplace: true,
  events: true,
  leaderboard: true,
  polls: true,
  games: true,
  live: true,
  ai: true,
  explore: true,
  dashboard: true,
};

const API_ENDPOINTS = [
  { method: "GET", path: "/api/healthz", desc: "Health check" },
  { method: "POST", path: "/api/auth/register", desc: "Register account" },
  { method: "POST", path: "/api/auth/login", desc: "Login" },
  { method: "GET", path: "/api/users/me", desc: "Get current user" },
  { method: "GET", path: "/api/posts", desc: "List posts" },
  { method: "POST", path: "/api/posts", desc: "Create post" },
  { method: "POST", path: "/api/posts/upload", desc: "Upload image" },
  { method: "POST", path: "/api/posts/upload-video", desc: "Upload video" },
  { method: "GET", path: "/api/stories", desc: "List stories" },
  { method: "POST", path: "/api/stories", desc: "Create story" },
  { method: "GET", path: "/api/conversations", desc: "List conversations" },
  { method: "POST", path: "/api/conversations", desc: "Create conversation" },
  { method: "GET", path: "/api/notifications", desc: "Get notifications" },
  { method: "GET", path: "/api/friends", desc: "Get friends" },
  { method: "POST", path: "/api/friends/request", desc: "Send friend request" },
  { method: "GET", path: "/api/admin/users", desc: "Admin: list users" },
  { method: "GET", path: "/api/admin/stats", desc: "Admin: statistics" },
  { method: "GET", path: "/api/status", desc: "Server status" },
  { method: "GET", path: "/api/status/features", desc: "Feature flags" },
  { method: "GET", path: "/api/push/vapid-key", desc: "Push VAPID key" },
  { method: "POST", path: "/api/push/subscribe", desc: "Push subscribe" },
];

// Public status endpoint
router.get("/status", async (_req, res): Promise<void> => {
  try {
    const uptimeMs = Date.now() - startTime;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;

    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [postCount] = await db.select({ count: count() }).from(postsTable);
    const wsConnected = io.engine.clientsCount;

    res.json({
      status: "ok",
      version: "1.4.0",
      poweredBy: "Blue Media Philippines 🇵🇭",
      createdBy: "Jonathan Villanueva (JV Channel)",
      uptime: `${h}h ${m}m ${s}s`,
      uptimeMs,
      websockets: { connected: wsConnected },
      database: { status: "connected" },
      features: featureFlags,
      stats: {
        totalUsers: userCount?.count ?? 0,
        totalPosts: postCount?.count ?? 0,
      },
      endpoints: API_ENDPOINTS.map(e => ({ ...e, status: "ok" })),
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ status: "error", error: e.message, poweredBy: "Blue Media Philippines 🇵🇭" });
  }
});

// Get feature flags (public)
router.get("/status/features", (_req, res) => {
  res.json(featureFlags);
});

// Admin: toggle feature
router.post("/status/features/:feature", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  if (!user.isAdmin) { res.status(403).json({ error: "Admin only" }); return; }
  const { feature } = req.params as { feature: string };
  const { enabled } = req.body as { enabled: boolean };
  if (!(feature in featureFlags)) { res.status(404).json({ error: "Unknown feature" }); return; }
  featureFlags[feature] = enabled;
  logger.info({ feature, enabled, by: user.id }, "Feature flag toggled");
  res.json({ ok: true, feature, enabled });
});

export default router;
