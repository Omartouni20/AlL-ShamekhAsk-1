const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const inquiryRoutes = require("./routes/inquiry.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// ✅ مهم علشان تشغيل الملفات من origin مختلف (مثلاً 8000/5173) بدون Blocked
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(cors());
app.use(morgan("dev"));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// static uploads
const uploadDir = process.env.UPLOAD_DIR || "uploads";

// ✅ CORS مخصوص لملفات uploads (audio/image) + السماح بـ Range (206 Partial Content)
app.use(
  "/uploads",
  cors({
    origin: true,
    credentials: false,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Range", "Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"]
  })
);

// ✅ رد على preflight لو حصل
app.options("/uploads/*", cors());

// ✅ static files
app.use("/uploads", express.static(path.join(process.cwd(), uploadDir)));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api", inquiryRoutes);
app.use("/api/admin", adminRoutes);

// global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
});

module.exports = app;
