import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

const SECURITY_KEY_ROTATION_MS = 60 * 60 * 1000;

let currentSecurityKey = crypto.randomBytes(64).toString("hex");
let keyRotatedAt = Date.now();

export function getSecurityKey(): string {
  if (Date.now() - keyRotatedAt > SECURITY_KEY_ROTATION_MS) {
    currentSecurityKey = crypto.randomBytes(64).toString("hex");
    keyRotatedAt = Date.now();
    logger.info("Security key rotated");
  }
  return currentSecurityKey;
}

export function hashData(data: string): string {
  return crypto.createHmac("sha256", getSecurityKey()).update(data).digest("hex");
}

const ipWindowMap = new Map<string, { count: number; windowStart: number; blocked: boolean; blockedAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 200;
const AUTH_MAX_REQUESTS = 20;
const BLOCK_DURATION_MS = 5 * 60_000;

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ips.trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export function ddosProtection(req: Request, res: Response, next: NextFunction): void {
  const ip = getIp(req);
  const now = Date.now();
  const entry = ipWindowMap.get(ip);

  if (entry?.blocked) {
    if (now - entry.blockedAt < BLOCK_DURATION_MS) {
      logger.warn({ ip, path: req.path }, "DDoS block — request rejected");
      res.status(429).json({
        error: "Too many requests — you are temporarily blocked. Please try again later.",
        retryAfter: Math.ceil((BLOCK_DURATION_MS - (now - entry.blockedAt)) / 1000),
      });
      return;
    }
    ipWindowMap.delete(ip);
  }

  const limit = req.path.startsWith("/auth") ? AUTH_MAX_REQUESTS : MAX_REQUESTS_PER_WINDOW;

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipWindowMap.set(ip, { count: 1, windowStart: now, blocked: false, blockedAt: 0 });
    next();
    return;
  }

  entry.count++;

  if (entry.count > limit) {
    entry.blocked = true;
    entry.blockedAt = now;
    logger.warn({ ip, count: entry.count, path: req.path }, "DDoS detected — IP blocked");
    res.status(429).json({
      error: "DDoS protection triggered — your IP has been temporarily blocked.",
      retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000),
    });
    return;
  }

  if (ipWindowMap.size > 50_000) {
    const cutoff = now - WINDOW_MS * 2;
    for (const [k, v] of ipWindowMap.entries()) {
      if (v.windowStart < cutoff && !v.blocked) ipWindowMap.delete(k);
    }
  }

  next();
}

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

export function requestSignatureMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientSig = req.headers["x-request-sig"] as string | undefined;
  if (clientSig) {
    const body = typeof req.body === "object" ? JSON.stringify(req.body) : String(req.body ?? "");
    const expected = hashData(`${req.method}:${req.path}:${body}`);
    if (clientSig !== expected) {
      logger.warn({ ip: getIp(req), path: req.path }, "Invalid request signature");
    }
  }
  next();
}
