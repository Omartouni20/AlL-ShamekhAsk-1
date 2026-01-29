import { useState, useRef, useEffect } from 'react';
import { Phone, MessageSquare, Mic, Square, Play, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { submitInquiry } from '../api';

export function CustomerPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioDuration(recordingTime);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch {
      setError('فشل الوصول إلى الميكروفون. الرجاء السماح بالوصول للميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioUrl) new Audio(audioUrl).play();
  };

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!phone.trim()) {
      setError('رقم الموبايل إجباري');
      return;
    }

    if (!message.trim() && !audioBlob) {
      setError('يجب إدخال رسالة نصية أو تسجيل صوتي');
      return;
    }

    try {
      await submitInquiry({
        phone: phone.trim(),
        text: message.trim() || undefined,
        voiceFile: audioBlob ? new File([audioBlob], 'voice.webm', { type: 'audio/webm' }) : undefined,
      });

      setSuccess(true);
      setPhone('');
      setMessage('');
      reRecord();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'فشل إرسال الطلب');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] px-6 py-8 sm:px-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">تقديم طلب جديد</h2>
          <p className="text-blue-100">نحن هنا لخدمتك. أرسل طلبك وسنتواصل معك قريباً</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">تم إرسال طلبك بنجاح!</p>
                <p className="text-sm text-green-700 mt-1">سيتم التواصل معك قريباً على رقم الموبايل</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium text-red-900">{error}</p>
            </div>
          )}

          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
              رقم الموبايل <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 5X XXX XXXX"
                className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                dir="ltr"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">اختر أحد الخيارين</span>
            </div>
          </div>

          {/* Text Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
              رسالة نصية
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
              disabled={!!audioBlob}
            />
            {audioBlob && (
              <p className="text-sm text-gray-500 mt-2">تم تسجيل رسالة صوتية. احذف التسجيل لكتابة رسالة نصية.</p>
            )}
          </div>

          {/* Audio Recording */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              أو سجل رسالة صوتية
            </label>

            <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
              {!audioBlob && !isRecording && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mic className="w-8 h-8 text-blue-600" />
                  </div>
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={!!message.trim()}
                    className="px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-medium hover:bg-[#3b82f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ابدأ التسجيل
                  </button>
                  {message.trim() && (
                    <p className="text-sm text-gray-500 mt-3">تم كتابة رسالة نصية. احذف النص للتسجيل الصوتي.</p>
                  )}
                </div>
              )}

              {isRecording && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <Mic className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4 font-mono">
                    {formatTime(recordingTime)}
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    إيقاف التسجيل
                  </button>
                </div>
              )}

              {audioBlob && !isRecording && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4 p-4 bg-white rounded-lg">
                    <div className="flex-1 text-right">
                      <p className="font-medium text-gray-900">تسجيل صوتي جاهز</p>
                      <p className="text-sm text-gray-500">المدة: {formatTime(audioDuration)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={playAudio}
                      className="flex-1 px-4 py-3 bg-[#1e3a8a] text-white rounded-xl font-medium hover:bg-[#3b82f6] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      تشغيل
                    </button>
                    <button
                      type="button"
                      onClick={reRecord}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      إعادة التسجيل
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-6 py-4 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white rounded-xl font-medium hover:from-[#3b82f6] hover:to-[#60a5fa] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30"
          >
            إرسال الطلب
          </button>
        </form>
      </div>
    </div>
  );
}
