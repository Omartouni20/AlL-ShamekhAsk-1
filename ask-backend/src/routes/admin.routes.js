const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const { createEmployee, updateEmployee, dashboard, listInquiries } = require("../controllers/admin.controller");

router.use(auth, requireRole("ADMIN"));

router.post("/employees", createEmployee);
router.patch("/employees/:id", updateEmployee);
router.get("/dashboard", dashboard);

// ✅ NEW
router.get("/inquiries", listInquiries);

module.exports = router;
