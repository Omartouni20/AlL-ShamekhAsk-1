require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");

(async () => {
  try {
    await connectDB();

    const username = (process.env.SEED_ADMIN_USERNAME || "admin").toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const name = process.env.SEED_ADMIN_NAME || "Admin";

    const exists = await User.findOne({ username });
    if (exists) {
      console.log("✅ Admin already exists:", username);
      process.exit(0);
    }

    const passwordHash = await User.hashPassword(password);

    await User.create({
      name,
      username,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });

    console.log("✅ Admin created:", username, " / ", password);
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  }
})();
