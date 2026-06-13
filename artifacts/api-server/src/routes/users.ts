import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, usersTable, postsTable, friendshipsTable, followsTable, notificationsTable, followerRequestsTable } from "@workspace/db";
import { eq, or, and, count, ilike, desc, sql } from "drizzle-orm";
import { requireAuth, getUser, formatUser } from "../lib/auth";
import { uploadsDir } from "../app";
import { io } from "../index";

const router: IRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const q = req.query.q as string | undefined;
  if (!q) {
    const users = await db.select().from(usersTable).where(eq(usersTable.isBlueAI, false)).limit(50);
    res.json(users.map(formatUser));
    return;
  }
  const users = await db.select().from(usersTable).where(and(ilike(usersTable.name, `%${q}%`), eq(usersTable.isBlueAI, false))).limit(20);
  res.json(users.map(formatUser));
});

router.get("/users/search", requireAuth, async (req, res): Promise<void> => {
  const q = (req.query.q as string | undefined) ?? "";
  const users = q
    ? await db.select().from(usersTable).where(and(ilike(usersTable.name, `%${q}%`), eq(usersTable.isBlueAI, false))).limit(20)
    : await db.select().from(usersTable).where(eq(usersTable.isBlueAI, false)).orderBy(desc(usersTable.createdAt)).limit(20);
  res.json(users.map(formatUser));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  // Track profile view (not self)
  const me = getUser(req);
  if (me.id !== id) {
    await db.update(usersTable).set({ profileViewCount: sql`${usersTable.profileViewCount} + 1` } as any).where(eq(usersTable.id, id)).catch(() => {});
  }
  res.json(formatUser(user));
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  if (me.id !== id && !me.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  const { name, bio, location, website, privacy } = req.body;
  const update: Record<string, string | null> = {};
  if (name != null) update.name = name;
  if (bio !== undefined) update.bio = bio;
  if (location !== undefined) update.location = location;
  if (website !== undefined) update.website = website;
  if (privacy != null) update.privacy = privacy;
  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
  res.json(formatUser(user));
});

router.post("/users/:id/upload-avatar", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  if (me.id !== id && !me.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  await db.update(usersTable).set({ profilePicture: url }).where(eq(usersTable.id, id));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  res.json(formatUser(updated));
});

router.post("/users/:id/upload-cover", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  if (me.id !== id && !me.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  await db.update(usersTable).set({ coverPicture: url }).where(eq(usersTable.id, id));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  res.json(formatUser(updated));
});

router.get("/users/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [postCountRow] = await db.select({ c: count() }).from(postsTable).where(eq(postsTable.userId, id));
  const friendCountRow = await db
    .select({ c: count() })
    .from(friendshipsTable)
    .where(and(
      or(eq(friendshipsTable.requesterId, id), eq(friendshipsTable.addresseeId, id)),
      eq(friendshipsTable.status, "accepted")
    ));
  const [followerCount] = await db.select({ c: count() }).from(followsTable).where(eq(followsTable.followingId, id));
  const [followingCount] = await db.select({ c: count() }).from(followsTable).where(eq(followsTable.followerId, id));
  const [userData] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  res.json({
    friendCount: Number(friendCountRow[0]?.c ?? 0),
    postCount: Number(postCountRow?.c ?? 0),
    followerCount: Number((userData as any)?.followerCount ?? followerCount?.c ?? 0),
    followingCount: Number((userData as any)?.followingCount ?? followingCount?.c ?? 0),
    totalPostViews: Number((userData as any)?.totalPostViews ?? 0),
    profileViewCount: Number((userData as any)?.profileViewCount ?? 0),
    rank: (userData as any)?.rank ?? "Newbie",
  });
});

// --- FOLLOW SYSTEM ---
router.post("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw, 10);
  const me = getUser(req);
  if (me.id === targetId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }
  try {
    await db.insert(followsTable).values({ followerId: me.id, followingId: targetId }).onConflictDoNothing();
    await db.update(usersTable).set({ followerCount: sql`${usersTable.followerCount} + 1` } as any).where(eq(usersTable.id, targetId)).catch(() => {});
    await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` } as any).where(eq(usersTable.id, me.id)).catch(() => {});
    await db.insert(notificationsTable).values({
      userId: targetId,
      type: "follow",
      fromUserId: me.id,
      message: "started following you",
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw, 10);
  const me = getUser(req);
  await db.delete(followsTable).where(and(eq(followsTable.followerId, me.id), eq(followsTable.followingId, targetId)));
  await db.update(usersTable).set({ followerCount: sql`GREATEST(${usersTable.followerCount} - 1, 0)` } as any).where(eq(usersTable.id, targetId)).catch(() => {});
  await db.update(usersTable).set({ followingCount: sql`GREATEST(${usersTable.followingCount} - 1, 0)` } as any).where(eq(usersTable.id, me.id)).catch(() => {});
  res.json({ ok: true });
});

router.get("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw, 10);
  const me = getUser(req);
  const [row] = await db.select().from(followsTable)
    .where(and(eq(followsTable.followerId, me.id), eq(followsTable.followingId, targetId))).limit(1);
  res.json({ isFollowing: !!row });
});

// --- CLAIM BLUE BADGE ---
router.post("/users/:id/claim-badge", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  if (me.id !== id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if ((user as any).blueBadge) { res.status(400).json({ error: "Already has badge" }); return; }
  await db.update(usersTable).set({ blueBadge: true, blueBadgeClaimedAt: new Date() }).where(eq(usersTable.id, id));
  const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  res.json(formatUser(updated));
});

// --- REPORT USER ---
router.post("/users/:id/report", requireAuth, async (_req, res): Promise<void> => {
  res.json({ ok: true });
});

// --- FOLLOWER REQUESTS ---
// Submit a follower request
router.post("/follower-requests", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const { amount } = req.body;
  if (!amount || amount < 1 || amount > 1000000) {
    res.status(400).json({ error: "Amount must be between 1 and 1,000,000" });
    return;
  }
  // Check if user already has a pending request
  const [existing] = await db.select().from(followerRequestsTable)
    .where(and(eq(followerRequestsTable.userId, me.id), eq(followerRequestsTable.status, "pending")))
    .limit(1);
  if (existing) {
    res.status(400).json({ error: "You already have a pending follower request. Please wait for admin approval." });
    return;
  }
  const [request] = await db.insert(followerRequestsTable).values({
    userId: me.id,
    requestedAmount: amount,
    status: "pending",
  } as any).returning();
  // Notify admin(s)
  const admins = await db.select().from(usersTable).where(eq(usersTable.isAdmin, true));
  await Promise.all(admins.map(a =>
    db.insert(notificationsTable).values({
      userId: a.id,
      type: "system",
      message: `📊 New follower request from ${me.name}: +${Number(amount).toLocaleString()} followers`,
    } as any).catch(() => {})
  ));
  res.json({ ok: true, request });
});

// Get my follower requests
router.get("/follower-requests/mine", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const requests = await db.select().from(followerRequestsTable)
    .where(eq(followerRequestsTable.userId, me.id))
    .orderBy(desc(followerRequestsTable.createdAt))
    .limit(10);
  res.json(requests);
});

export default router;
