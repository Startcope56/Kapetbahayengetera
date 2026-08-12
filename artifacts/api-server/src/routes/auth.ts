import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db, usersTable, sessionsTable, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getUser, formatUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getApprovalRequired(): Promise<boolean> {
  try {
    const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "approval_required")).limit(1);
    return row?.value === "true";
  } catch { return false; }
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const name = String(req.body?.name ?? "").trim();
  const pin = String(req.body?.pin ?? "").trim();
  if (!email || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: "email, name, and 4-digit pin are required" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const pinHash = await bcrypt.hash(pin, 10);
  const isAdmin = email === "startcopediwznaga@gmail.com";
  const approvalRequired = isAdmin ? false : await getApprovalRequired();
  const accountApproved = isAdmin ? true : !approvalRequired;

  const [user] = await db.insert(usersTable).values({
    email, name, pinHash, privacy: "public", isAdmin,
    accountApproved,
    rank: "Newbie",
  } as any).returning();
  if (!user) {
    res.status(500).json({ error: "Unable to create account. Please try again." });
    return;
  }

  if (accountApproved) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(sessionsTable).values({ userId: user.id, token });
    res.status(201).json({ user: formatUser(user), token });
  } else {
    res.status(201).json({
      user: formatUser(user),
      token: null,
      pending: true,
      message: "Your account was submitted for review. You can log in after an admin approves it.",
    });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const pin = String(req.body?.pin ?? "").trim();
  if (!email || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: "email and pin are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or PIN" });
    return;
  }
  // Admin always bypasses approval
  if (!user.isAdmin && user.accountApproved === false) {
    res.status(403).json({
      error: "YOUR ACCOUNT IS WAITING FOR APPROVAL 🔒",
      pending: true,
      message: "Your account is still pending admin approval. Please wait for confirmation.",
    });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "Your account has been banned. Contact admin for assistance." });
    return;
  }
  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or PIN" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({ userId: user.id, token });
  res.json({ user: formatUser(user), token });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  res.json(formatUser(user));
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const header = req.headers.authorization ?? "";
  const token = header.slice(7);
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  res.json({ ok: true });
});

router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin || newPin.length !== 4) {
    res.status(400).json({ error: "currentPin and newPin (4 digits) required" });
    return;
  }
  const valid = await bcrypt.compare(currentPin, user.pinHash);
  if (!valid) {
    res.status(401).json({ error: "Current PIN is incorrect" });
    return;
  }
  const pinHash = await bcrypt.hash(newPin, 10);
  await db.update(usersTable).set({ pinHash }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

export default router;
