const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // ✅ بدل username (عشان DB عندك فيها email)
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    passwordHash: { type: String, required: true },

    // ✅ roles lowercase زي اللي عندك في DB
    role: { type: String, enum: ["admin", "employee"], default: "employee" },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model("User", UserSchema);
