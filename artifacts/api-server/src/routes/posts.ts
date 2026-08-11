import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, usersTable, postsTable, postReactionsTable, postCommentsTable, notificationsTable, friendshipsTable } from "@workspace/db";
import { eq, desc, and, count, or, inArray, sql } from "drizzle-orm";
import { requireAuth, getUser, formatUser } from "../lib/auth";
import { uploadsDir } from "../app";
import { io } from "../index";
import { containsProfanity } from "../lib/profanity";

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

// Standard upload (images, files): 20 MB
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Video upload: 200 MB
const videoUpload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

// Any file: 50 MB (for docs, PDFs, etc.)
const fileUpload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

async function buildPost(post: typeof postsTable.$inferSelect, meId: number) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
  const allReactions = await db.select().from(postReactionsTable).where(eq(postReactionsTable.postId, post.id));
  const reactionMap: Record<string, number> = {};
  for (const r of allReactions) {
    reactionMap[r.type] = (reactionMap[r.type] ?? 0) + 1;
  }
  const reactions = Object.entries(reactionMap).map(([type, cnt]) => ({ type, count: cnt }));
  const myReactionRow = allReactions.find(r => r.userId === meId);
  const [commentCountRow] = await db
    .select({ c: count() })
    .from(postCommentsTable)
    .where(eq(postCommentsTable.postId, post.id));
  return {
    id: post.id,
    userId: post.userId,
    content: post.content,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    liveStreamId: (post as any).liveStreamId ?? null,
    fileUrl: post.fileUrl,
    fileName: post.fileName,
    bgColor: post.bgColor ?? null,
    feeling: post.feeling ?? null,
    activity: post.activity ?? null,
    locationTag: (post as any).location ?? null,
    visibility: (post as any).visibility ?? "public",
    taggedUserIds: post.taggedUserIds ? JSON.parse(post.taggedUserIds) : [],
    author: author ? formatUser(author) : null,
    reactions,
    commentCount: Number(commentCountRow?.c ?? 0),
    myReaction: myReactionRow?.type ?? null,
    createdAt: post.createdAt.toISOString(),
  };
}

router.get("/posts", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
  const accepted = await db.select({
    requesterId: friendshipsTable.requesterId,
    addresseeId: friendshipsTable.addresseeId,
  }).from(friendshipsTable).where(and(
    eq(friendshipsTable.status, "accepted"),
    or(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, me.id)),
  ));
  const friendIds = accepted.map(f => f.requesterId === me.id ? f.addresseeId : f.requesterId);
  const friendsOfFriends = friendIds.length
    ? await db.select({ requesterId: friendshipsTable.requesterId, addresseeId: friendshipsTable.addresseeId })
      .from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.status, "accepted"),
        or(inArray(friendshipsTable.requesterId, friendIds), inArray(friendshipsTable.addresseeId, friendIds)),
      ))
    : [];
  const fofIds = Array.from(new Set(friendsOfFriends.flatMap(f => [f.requesterId, f.addresseeId])))
    .filter(id => id !== me.id && !friendIds.includes(id));
  const visibilityFilter = or(
    eq(postsTable.visibility, "public"),
    eq(postsTable.userId, me.id),
    friendIds.length ? and(eq(postsTable.visibility, "friends"), inArray(postsTable.userId, friendIds)) : sql`false`,
    friendIds.length || fofIds.length
      ? and(eq(postsTable.visibility, "friends_of_friends"), inArray(postsTable.userId, [...friendIds, ...fofIds]))
      : sql`false`,
  );
  const ownerFilter = userId ? eq(postsTable.userId, userId) : visibilityFilter;
  const posts = await db.select().from(postsTable).where(ownerFilter).orderBy(desc(postsTable.createdAt)).limit(50);
  const result = await Promise.all(posts.map(p => buildPost(p, me.id)));
  res.json(result);
});

router.get("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(await buildPost(post, me.id));
});

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const { content, imageUrl, videoUrl, liveStreamId, fileUrl, fileName, bgColor, feeling, activity, locationTag, taggedUserIds } = req.body;
  const requestedVisibility = ["public", "friends_of_friends", "private"].includes(req.body.visibility)
    ? req.body.visibility
    : ((me as any).privacy === "friends" ? "friends_of_friends" : ((me as any).privacy ?? "public"));
  if (!content && !imageUrl && !videoUrl && !fileUrl) { res.status(400).json({ error: "content, imageUrl, videoUrl, or fileUrl required" }); return; }

  if (content && containsProfanity(content)) {
    res.status(400).json({
      error: "HINDI PWEDE ANG MASAMANG SALITA ❌ — Your post contains inappropriate language. Please keep it respectful!",
      profanity: true,
    });
    return;
  }

  const [post] = await db.insert(postsTable).values({
    userId: me.id,
    content: content ?? "",
    imageUrl: imageUrl ?? null,
    videoUrl: videoUrl ?? null,
    liveStreamId: liveStreamId ?? null,
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
    bgColor: bgColor ?? null,
    feeling: feeling ?? null,
    activity: activity ?? null,
    location: locationTag ?? null,
    taggedUserIds: taggedUserIds ? JSON.stringify(taggedUserIds) : null,
    visibility: requestedVisibility,
  } as any).returning();
  const built = await buildPost(post, me.id);
  io.emit("new_post", built);
  res.status(201).json(built);
});

