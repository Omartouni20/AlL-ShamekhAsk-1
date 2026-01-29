const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
