import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { db, sessionsTable, usersTable, messagesTable, conversationParticipantsTable, postsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  path: "/socket.io",
  cors: { origin: "*", credentials: true },
  transports: ["websocket", "polling"],
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("No token"));
  const [session] = await db
    .select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);
  if (!session) return next(new Error("Invalid token"));
  socket.data.userId = session.userId;
  next();
});

io.on("connection", (socket) => {
  const userId: number = socket.data.userId;
  socket.join(`user:${userId}`);
  logger.info({ userId }, "Socket connected");

  socket.on("join_conversation", ({ conversationId }: { conversationId: number }) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on("leave_conversation", ({ conversationId }: { conversationId: number }) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on("typing", ({ conversationId }: { conversationId: number }) => {
    socket.to(`conv:${conversationId}`).emit("typing", { userId, conversationId });
  });

  // ── WebRTC Call Signaling ──────────────────────────────────────────────────
  socket.on("call_user", ({ to, from, type, name, avatar, conversationId }: any) => {
    logger.info({ from, to, type }, "Call initiated");
    io.to(`user:${to}`).emit("call_incoming", { from, type, name, avatar, conversationId });
  });

  socket.on("call_answer", ({ to, from }: any) => {
    io.to(`user:${to}`).emit("call_answered", { from });
  });

  socket.on("call_reject", ({ to }: any) => {
    io.to(`user:${to}`).emit("call_rejected");
  });

  socket.on("call_end", ({ to }: any) => {
    io.to(`user:${to}`).emit("call_ended");
  });

  // WebRTC offer/answer/ICE
  socket.on("webrtc_offer", ({ to, offer }: any) => {
    io.to(`user:${to}`).emit("webrtc_offer", { from: userId, offer });
  });

  socket.on("webrtc_answer", ({ to, answer }: any) => {
    io.to(`user:${to}`).emit("webrtc_answer", { from: userId, answer });
  });

  socket.on("webrtc_ice", ({ to, candidate }: any) => {
    io.to(`user:${to}`).emit("webrtc_ice", { from: userId, candidate });
  });
  // ─────────────────────────────────────────────────────────────────────────────

  socket.on("seen", async ({ conversationId, messageId }: { conversationId: number; messageId: number }) => {
    const [msg] = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, messageId))
      .limit(1);
    if (!msg) return;
    const seenBy: number[] = JSON.parse(msg.seenBy || "[]");
    if (!seenBy.includes(userId)) {
      seenBy.push(userId);
      await db.update(messagesTable).set({ seenBy: JSON.stringify(seenBy) }).where(eq(messagesTable.id, messageId));
    }
    io.to(`conv:${conversationId}`).emit("message_seen", { messageId, userId, seenBy });
  });

  // ── Live Streaming ────────────────────────────────────────────────────────
  socket.on("live_start", async (data: any) => {
    socket.join(`live:${data.streamId}`);
    // Mark user as live in DB
    await db.update(usersTable).set({
      isLive: true,
      liveTitle: data.title || "Going Live!",
      liveStreamId: data.streamId,
    } as any).where(eq(usersTable.id, userId)).catch(() => {});

    // Auto-create a post so it appears in the feed
    try {
      const [livePost] = await db.insert(postsTable).values({
        userId,
        content: `🔴 LIVE NOW: ${data.title || "Streaming Live!"}\n\nTap to join the live stream! 💙`,
        bgColor: "linear-gradient(135deg,#ef4444,#dc2626)",
        location: "live",
        liveStreamId: data.streamId,
        visibility: "public",
      } as any).returning();
      // Notify everyone
      io.emit("new_post", { post: livePost });
      io.emit("user_went_live", {
        userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        streamId: data.streamId,
        title: data.title,
      });
    } catch (e) {
      logger.error({ e }, "Failed to create live post");
    }

    socket.broadcast.emit("live_new_stream", data);
    logger.info({ userId, streamId: data.streamId }, "Live stream started");
  });

  socket.on("live_end", async ({ streamId }: any) => {
    io.to(`live:${streamId}`).emit("live_stream_ended", { streamId });
    socket.leave(`live:${streamId}`);
    // Clear live status
    await db.update(usersTable).set({ isLive: false, liveTitle: null, liveStreamId: null } as any).where(eq(usersTable.id, userId)).catch(() => {});
    io.emit("user_live_ended", { userId });
  });

  socket.on("live_join", ({ streamId }: any) => {
    socket.join(`live:${streamId}`);
    const room = io.sockets.adapter.rooms.get(`live:${streamId}`);
    io.to(`live:${streamId}`).emit("live_viewer_count", { count: room?.size ?? 1 });
    socket.to(`live:${streamId}`).emit("live_viewer_joined", { viewerSocketId: socket.id });
  });

  socket.on("live_leave", ({ streamId }: any) => {
    socket.leave(`live:${streamId}`);
    const room = io.sockets.adapter.rooms.get(`live:${streamId}`);
    io.to(`live:${streamId}`).emit("live_viewer_count", { count: room?.size ?? 0 });
  });

  socket.on("live_heart", ({ streamId }: any) => {
    socket.to(`live:${streamId}`).emit("live_heart");
  });

  socket.on("live_comment", ({ streamId, comment }: any) => {
    socket.to(`live:${streamId}`).emit("live_comment", comment);
  });

  // WebRTC relay for live broadcast viewers. Media stays peer-to-peer; the
  // server only forwards signaling messages between the broadcaster/viewer.
  socket.on("live_offer", ({ to, offer }: any) => {
    io.to(to).emit("live_offer", { from: socket.id, offer });
  });

  socket.on("live_answer", ({ to, answer }: any) => {
    io.to(to).emit("live_answer", { from: socket.id, answer });
  });

  socket.on("live_ice", ({ to, candidate }: any) => {
    io.to(to).emit("live_ice", { from: socket.id, candidate });
  });
  // ─────────────────────────────────────────────────────────────────────────

  socket.on("disconnect", async () => {
    logger.info({ userId }, "Socket disconnected");
    // Auto-end live if disconnected
    await db.update(usersTable).set({ isLive: false, liveTitle: null, liveStreamId: null } as any).where(eq(usersTable.id, userId)).catch(() => {});
  });
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

export default server;
