const User = require("../models/User");
const Inquiry = require("../models/Inquiry");

exports.createEmployee = async (req, res, next) => {
  try {
    const { name, username, password } = req.body || {};
    if (!name || !username || !password) return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ username: String(username).toLowerCase() });
    if (exists) return res.status(409).json({ message: "Username already exists" });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      username: String(username).toLowerCase(),
      passwordHash,
      role: "EMPLOYEE"
    });

    res.status(201).json({ id: user._id, name: user.name, username: user.username, role: user.role });
  } catch (e) {
    next(e);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const { name, isActive, password } = req.body || {};

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    if (user.role !== "EMPLOYEE") return res.status(400).json({ message: "Not an employee" });

    if (typeof name === "string") user.name = name.trim();
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (typeof password === "string" && password.trim().length >= 6) {
      user.passwordHash = await User.hashPassword(password.trim());
    }

    await user.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.dashboard = async (_req, res, next) => {
  try {
    const [total, pending, released, employees] = await Promise.all([
      Inquiry.countDocuments({}),
      Inquiry.countDocuments({ status: { $in: ["NEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"] } }),
      Inquiry.countDocuments({ status: "RELEASED" }),
User.find({ role: { $in: ["EMPLOYEE", "employee"] } })
  .select("name username email isActive role")
  .lean()
    ]);

    const perEmployee = await Inquiry.aggregate([
      { $match: { assignedEmployee: { $ne: null } } },
      {
        $group: {
          _id: "$assignedEmployee",
          assignedOrInProgress: {
            $sum: { $cond: [{ $in: ["$status", ["ASSIGNED", "IN_PROGRESS"]] }, 1, 0] }
          },
          released: { $sum: { $cond: [{ $eq: ["$status", "RELEASED"] }, 1, 0] } }
        }
      }
    ]);

    res.json({ total, pending, released, employees, perEmployee });
  } catch (e) {
    next(e);
  }
};

// ✅ NEW: list all inquiries for admin (with filters + pagination)
exports.listInquiries = async (req, res, next) => {
  try {
    const {
      status, // NEW|ASSIGNED|IN_PROGRESS|RELEASED|REOPENED
      q,      // phone search
      page = 1,
      limit = 20
    } = req.query || {};

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};

    if (typeof status === "string" && status.trim()) {
      filter.status = status.trim().toUpperCase();
    }

    if (typeof q === "string" && q.trim()) {
      // search by phone (simple contains)
      filter.phone = { $regex: q.trim(), $options: "i" };
    }

    const [total, items] = await Promise.all([
      Inquiry.countDocuments(filter),
      Inquiry.find(filter)
        .populate("assignedEmployee", "name username isActive role")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (e) {
    next(e);
  }
};
