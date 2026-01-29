const jwt = require("jsonwebtoken");
const User = require("../models/User");

function sign(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "username & password required" });

const user = await User.findOne({ email: String(username).toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = sign(user._id);
    res.json({ token, user: { id: user._id, name: user.name, username: user.username, role: user.role } });
  } catch (e) {
    next(e);
  }
};

// admin only (optional endpoint)
exports.register = async (req, res, next) => {
  try {
    const { name, username, password, role } = req.body || {};
    if (!name || !username || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ username: String(username).toLowerCase() });
    if (exists) return res.status(409).json({ message: "Username already exists" });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      username: String(username).toLowerCase(),
      passwordHash,
      role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE"
    });

    res.status(201).json({ id: user._id, name: user.name, username: user.username, role: user.role });
  } catch (e) {
    next(e);
  }
};
