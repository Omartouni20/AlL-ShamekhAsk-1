import { useEffect, useMemo, useRef, useState } from 'react';
import { Inbox, Phone, MessageSquare, Mic, Play, CheckCircle, Clock, Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { getMyInquiries, startProgress, releaseInquiry } from '../api';

type UiStatus = 'pending' | 'in-progress' | 'released';

type UiRequest = {
  id: string;
  customerPhone: string;
  message?: string;
  audioUrl?: string;
  audioDuration?: number; // غير متاح من الباك، هنسيبه 0
  status: UiStatus;
  createdAt: Date;
  updatedAt: Date;
  releaseScreenshot?: string; // proofImageUrl من الباك
  assignedTo?: string;
  assignedToName?: string;
};

interface EmployeeDashboardProps {
  userId: string;
  userName: string;
}

function mapStatus(status: string): UiStatus {
  const s = String(status || '').toUpperCase();
  if (s === 'IN_PROGRESS') return 'in-progress';
  if (s === 'RELEASED') return 'released';
  // NEW / ASSIGNED / REOPENED -> pending (نفس فكرة UI القديمة)
  return 'pending';
}

export function EmployeeDashboard({ userId, userName }: EmployeeDashboardProps) {
  const [selectedRequest, setSelectedRequest] = useState<UiRequest | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<UiRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMine = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await getMyInquiries(); // {items: [...]}
      const mapped: UiRequest[] = (res.items || []).map((it: any) => ({
        id: it._id,
        customerPhone: it.phone,
        message: it.text || undefined,
        audioUrl: it.voiceUrl || undefined,
        audioDuration: 0,
        status: mapStatus(it.status),
        createdAt: new Date(it.createdAt),
        updatedAt: new Date(it.updatedAt),
        releaseScreenshot: it.proofImageUrl || undefined,
      }));
      setItems(mapped);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myRequests = useMemo(
    () => items.filter((r) => r.status !== 'released'),
    [items],
  );

  const pendingCount = useMemo(() => myRequests.filter((r) => r.status === 'pending').length, [myRequests]);
  const inProgressCount = useMemo(() => myRequests.filter((r) => r.status === 'in-progress').length, [myRequests]);

  const getStatusBadge = (status: UiStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      released: 'bg-green-100 text-green-800 border-green-200',
    };
    const labels = {
      pending: 'قيد الانتظار',
      'in-progress': 'قيد المعالجة',
      released: 'تم الإنجاز',
    };
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRelease = async () => {
    if (!selectedRequest || !screenshot) return;

    try {
      await releaseInquiry(selectedRequest.id, screenshot);
      setSelectedRequest(null);
      setScreenshot(null);
      setScreenshotPreview(null);
      await fetchMine();
    } catch (e: any) {
      setError(e?.message || 'فشل إنهاء الطلب');
    }
  };

  const handleStartProgress = async (request: UiRequest) => {
    try {
      await startProgress(request.id);
      setSelectedRequest({ ...request, status: 'in-progress', updatedAt: new Date() });
      await fetchMine();
    } catch (e: any) {
      setError(e?.message || 'فشل بدء المعالجة');
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً، {userName}</h1>
          <p className="text-gray-600">إليك الطلبات المخصصة لك</p>
        </div>
        <button
          onClick={fetchMine}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          تحديث
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-900">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">قيد الانتظار</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">قيد المعالجة</p>
              <p className="text-3xl font-bold text-[#3b82f6]">{inProgressCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Inbox className="w-6 h-6 text-[#3b82f6]" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            صندوق الوارد
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-600 font-medium">جاري تحميل الطلبات...</p>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">لا توجد طلبات مخصصة لك حالياً</p>
            <p className="text-sm text-gray-500 mt-1">سيتم إشعارك عند تعيين طلبات جديدة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {myRequests.map((request) => (
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
                        {request.customerPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDate(request.createdAt)}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {request.message && (
                  <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{request.message}</p>
                  </div>
                )}

                {request.audioUrl && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-3 mt-2">
                    <Mic className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>رسالة صوتية</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] px-6 py-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">تفاصيل الطلب</h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setScreenshot(null);
                  setScreenshotPreview(null);
                }}
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
                  {selectedRequest.customerPhone}
                </p>
              </div>

              {selectedRequest.message && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">الرسالة النصية</p>
                  </div>
                  <p className="text-gray-900">{selectedRequest.message}</p>
                </div>
              )}

              {selectedRequest.audioUrl && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">رسالة صوتية</p>
                    </div>
                    <button
                      onClick={() => playAudio(selectedRequest.audioUrl!)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      تشغيل
                    </button>
                  </div>
                </div>
              )}

              {/* Upload proof */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-gray-700" />
                  <p className="font-medium text-gray-900">رفع لقطة شاشة الإثبات</p>
                </div>

                <div className="space-y-4">
                  <div>
                    {!screenshotPreview ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="font-medium text-gray-900 mb-1">اضغط لرفع لقطة شاشة</p>
                        <p className="text-sm text-gray-500">PNG, JPG أو JPEG</p>
                      </button>
                    ) : (
                      <div className="relative">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="w-full rounded-xl border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute top-2 left-2 w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <button
                    onClick={handleRelease}
                    disabled={!screenshot || selectedRequest.status === 'pending'}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    title={selectedRequest.status === 'pending' ? 'ابدأ المعالجة أولاً' : ''}
                  >
                    <CheckCircle className="w-5 h-5" />
                    تأكيد الإنجاز
                  </button>
                </div>
              </div>

              {selectedRequest.status === 'pending' && (
                <button
                  onClick={() => handleStartProgress(selectedRequest)}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  بدء معالجة الطلب
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
