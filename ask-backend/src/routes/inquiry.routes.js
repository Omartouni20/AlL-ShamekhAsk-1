const router = require("express").Router();

const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const limiter = require("../middleware/rateLimit");
const upload = require("../middleware/upload");

const {
  createPublicInquiry,
  listPendingInquiries,
  getInquiryForEmployee,
  setStatusInProgress,
  releaseInquiry
} = require("../controllers/inquiry.controller");

// Public intake (rate-limited)
// expects multipart/form-data: phone, text (optional), voice (optional file)
router.post("/public/inquiries", limiter, upload.single("voice"), createPublicInquiry);

// Employee: ✅ كل الموظفين يشوفوا كل الطلبات اللي في الانتظار
router.get("/employee/inquiries", auth, requireRole("EMPLOYEE", "ADMIN"), listPendingInquiries);
router.get("/employee/inquiries/:id", auth, requireRole("EMPLOYEE", "ADMIN"), getInquiryForEmployee);

// Take/Start Progress
router.patch("/employee/inquiries/:id/in-progress", auth, requireRole("EMPLOYEE", "ADMIN"), setStatusInProgress);

// Release: multipart/form-data with proofImage file + note
router.post(
  "/employee/inquiries/:id/release",
  auth,
  requireRole("EMPLOYEE", "ADMIN"),
  upload.single("proofImage"),
  releaseInquiry
);

module.exports = router;
