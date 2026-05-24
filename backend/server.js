import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./src/routes/authRoute.js";
import googleAuthRoutes from "./src/routes/googleAuthRoute.js";
import itemRoutes from "./src/routes/itemsRoute.js";
import messageRoutes from "./src/routes/messagesRoute.js";
import transactionRoutes from "./src/routes/transactionsRoute.js";
import cartRoutes from "./src/routes/cartRoute.js";
import notificationRoutes from "./src/routes/notificationsRoute.js";
import userRoutes from "./src/routes/usersRoute.js";
import institutionsRoutes from "./src/routes/institutionsRoute.js";
import uploadRoutes from "./src/routes/uploadRoute.js";
import chatRequestRoutes from "./src/routes/chatRequestsRoute.js";
import reviewRoutes from "./src/routes/reviewsRoute.js";
import { expireCheckoutSessions } from "./src/controllers/transactionsController.js";
import { cleanupExpiredAttachments } from "./src/lib/cleanupAttachments.js";

dotenv.config();
const app = express();

// ── Create HTTP server + attach Socket.io ─────────────────────
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ── Online users map: userId → Set of socketIds ───────────────
const onlineUsers = new Map();
io._onlineUsers = onlineUsers; // exposed so controllers can emit to specific users

io.on("connection", (socket) => {
  const userId = String(socket.handshake.auth?.userId);
  if (!userId || userId === "undefined") return;

  // Track socket
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  // Tell everyone this user is now online
  io.emit("user-online", { userId });

  // Send the newly connected socket the full current online list
  // so their UI immediately shows correct status without waiting for an event
  socket.emit("online-list", { userIds: Array.from(onlineUsers.keys()) });

  // ── Typing events ──────────────────────────────────────────
  socket.on("typing-start", ({ toUserId, itemId }) => {
    onlineUsers
      .get(String(toUserId))
      ?.forEach((sid) =>
        io.to(sid).emit("typing-start", { fromUserId: userId, itemId }),
      );
  });

  // Client can request a fresh online list at any time (e.g. when switching convos)
  socket.on("get-online-list", () => {
    socket.emit("online-list", { userIds: Array.from(onlineUsers.keys()) });
  });

  socket.on("typing-stop", ({ toUserId, itemId }) => {
    onlineUsers
      .get(String(toUserId))
      ?.forEach((sid) =>
        io.to(sid).emit("typing-stop", { fromUserId: userId, itemId }),
      );
  });

  // ── Disconnect ────────────────────────────────────────────
  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      // Only mark offline when ALL tabs are closed
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user-offline", { userId });
      }
    }
  });
});

// ── Express middleware ────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(
  "/transactions/razorpay/webhook",
  express.raw({ type: "application/json" }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  req.io = io;
  next();
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

app.use(generalLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use("/auth", authLimiter, authRoutes);
app.use("/auth", authLimiter, googleAuthRoutes);
app.use("/items", itemRoutes);
app.use("/messages", messageRoutes);
app.use("/transactions", transactionRoutes);
app.use("/cart", cartRoutes);
app.use("/notifications", notificationRoutes);
app.use("/users", userRoutes);
app.use("/institutions", institutionsRoutes);
app.use("/upload", uploadRoutes);
app.use("/chat-requests", chatRequestRoutes);
app.use("/reviews", reviewRoutes);

app.get("/", (req, res) => res.json({ message: "UniHaul API is running!" }));

app.use((req, res) => res.status(404).json({ error: "Route not found." }));

app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  console.error(err);
  res.status(err.status || 500).json({
    error: isDev ? err.message : "Something went wrong.",
    ...(isDev && { stack: err.stack }),
  });
});

// ── Start (httpServer not app.listen) ─────────────────────────
import chalk from "chalk";

const PORT = process.env.PORT || 8000;
const isDev = process.env.NODE_ENV !== "production";

httpServer.listen(PORT, () => {
  const c = chalk;
  const W = 52;
  const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");

  const top = c.cyan("  ┌" + "─".repeat(W) + "┐");
  const mid = c.cyan("  ├" + "─".repeat(W) + "┤");
  const bot = c.cyan("  └" + "─".repeat(W) + "┘");
  const sep = c.cyan("  │") + " ".repeat(W) + c.cyan("│");

  const row = (label, val) => {
    const inner = `   ${label.padEnd(12)}${c.cyan("→")}  ${val}`;
    const padding = " ".repeat(Math.max(0, W - strip(inner).length));
    return c.cyan("  │") + inner + padding + c.cyan("│");
  };

  const title = "   UniHaul API";
  const titlePad = " ".repeat(Math.max(0, W - strip(title).length));

  console.log("");
  console.log(top);
  console.log(c.cyan("  │") + c.bold.white(title) + titlePad + c.cyan("│"));
  console.log(mid);
  console.log(row("API", c.white(`http://localhost:${PORT}`)));
  console.log(row("Socket.IO", c.white(`http://localhost:${PORT}`)));
  console.log(
    row("Env", isDev ? c.yellow("development") : c.green("production")),
  );
  console.log(row("Database", c.magenta("Neon PostgreSQL")));
  console.log(row("Routes", c.white("12 registered")));
  console.log(sep);
  console.log(row("CORS", c.cyan(allowedOrigins[0])));
  allowedOrigins.slice(1).forEach((origin) => {
    console.log(row("", c.cyan(origin)));
  });
  console.log(sep);
  console.log(row("PID", c.white(`${process.pid}`)));
  console.log(row("Started", c.green(new Date().toLocaleTimeString())));
  console.log(bot);
  console.log("");

  // Expire stale checkout reservations every minute.
  setInterval(() => {
    expireCheckoutSessions();
  }, 60 * 1000);

  // Clean up expired multi-media attachments every 12 hours.
  setInterval(
    () => {
      cleanupExpiredAttachments();
    },
    12 * 60 * 60 * 1000,
  );
});
