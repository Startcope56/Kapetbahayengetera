import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { db, sessionsTable, usersTable, messagesTable, conversationParticipantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
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
  if (!token) {
    return next(new Error("No token"));
  }
  const [session] = await db
    .select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);
  if (!session) {
    return next(new Error("Invalid token"));
  }
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

  // ── WebRTC Call Signaling ──────────────────────────────────────────────
  socket.on("call_user", ({ to, from, type, name, avatar, conversationId }: any) => {
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

  // WebRTC offer/answer/ICE exchange
  socket.on("webrtc_offer", ({ to, offer }: any) => {
    io.to(`user:${to}`).emit("webrtc_offer", { from: userId, offer });
  });

  socket.on("webrtc_answer", ({ to, answer }: any) => {
    io.to(`user:${to}`).emit("webrtc_answer", { from: userId, answer });
  });

  socket.on("webrtc_ice", ({ to, candidate }: any) => {
    io.to(`user:${to}`).emit("webrtc_ice", { from: userId, candidate });
  });
  // ─────────────────────────────────────────────────────────────────────────

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

  // ── Live Streaming ──────────────────────────────────────────────────────
  socket.on("live_start", (data: any) => {
    socket.join(`live:${data.streamId}`);
    socket.broadcast.emit("live_new_stream", data);
    logger.info({ userId, streamId: data.streamId }, "Live stream started");
  });

  socket.on("live_end", ({ streamId }: any) => {
    io.to(`live:${streamId}`).emit("live_stream_ended", { streamId });
    socket.leave(`live:${streamId}`);
  });

  socket.on("live_join", ({ streamId }: any) => {
    socket.join(`live:${streamId}`);
    const room = io.sockets.adapter.rooms.get(`live:${streamId}`);
    io.to(`live:${streamId}`).emit("live_viewer_count", { count: room?.size ?? 1 });
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
  // ─────────────────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    logger.info({ userId }, "Socket disconnected");
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
