import { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { apiLogin } from '../api';

interface EmployeeLoginProps {
  onLogin: (user: { id: string; name: string; role: 'employee' }) => void;
}

export function EmployeeLogin({ onLogin }: EmployeeLoginProps) {
  const [email, setEmail] = useState(''); // هنستخدمه كـ username (علشان نحافظ على نفس الشكل)
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(email, password); // backend expects username
      // data = { token, user: { id, name, username, role: "ADMIN"|"EMPLOYEE" } }
      localStorage.setItem('token', data.token);

      if (String(data?.user?.role || '').toUpperCase() !== 'EMPLOYEE') {
        setError('هذا الحساب ليس حساب موظف');
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      onLogin({ id: data.user.id, name: data.user.name, role: 'employee' });
    } catch (err: any) {
      // لو الباك بيرجع JSON error، fetch في api.ts بيرمي text.. فنعرضه زي ما هو
      setError(err?.message || 'فشل تسجيل الدخول');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] px-8 py-10 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">تسجيل دخول الموظفين</h2>
            <p className="text-blue-100 text-sm">سجل دخول لعرض الطلبات المخصصة لك</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="employee-email" className="block text-sm font-medium text-gray-900 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="employee-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="employee-password" className="block text-sm font-medium text-gray-900 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  id="employee-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-11 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white rounded-xl font-medium hover:from-[#3b82f6] hover:to-[#60a5fa] transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
