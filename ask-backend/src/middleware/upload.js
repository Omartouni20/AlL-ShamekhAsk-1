const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`);
  }
});

function fileFilter(req, file, cb) {
  const field = file.fieldname;

  if (field === "voice") {
    // accept common browser formats
    const ok = ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp3", "audio/wav"].includes(file.mimetype);
    return cb(ok ? null : new Error("Invalid voice type"), ok);
  }

  if (field === "proofImage") {
    const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype);
    return cb(ok ? null : new Error("Invalid image type"), ok);
  }

  return cb(new Error("Unexpected file field"), false);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  }
});
