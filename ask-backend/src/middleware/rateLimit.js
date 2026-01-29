const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 20, // 20 req/min per IP
  standardHeaders: true,
  legacyHeaders: false
});
