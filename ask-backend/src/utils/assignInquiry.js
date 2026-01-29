const User = require("../models/User");
const Inquiry = require("../models/Inquiry");

async function pickLeastPendingEmployee() {
  const employees = await User.find({ role: "EMPLOYEE", isActive: true }).select("_id name");
  if (!employees.length) return null;

  // count pending per employee
  const pending = await Inquiry.aggregate([
    { $match: { status: { $in: ["ASSIGNED", "IN_PROGRESS"] }, assignedEmployee: { $ne: null } } },
    { $group: { _id: "$assignedEmployee", count: { $sum: 1 } } }
  ]);

  const map = new Map(pending.map((p) => [String(p._id), p.count]));

  let best = employees[0];
  let bestCount = map.get(String(best._id)) ?? 0;

  for (const e of employees) {
    const c = map.get(String(e._id)) ?? 0;
    if (c < bestCount) {
      best = e;
      bestCount = c;
    }
  }

  return best;
}

module.exports = { pickLeastPendingEmployee };
