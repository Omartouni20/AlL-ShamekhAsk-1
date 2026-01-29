const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getToken() {
  const token = localStorage.getItem("token") || "";
  console.log("Token:", token); // لتتبع قيمة التوكن
  return token;
}

async function readError(res: Response) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    console.log("Error JSON Response:", j); // لتتبع الرد عند حدوث خطأ
    return j?.message || text || "Request failed";
  } catch {
    console.log("Error Response Text:", text); // لتتبع النص الخام عند حدوث خطأ
    return text || "Request failed";
  }
}

export async function apiLogin(username: string, password: string) {
  console.log("Logging in with:", { username, password }); // لتتبع البيانات المرسلة
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Login error:", errorMessage); // لتتبع الأخطاء في التسجيل
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Login success:", data); // لتتبع البيانات المستلمة بعد تسجيل الدخول
  return data; // {token, user}
}

export async function submitInquiry(payload: { phone: string; text?: string; voiceFile?: File }) {
  console.log("Submitting inquiry:", payload); // لتتبع البيانات المرسلة
  const fd = new FormData();
  fd.append("phone", payload.phone);
  if (payload.text) fd.append("text", payload.text);
  if (payload.voiceFile) fd.append("voice", payload.voiceFile);

  const res = await fetch(`${API_BASE}/api/public/inquiries`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Inquiry submission error:", errorMessage); // لتتبع الأخطاء عند تقديم الاستفسار
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Inquiry submitted:", data); // لتتبع البيانات المستلمة بعد تقديم الاستفسار
  return data; // {inquiryId, status}
}

export async function getMyInquiries() {
  const token = getToken();
  console.log("Fetching inquiries with token:", token); // لتتبع التوكن أثناء جلب الاستفسارات
  const res = await fetch(`${API_BASE}/api/employee/inquiries`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error fetching inquiries:", errorMessage); // لتتبع الأخطاء عند جلب الاستفسارات
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Inquiries fetched:", data); // لتتبع البيانات المستلمة
  return data; // {items: [...]}
}

export async function startProgress(id: string) {
  const token = getToken();
  console.log("Starting progress for inquiry:", id, "with token:", token); // لتتبع البيانات أثناء بدء التقدم
  const res = await fetch(`${API_BASE}/api/employee/inquiries/${id}/in-progress`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error starting progress:", errorMessage); // لتتبع الأخطاء أثناء بدء التقدم
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Progress started:", data); // لتتبع البيانات المستلمة بعد بدء التقدم
  return data;
}

export async function releaseInquiry(id: string, proofImage: File, note?: string) {
  const token = getToken();
  console.log("Releasing inquiry:", id, "with token:", token, "and proof image:", proofImage); // لتتبع البيانات أثناء إطلاق الاستفسار
  const fd = new FormData();
  fd.append("proofImage", proofImage);
  if (note) fd.append("note", note);

  const res = await fetch(`${API_BASE}/api/employee/inquiries/${id}/release`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error releasing inquiry:", errorMessage); // لتتبع الأخطاء أثناء إطلاق الاستفسار
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Inquiry released:", data); // لتتبع البيانات المستلمة بعد إطلاق الاستفسار
  return data;
}

// -------------------------
// ✅ ADMIN APIs
// -------------------------

export async function adminDashboard() {
  const token = getToken();
  console.log("Fetching admin dashboard with token:", token); // لتتبع التوكن أثناء جلب لوحة تحكم المسؤول
  const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error fetching admin dashboard:", errorMessage); // لتتبع الأخطاء عند جلب لوحة تحكم المسؤول
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Admin dashboard data:", data); // لتتبع البيانات المستلمة من لوحة تحكم المسؤول
  return data; // {total,pending,released,employees,perEmployee}
}

export async function adminListInquiries(params?: {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const token = getToken();
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  console.log("Fetching admin inquiries with params:", qs.toString()); // لتتبع المعاملات أثناء جلب الاستفسارات الإدارية
  const res = await fetch(`${API_BASE}/api/admin/inquiries?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error fetching admin inquiries:", errorMessage); // لتتبع الأخطاء عند جلب الاستفسارات الإدارية
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Admin inquiries fetched:", data); // لتتبع البيانات المستلمة بعد جلب الاستفسارات الإدارية
  return data; // {items,total,page,limit}
}

export async function adminCreateEmployee(payload: { name: string; username: string; password: string }) {
  const token = getToken();
  console.log("Creating admin employee with payload:", payload); // لتتبع البيانات أثناء إنشاء الموظف الإداري
  const res = await fetch(`${API_BASE}/api/admin/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error creating admin employee:", errorMessage); // لتتبع الأخطاء أثناء إنشاء الموظف الإداري
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Admin employee created:", data); // لتتبع البيانات المستلمة بعد إنشاء الموظف الإداري
  return data; // {id,name,username,role}
}

export async function adminUpdateEmployee(
  id: string,
  payload: { name?: string; isActive?: boolean; password?: string }
) {
  const token = getToken();
  console.log("Updating admin employee:", id, "with payload:", payload); // لتتبع البيانات أثناء تحديث الموظف الإداري
  const res = await fetch(`${API_BASE}/api/admin/employees/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorMessage = await readError(res);
    console.error("Error updating admin employee:", errorMessage); // لتتبع الأخطاء أثناء تحديث الموظف الإداري
    throw new Error(errorMessage);
  }
  const data = await res.json();
  console.log("Admin employee updated:", data); // لتتبع البيانات المستلمة بعد تحديث الموظف الإداري
  return data; // {ok:true}
}
