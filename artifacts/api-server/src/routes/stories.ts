import { Router } from "express";
import { db } from "@workspace/db";
import { storiesTable, storyViewsTable, usersTable } from "@workspace/db/schema";
import { eq, gt, desc, and } from "drizzle-orm";
import { requireAuth, getUser } from "../lib/auth.js";

const router = Router();

// GET /api/stories — get all active stories (< 24h, grouped by user)
router.get("/stories", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const now = new Date();
  const stories = await db
    .select({
      id: storiesTable.id,
      userId: storiesTable.userId,
      imageUrl: storiesTable.imageUrl,
      text: storiesTable.text,
      bgColor: storiesTable.bgColor,
      musicTitle: storiesTable.musicTitle,
      musicArtist: storiesTable.musicArtist,
      musicPreviewUrl: storiesTable.musicPreviewUrl,
      musicArtwork: storiesTable.musicArtwork,
      expiresAt: storiesTable.expiresAt,
      createdAt: storiesTable.createdAt,
      userName: usersTable.name,
      userAvatar: usersTable.profilePicture,
      blueBadge: usersTable.blueBadge,
    })
    .from(storiesTable)
    .innerJoin(usersTable, eq(storiesTable.userId, usersTable.id))
    .where(gt(storiesTable.expiresAt, now))
    .orderBy(desc(storiesTable.createdAt));

  // For each story, check if current user has viewed it
  const viewedStoryIds = me
    ? (await db
        .select({ storyId: storyViewsTable.storyId })
        .from(storyViewsTable)
        .where(eq(storyViewsTable.viewerId, me.id))
      ).map(v => v.storyId)
    : [];

  const result = stories.map(s => ({
    ...s,
    seen: viewedStoryIds.includes(s.id),
  }));

  res.json(result);
});

// POST /api/stories — create a story
router.post("/stories", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const { imageUrl, text, bgColor, musicTitle, musicArtist, musicPreviewUrl, musicArtwork } = req.body;

  if (!imageUrl && !text && !bgColor) {
    res.status(400).json({ error: "Story must have image, text, or background" });
    return;
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const [story] = await db.insert(storiesTable).values({
    userId: me!.id,
    imageUrl: imageUrl || null,
    text: text || null,
    bgColor: bgColor || null,
    musicTitle: musicTitle || null,
    musicArtist: musicArtist || null,
    musicPreviewUrl: musicPreviewUrl || null,
    musicArtwork: musicArtwork || null,
    expiresAt,
  }).returning();

  res.json(story);
});

// POST /api/stories/:id/view — mark story as viewed
router.post("/stories/:id/view", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const storyId = parseInt(req.params["id"] as string, 10);

  // Upsert: ignore if already viewed
  await db.insert(storyViewsTable).values({
    storyId,
    viewerId: me!.id,
  }).onConflictDoNothing();

  res.json({ ok: true });
});

// DELETE /api/stories/:id — delete own story
router.delete("/stories/:id", requireAuth, async (req, res): Promise<void> => {
  const me = getUser(req);
  const storyId = parseInt(req.params["id"] as string, 10);
  await db.delete(storiesTable).where(and(eq(storiesTable.id, storyId), eq(storiesTable.userId, me!.id)));
  res.json({ ok: true });
});

export { router as storiesRouter };