router.delete("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  if (post.userId !== me.id && !me.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  // Clean up uploaded files
  for (const urlField of [post.imageUrl, post.videoUrl, post.fileUrl]) {
    if (urlField) {
      const filename = urlField.split("/").pop();
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        fs.unlink(filePath, () => {});
      }
    }
  }

  await db.delete(postsTable).where(eq(postsTable.id, id));
  io.emit("post_deleted", { id });
  res.status(204).send();
});

// React to post
router.post("/posts/:id/reactions", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { type } = req.body;
  const [existing] = await db.select().from(postReactionsTable)
    .where(and(eq(postReactionsTable.postId, id), eq(postReactionsTable.userId, me.id))).limit(1);
  if (existing) {
    await db.update(postReactionsTable).set({ type }).where(eq(postReactionsTable.id, existing.id));
  } else {
    await db.insert(postReactionsTable).values({ postId: id, userId: me.id, type });
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (post && post.userId !== me.id) {
      await db.insert(notificationsTable).values({
        userId: post.userId, type: "post_reaction", fromUserId: me.id, postId: id,
        message: `reacted ${type} to your post`,
      });
      io.to(`user:${post.userId}`).emit("notification", { type: "post_reaction", postId: id });
    }
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildPost(post, me.id));
});

router.delete("/posts/:id/reactions", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(postReactionsTable).where(and(eq(postReactionsTable.postId, id), eq(postReactionsTable.userId, me.id)));
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await buildPost(post, me.id));
});

// Comments
router.get("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const comments = await db.select().from(postCommentsTable)
    .where(eq(postCommentsTable.postId, id))
    .orderBy(postCommentsTable.createdAt);
  const result = await Promise.all(comments.map(async c => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
    return { id: c.id, postId: c.postId, userId: c.userId, content: c.content, author: author ? formatUser(author) : null, createdAt: c.createdAt.toISOString() };
  }));
  res.json(result);
});

router.post("/posts/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { content } = req.body;
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  if (containsProfanity(content)) {
    res.status(400).json({
      error: "HINDI PWEDE ANG MASAMANG SALITA ❌ — Your comment contains inappropriate language!",
      profanity: true,
    });
    return;
  }

  const [comment] = await db.insert(postCommentsTable).values({ postId: id, userId: me.id, content }).returning();
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, me.id)).limit(1);
  const built = { id: comment.id, postId: comment.postId, userId: comment.userId, content: comment.content, author: author ? formatUser(author) : null, createdAt: comment.createdAt.toISOString() };
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (post && post.userId !== me.id) {
    await db.insert(notificationsTable).values({ userId: post.userId, type: "post_comment", fromUserId: me.id, postId: id, message: "commented on your post" });
    io.to(`user:${post.userId}`).emit("notification", { type: "post_comment", postId: id });
  }
  res.status(201).json(built);
});

router.delete("/posts/:id/comments/:commentId", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const rawCid = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
  const commentId = parseInt(rawCid, 10);
  const [comment] = await db.select().from(postCommentsTable).where(eq(postCommentsTable.id, commentId)).limit(1);
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
  if (comment.userId !== me.id && !me.isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(postCommentsTable).where(eq(postCommentsTable.id, commentId));
  res.status(204).send();
});

// --- UPLOADS ---

// Upload image for a post
router.post("/posts/upload", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url });
});

// Upload image for a specific post (legacy)
router.post("/posts/:id/upload-image", requireAuth, upload.single("file"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post || (post.userId !== me.id && !me.isAdmin)) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.update(postsTable).set({ imageUrl: url } as any).where(eq(postsTable.id, id));
  res.json({ url });
});

// Upload VIDEO for a post (up to 200MB)
router.post("/posts/upload-video", requireAuth, videoUpload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No video file provided" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, type: "video", size: req.file.size, originalName: req.file.originalname });
});

// Attach video to existing post
router.post("/posts/:id/upload-video", requireAuth, videoUpload.single("file"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const me = getUser(req);
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post || (post.userId !== me.id && !me.isAdmin)) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.update(postsTable).set({ videoUrl: url } as any).where(eq(postsTable.id, id));
  res.json({ url });
});

// Upload file/document (PDF, docx, etc.) for a post
router.post("/posts/upload-file", requireAuth, fileUpload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No file" }); return; }
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, type: "file", size: req.file.size, originalName: req.file.originalname });
});

export default router;
