const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const { login, register } = require("../controllers/auth.controller");

router.post("/login", login);
router.post("/register", auth, requireRole("ADMIN"), register);

module.exports = router;
