import { Router, type IRouter } from "express";
import { db, usersTable, postsTable, reportsTable, notificationsTable, siteSettingsTable, followerRequestsTable } from "@workspace/db";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { requireAuth, getUser, formatUser } from "../lib/auth";
import { io } from "../index";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  const user = getUser(req);
  if (!user.isAdmin) { res.status(403).json({ error: "Admin only" }); return; }
  next();
}

// Get all users with stats
router.get("/admin/users", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(formatUser));
});

// Approve a pending account
router.post("/admin/users/:id/approve", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.update(usersTable).set({ accountApproved: true } as any).where(eq(usersTable.id, id));
  await db.insert(notificationsTable).values({
    userId: id, type: "system", message: "✅ Your Blue Media account has been approved! Welcome aboard! 💙",
  } as any).catch(() => {});
  io.to(`user:${id}`).emit("notification", { type: "account_approved" });
  res.json({ ok: true });
});

// Ban/unban a user
router.post("/admin/users/:id/ban", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { banned } = req.body;
  await db.update(usersTable).set({ banned }).where(eq(usersTable.id, id));
  if (banned) io.to(`user:${id}`).emit("account_banned");
  res.json({ ok: true });
});

// Restrict/unrestrict user
router.post("/admin/users/:id/restrict", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { restricted } = req.body;
  await db.update(usersTable).set({ restricted }).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// Grant/revoke blue badge
router.post("/admin/users/:id/badge", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { blueBadge } = req.body;
  await db.update(usersTable).set({ blueBadge }).where(eq(usersTable.id, id));
  if (blueBadge) {
    await db.insert(notificationsTable).values({
      userId: id, type: "system", message: "🏅 Congratulations! You have been granted the Blue Badge ✓ by the admin!",
    } as any).catch(() => {});
    io.to(`user:${id}`).emit("notification", { type: "badge_granted" });
  }
  res.json({ ok: true });
});

// Grant/revoke admin role
router.post("/admin/users/:id/make-admin", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { isAdmin } = req.body;
  await db.update(usersTable).set({ isAdmin }).where(eq(usersTable.id, id));
  // Seed admin stats
  if (isAdmin) {
    await db.update(usersTable).set({
      followerCount: 10200,
      followingCount: 240,
      rank: "GOAT",
      blueBadge: true,
      accountApproved: true,
    } as any).where(eq(usersTable.id, id));
  }
  res.json({ ok: true });
});

// Delete any post
router.delete("/admin/posts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  await db.delete(postsTable).where(eq(postsTable.id, id));
  io.emit("post_deleted", { id });
  res.status(204).send();
});

// Get all posts with author info
router.get("/admin/posts", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const posts = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(200);
  const result = await Promise.all(posts.map(async p => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, p.userId)).limit(1);
    return { ...p, author: author ? formatUser(author) : null };
  }));
  res.json(result);
});

// Get all reports
router.get("/admin/reports", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const reports = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt)).limit(200);
  const result = await Promise.all(reports.map(async r => {
    const [reporter] = await db.select().from(usersTable).where(eq(usersTable.id, r.reporterId)).limit(1);
    return { ...r, reporter: reporter ? formatUser(reporter) : null };
  }));
  res.json(result);
});

// Resolve/dismiss report
router.patch("/admin/reports/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body;
  await db.update(reportsTable).set({ status }).where(eq(reportsTable.id, id));
  res.json({ ok: true });
});

// Platform stats
router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const [{ total: totalUsers }] = await db.select({ total: count() }).from(usersTable);
  const [{ total: totalPosts }] = await db.select({ total: count() }).from(postsTable);
  const [{ total: pendingReports }] = await db.select({ total: count() }).from(reportsTable).where(eq(reportsTable.status, "pending"));
  const [{ total: pendingAccounts }] = await db.select({ total: count() }).from(usersTable).where(eq((usersTable as any).accountApproved, false));
  const [{ total: bannedUsers }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.banned, true));
  const [{ total: pendingFollowerRequests }] = await db.select({ total: count() }).from(followerRequestsTable).where(eq(followerRequestsTable.status, "pending"));
  res.json({ totalUsers, totalPosts, pendingReports, pendingAccounts, bannedUsers, pendingFollowerRequests });
});

