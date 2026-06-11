const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const friendRoutes = require("./routes/friendRoutes");
const statusRoutes = require("./routes/statusRoutes");
const { initSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

// Allow all Vercel deployment URLs for this project (production + previews + branch URLs)
const VERCEL_PATTERN = /^https:\/\/bluechat[a-z0-9-]*\.vercel\.app$/i;

const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true); // same-origin, curl, server-to-server
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  if (VERCEL_PATTERN.test(origin)) return callback(null, true);
  console.warn("CORS blocked origin:", origin);
  callback(new Error(`Origin ${origin} not allowed by CORS`));
};

const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  maxHttpBufferSize: 10 * 1024 * 1024,
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));
app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP" },
});
app.use("/api/", limiter);

// Make io + onlineUsers accessible from controllers
const onlineUsers = new Map();
app.set("io", io);
app.set("onlineUsers", onlineUsers);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/status", statusRoutes);

app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date() }));
app.get("/", (req, res) => res.json({ name: "BlueChat API", health: "/api/health" }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Server error" });
});

initSocket(io, onlineUsers);

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
