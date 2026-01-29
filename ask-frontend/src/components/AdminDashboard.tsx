import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Inbox,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  UserPlus,
  Mail,
  Trash2,
  Phone,
  MessageSquare,
  Mic,
  AlertCircle,
  Search,
  RefreshCcw,
  Play,
} from 'lucide-react';

import { adminCreateEmployee, adminDashboard, adminListInquiries, adminUpdateEmployee } from '../api';

type UiStatus = 'pending' | 'in-progress' | 'released';

type AdminEmployee = {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
};

type AdminInquiry = {
  id: string;
  phone: string;
  text?: string;
  voiceUrl?: string;
  status: UiStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedToName?: string;
  proofImageUrl?: string;
  releaseNote?: string;
};

function mapStatus(s: string): UiStatus {
  const up = String(s || '').toUpperCase();
  if (up === 'IN_PROGRESS') return 'in-progress';
  if (up === 'RELEASED') return 'released';
  return 'pending'; // NEW/ASSIGNED/REOPENED
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'requests'>('dashboard');

  const [error, setError] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Dashboard data
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [released, setReleased] = useState(0);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [perEmployee, setPerEmployee] = useState<
    Array<{ _id: string; assignedOrInProgress: number; released: number }>
  >([]);

  // Inquiries tab
  const [selectedRequest, setSelectedRequest] = useState<AdminInquiry | null>(null);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [inqTotal, setInqTotal] = useState(0);
  const [inqPage, setInqPage] = useState(1);
  const [inqLimit] = useState(20);

  const [statusFilter, setStatusFilter] = useState<string>(''); // backend status
  const [searchQ, setSearchQ] = useState<string>('');

  // Add employee modal
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empSaving, setEmpSaving] = useState(false);

  const inProgressCount = useMemo(() => {
    // backend dashboard doesn't return in-progress separately; we infer:
    // pending includes NEW/ASSIGNED/IN_PROGRESS/REOPENED; so in-progress isn't isolated.
    // UI القديم كان بيحسب in-progress من البيانات، هنا هنخليها 0 في الداشبورد cards؟
    // الأفضل: نعرضها كـ (pending - NEW/ASSIGNED/REOPENED?) مش متاح.
    // فهنحافظ على نفس البلوك لكن نحطه = 0 (أو نخليه pending؟).
    return 0;
  }, []);

  const fetchDashboard = async () => {
    setError('');
    setLoadingDashboard(true);
    try {
      const d = await adminDashboard();
      setTotal(d.total || 0);
      setPending(d.pending || 0);
      setReleased(d.released || 0);

      const emps: AdminEmployee[] = (d.employees || []).map((e: any) => ({
        id: e._id || e.id,
        name: e.name,
username: e.username || e.email || '',
        isActive: !!e.isActive,
      }));
      setEmployees(emps);

      setPerEmployee((d.perEmployee || []).map((p: any) => ({
        _id: String(p._id),
        assignedOrInProgress: Number(p.assignedOrInProgress || 0),
        released: Number(p.released || 0),
      })));
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل لوحة المعلومات');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchInquiries = async (page = inqPage) => {
    setError('');
    setLoadingInquiries(true);
    try {
      const res = await adminListInquiries({
        status: statusFilter || undefined,
        q: searchQ || undefined,
        page,
        limit: inqLimit,
      });

      const mapped: AdminInquiry[] = (res.items || []).map((it: any) => ({
        id: it._id,
        phone: it.phone,
        text: it.text || undefined,
        voiceUrl: it.voiceUrl || undefined,
        status: mapStatus(it.status),
        createdAt: new Date(it.createdAt),
        updatedAt: new Date(it.updatedAt),
        assignedToName: it.assignedEmployee?.name || undefined,
        proofImageUrl: it.proofImageUrl || undefined,
        releaseNote: it.releaseNote || undefined,
      }));

      setInquiries(mapped);
      setInqTotal(res.total || 0);
      setInqPage(res.page || page);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل الطلبات');
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') fetchInquiries(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const getStatusBadge = (status: UiStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      released: 'bg-green-100 text-green-800 border-green-200',
    } as const;

    const labels = {
      pending: 'قيد الانتظار',
      'in-progress': 'قيد المعالجة',
      released: 'تم الإنجاز',
    } as const;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const perfMap = useMemo(() => {
    const m = new Map<string, { assignedOrInProgress: number; released: number }>();
    for (const p of perEmployee) m.set(p._id, { assignedOrInProgress: p.assignedOrInProgress, released: p.released });
    return m;
  }, [perEmployee]);

  const handleDeactivate = async (empId: string) => {
    setError('');
    try {
      await adminUpdateEmployee(empId, { isActive: false });
      await fetchDashboard();
    } catch (e: any) {
      setError(e?.message || 'فشل تعطيل الموظف');
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!empName.trim() || !empUsername.trim() || !empPassword.trim()) {
      setError('أدخل الاسم واسم المستخدم وكلمة المرور');
      return;
    }
    if (empPassword.trim().length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف أو أكثر');
      return;
    }

    setEmpSaving(true);
    try {
      await adminCreateEmployee({
        name: empName.trim(),
        username: empUsername.trim(),
        password: empPassword.trim(),
      });

      setShowAddEmployee(false);
      setEmpName('');
      setEmpUsername('');
      setEmpPassword('');
      await fetchDashboard();
    } catch (err: any) {
      setError(err?.message || 'فشل إضافة الموظف');
    } finally {
      setEmpSaving(false);
    }
  };
const normalizeMediaUrl = (url: string) => {
  if (!url) return url;
  return url.replace("http://localhost:8000", import.meta.env.VITE_API_BASE || "http://localhost:3000");
};


const playAudio = async (url: string) => {
  try {
    const audio = new Audio(normalizeMediaUrl(url));
    await audio.play();
  } catch (e) {
    setError("المتصفح لم يستطع تشغيل الملف الصوتي (تأكد من الرابط/الصيغة).");
  }
};


  const pagesCount = Math.max(Math.ceil(inqTotal / inqLimit), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة تحكم الإدارة</h1>
          <p className="text-gray-600">إدارة شاملة للنظام والموظفين والطلبات</p>
        </div>
        <button
          onClick={() => {
            fetchDashboard();
            if (activeTab === 'requests') fetchInquiries(inqPage);
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-900">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            لوحة المعلومات
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'employees'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            الموظفين
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'requests'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Inbox className="w-5 h-5" />
            جميع الطلبات
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-[#1e3a8a]" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
              <p className="text-3xl font-bold text-gray-900">{loadingDashboard ? '…' : total}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">قيد الانتظار</p>
              <p className="text-3xl font-bold text-yellow-600">{loadingDashboard ? '…' : pending}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">قيد المعالجة</p>
              <p className="text-3xl font-bold text-blue-600">{loadingDashboard ? '…' : inProgressCount}</p>
              <p className="text-xs text-gray-500 mt-1">* غير متاح تفصيلاً من الباك الحالي</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">تم الإنجاز</p>
              <p className="text-3xl font-bold text-green-600">{loadingDashboard ? '…' : released}</p>
            </div>
          </div>

          {/* Employee Performance */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                أداء الموظفين
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {employees.map((employee) => {
                  const p = perfMap.get(employee.id) || { assignedOrInProgress: 0, released: 0 };
                  const totalForEmp = p.assignedOrInProgress + p.released;

                  return (
                    <div key={employee.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{employee.name}</p>
                            <p className="text-sm text-gray-500" dir="ltr">
                              {employee.username}
                              {!employee.isActive && (
                                <span className="ml-2 inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  معطل
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-2xl font-bold text-gray-900">{totalForEmp}</p>
                          <p className="text-xs text-gray-500">طلب</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                          <p className="text-lg font-bold text-blue-600">{p.assignedOrInProgress}</p>
                          <p className="text-xs text-blue-700">مخصص/معالجة</p>
                        </div>
                        <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                          <p className="text-lg font-bold text-green-600">{p.released}</p>
                          <p className="text-xs text-green-700">منجز</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {employees.length === 0 && (
                  <div className="text-center py-10 text-gray-600">لا يوجد موظفين بعد</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                إدارة الموظفين
              </h2>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                إضافة موظف
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <div key={employee.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {employee.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                          {employee.name}
                          {!employee.isActive && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              معطل
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500" dir="ltr">
                          <Mail className="w-4 h-4" />
                          {employee.username}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {(perfMap.get(employee.id)?.assignedOrInProgress || 0) +
                          (perfMap.get(employee.id)?.released || 0)}
                      </p>
                      <p className="text-xs text-gray-500">طلب</p>
                    </div>

                    <button
                      onClick={() => handleDeactivate(employee.id)}
                      disabled={!employee.isActive}
                      className="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title="تعطيل الموظف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {employees.length === 0 && (
                <div className="p-10 text-center text-gray-600">لا يوجد موظفين</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              جميع الطلبات ({loadingInquiries ? '…' : inqTotal})
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="بحث برقم الهاتف..."
                  className="w-full sm:w-56 pr-9 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  dir="ltr"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">كل الحالات</option>
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="REOPENED">REOPENED</option>
                <option value="RELEASED">RELEASED</option>
              </select>

              <button
                onClick={() => fetchInquiries(1)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                تطبيق
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loadingInquiries ? (
              <div className="p-10 text-center text-gray-600">جاري تحميل الطلبات...</div>
            ) : inquiries.length === 0 ? (
              <div className="p-10 text-center text-gray-600">لا توجد طلبات</div>
            ) : (
              inquiries.map((request) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900" dir="ltr">
                          {request.phone}
                        </span>
                      </div>

                      {request.assignedToName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                            {request.assignedToName.charAt(0)}
                          </div>
                          <span>{request.assignedToName}</span>
                        </div>
                      )}

                      <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                    </div>

                    {getStatusBadge(request.status)}
                  </div>

                  {request.text && (
                    <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2">{request.text}</p>
                    </div>
                  )}

                  {request.voiceUrl && (
                    <div className="flex items-center justify-between gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>رسالة صوتية</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(request.voiceUrl!);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        تشغيل
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              صفحة {inqPage} من {pagesCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInquiries(Math.max(inqPage - 1, 1))}
                disabled={inqPage <= 1}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => fetchInquiries(Math.min(inqPage + 1, pagesCount))}
                disabled={inqPage >= pagesCount}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">تفاصيل الطلب</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">الحالة:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">رقم العميل</p>
                <p className="font-medium text-gray-900" dir="ltr">
                  {selectedRequest.phone}
                </p>
              </div>

              {selectedRequest.assignedToName && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">الموظف المخصص</p>
                  <p className="font-medium text-gray-900">{selectedRequest.assignedToName}</p>
                </div>
              )}

              {selectedRequest.text && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">الرسالة النصية</p>
                  </div>
                  <p className="text-gray-900">{selectedRequest.text}</p>
                </div>
              )}

              {selectedRequest.voiceUrl && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">رسالة صوتية</p>
                    </div>
                    <button
                      onClick={() => playAudio(selectedRequest.voiceUrl!)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      تشغيل
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.proofImageUrl && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">إثبات الإنجاز</p>
                  </div>
                  <a
                    href={selectedRequest.proofImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-green-800 underline"
                  >
                    فتح صورة الإثبات
                  </a>
                  {selectedRequest.releaseNote && (
                    <p className="text-sm text-gray-700 mt-2">ملاحظة: {selectedRequest.releaseNote}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 mb-1">تاريخ الإنشاء</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 mb-1">آخر تحديث</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedRequest.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">إضافة موظف</h3>
              <button
                onClick={() => setShowAddEmployee(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الاسم</label>
                <input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="اسم الموظف"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">اسم المستخدم (username)</label>
                <input
                  value={empUsername}
                  onChange={(e) => setEmpUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="employee1"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={empSaving}
                className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {empSaving ? 'جاري الحفظ...' : 'حفظ'}
              </button>

              <p className="text-xs text-gray-500">
                * كلمة المرور لازم تكون 6 أحرف أو أكثر
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
