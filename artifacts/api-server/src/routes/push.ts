import { Router, type IRouter } from "express";
import webpush from "web-push";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth, getUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VAPID_PUBLIC = process.env["VAPID_PUBLIC_KEY"] || "BBHcZ-WpyBwYQg-z3f6r5--y28yZ89s6bqYLtZvroW6FmHH8fBX9AJ4QEdi1kiUXTpGuiyrthkSgfeTXeNC1ePE";
const VAPID_PRIVATE = process.env["VAPID_PRIVATE_KEY"] || "vyNsks9Y5RLoxCiSMK2cxkEe6XMZrbiq8s3izwZ4nRo";

webpush.setVapidDetails("mailto:admin@bluemedia.ph", VAPID_PUBLIC, VAPID_PRIVATE);

// Ensure push_subscriptions table exists
async function ensurePushTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        keys JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  } catch (e) {
    logger.warn({ e }, "push_subscriptions table setup");
  }
}
ensurePushTable();

// Get VAPID public key
router.get("/push/vapid-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// Subscribe to push
router.post("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  const { subscription } = req.body;
  if (!subscription?.endpoint) { res.status(400).json({ error: "Invalid subscription" }); return; }
  try {
    await db.execute(sql`
      INSERT INTO push_subscriptions (user_id, endpoint, keys)
      VALUES (${user.userId}, ${subscription.endpoint}, ${JSON.stringify(subscription.keys)})
      ON CONFLICT (endpoint) DO UPDATE SET user_id = ${user.userId}, keys = ${JSON.stringify(subscription.keys)}
    `);
    res.json({ ok: true });
  } catch (e: any) {
    logger.error({ e }, "push subscribe error");
    res.status(500).json({ error: e.message });
  }
});

// Unsubscribe
router.delete("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  await db.execute(sql`DELETE FROM push_subscriptions WHERE user_id = ${user.userId}`);
  res.json({ ok: true });
});

// Send push to a user (internal helper exported)
export async function sendPushToUser(userId: number, payload: object) {
  try {
    const subs = await db.execute(sql`SELECT endpoint, keys FROM push_subscriptions WHERE user_id = ${userId}`);
    const rows = subs.rows as any[];
    for (const row of rows) {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: row.keys },
          JSON.stringify(payload)
        );
      } catch (e: any) {
        if (e.statusCode === 410) {
          await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${row.endpoint}`);
        }
      }
    }
  } catch (e) {
    logger.warn({ e }, "sendPushToUser error");
  }
}

export default router;