// Site settings
router.get("/admin/settings", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const obj: Record<string, string> = {};
  for (const s of settings) obj[s.key] = s.value;
  res.json(obj);
});

router.post("/admin/settings", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { key, value } = req.body;
  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  if (existing) {
    await db.update(siteSettingsTable).set({ value }).where(eq(siteSettingsTable.key, key));
  } else {
    await db.insert(siteSettingsTable).values({ key, value });
  }
  res.json({ ok: true });
});

// Broadcast system notification
router.post("/admin/broadcast", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { message } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }
  const users = await db.select().from(usersTable);
  await Promise.all(users.map(u =>
    db.insert(notificationsTable).values({ userId: u.id, type: "system", message } as any).catch(() => {})
  ));
  io.emit("notification", { type: "system", message });
  res.json({ ok: true, sent: users.length });
});

// Delete user account
router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const me = getUser(req);
  if (id === me.id) { res.status(400).json({ error: "Cannot delete your own account" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  io.to(`user:${id}`).emit("account_deleted");
  res.status(204).send();
});

// Set user rank
router.post("/admin/users/:id/rank", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { rank } = req.body;
  await db.update(usersTable).set({ rank } as any).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// Set user follower/following counts manually
router.post("/admin/users/:id/stats", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { followerCount, followingCount, totalPostViews } = req.body;
  const update: any = {};
  if (followerCount !== undefined) update.followerCount = followerCount;
  if (followingCount !== undefined) update.followingCount = followingCount;
  if (totalPostViews !== undefined) update.totalPostViews = totalPostViews;
  await db.update(usersTable).set(update).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

// ── FOLLOWER REQUESTS ─────────────────────────────────────────────────────────
// Get all follower requests
router.get("/admin/follower-requests", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const requests = await db.select().from(followerRequestsTable).orderBy(desc(followerRequestsTable.createdAt));
  const result = await Promise.all(requests.map(async r => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
    return { ...r, user: user ? formatUser(user) : null };
  }));
  res.json(result);
});

// Approve a follower request
router.post("/admin/follower-requests/:id/approve", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { adminNote } = req.body;
  const [request] = await db.select().from(followerRequestsTable).where(eq(followerRequestsTable.id, id)).limit(1);
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  // Update request status
  await db.update(followerRequestsTable).set({ status: "approved", adminNote: adminNote || "Approved!" } as any).where(eq(followerRequestsTable.id, id));
  // Add followers to user
  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, request.userId)).limit(1);
  const newCount = ((currentUser as any).followerCount ?? 0) + request.requestedAmount;
  await db.update(usersTable).set({ followerCount: newCount } as any).where(eq(usersTable.id, request.userId));
  // Notify user
  await db.insert(notificationsTable).values({
    userId: request.userId,
    type: "system",
    message: `🎉 Your follower request has been approved! +${request.requestedAmount.toLocaleString()} followers added to your account! 💙`,
  } as any).catch(() => {});
  io.to(`user:${request.userId}`).emit("notification", { type: "followers_approved", amount: request.requestedAmount });
  res.json({ ok: true, newFollowerCount: newCount });
});

// Reject a follower request
router.post("/admin/follower-requests/:id/reject", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  const { adminNote } = req.body;
  await db.update(followerRequestsTable).set({ status: "rejected", adminNote: adminNote || "Request rejected." } as any).where(eq(followerRequestsTable.id, id));
  const [request] = await db.select().from(followerRequestsTable).where(eq(followerRequestsTable.id, id)).limit(1);
  if (request) {
    await db.insert(notificationsTable).values({
      userId: request.userId,
      type: "system",
      message: `❌ Your follower request of ${request.requestedAmount.toLocaleString()} followers was reviewed. ${adminNote || "Please try again later."}`,
    } as any).catch(() => {});
  }
  res.json({ ok: true });
});

export default router;
