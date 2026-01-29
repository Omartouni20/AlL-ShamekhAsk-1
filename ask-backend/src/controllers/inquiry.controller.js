const Inquiry = require("../models/Inquiry");

function fileUrl(req, filename) {
  const base = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

const PENDING_STATUSES = ["NEW", "ASSIGNED", "REOPENED"];

exports.createPublicInquiry = async (req, res, next) => {
  try {
    const { phone, text } = req.body || {};
    const voiceFile = req.file;

    if (!phone) return res.status(400).json({ message: "phone is required" });

    const hasText = text && String(text).trim().length > 0;
    const hasVoice = !!voiceFile;

    if (!hasText && !hasVoice) {
      return res.status(400).json({ message: "Either text or voice is required" });
    }

    // ✅ لا يوجد تخصيص لموظف عند الإنشاء
    const inquiry = await Inquiry.create({
      phone: String(phone).trim(),
      text: hasText ? String(text).trim() : "",
      voiceUrl: hasVoice ? fileUrl(req, voiceFile.filename) : "",
      status: "NEW",
      assignedEmployee: null
    });

    res.status(201).json({ inquiryId: inquiry._id, status: inquiry.status });
  } catch (e) {
    next(e);
  }
};

// ✅ NEW: كل الموظفين يشوفوا كل الطلبات اللي في الانتظار
exports.listPendingInquiries = async (req, res, next) => {
  try {
    const items = await Inquiry.find({ status: { $in: PENDING_STATUSES } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ items });
  } catch (e) {
    next(e);
  }
};

// ✅ NEW: الموظف يقدر يفتح تفاصيل الطلب لو pending أو هو اللي ماسكه
exports.getInquiryForEmployee = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).lean();
    if (!inquiry) return res.status(404).json({ message: "Not found" });

    const isPending = PENDING_STATUSES.includes(inquiry.status);
    const isMine = inquiry.assignedEmployee && String(inquiry.assignedEmployee) === String(req.user._id);

    if (!isPending && !isMine) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(inquiry);
  } catch (e) {
    next(e);
  }
};

// ✅ يمسك الطلب لأول موظف
exports.setStatusInProgress = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Not found" });

    if (inquiry.status === "RELEASED") return res.status(400).json({ message: "Already released" });

    // لو الطلب بالفعل IN_PROGRESS أو ASSIGNED لموظف آخر
    if (inquiry.assignedEmployee && String(inquiry.assignedEmployee) !== String(req.user._id)) {
      return res.status(409).json({ message: "Already taken by another employee" });
    }

    // يسمح فقط لو كان في الانتظار
    if (!PENDING_STATUSES.includes(inquiry.status) && inquiry.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "Cannot start progress from current status" });
    }

    inquiry.status = "IN_PROGRESS";
    inquiry.assignedEmployee = req.user._id;

    await inquiry.save();
    res.json({ ok: true, status: inquiry.status });
  } catch (e) {
    next(e);
  }
};

exports.releaseInquiry = async (req, res, next) => {
  try {
    const proof = req.file;
    const { note } = req.body || {};

    if (!proof) return res.status(400).json({ message: "proofImage is required" });

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Not found" });

    // ✅ لازم يكون هو اللي ماسك الطلب
    if (!inquiry.assignedEmployee || String(inquiry.assignedEmployee) !== String(req.user._id)) {
      return res.status(403).json({ message: "You must take the inquiry first" });
    }

    inquiry.status = "RELEASED";
    inquiry.releasedAt = new Date();
    inquiry.releasedBy = req.user._id;
    inquiry.releaseNote = note ? String(note).trim() : "";
    inquiry.proofImageUrl = fileUrl(req, proof.filename);

    await inquiry.save();

    res.json({ ok: true, status: inquiry.status, proofImageUrl: inquiry.proofImageUrl });
  } catch (e) {
    next(e);
  }
};
