/**
 * Admin Secure Login Page with mandatory initial password reset enforcement
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, mustChangePassword, changePassword, navigate } = useApp();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forced password change form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('لطفاً رمز عبور را وارد نمایید.');
      return;
    }

    setLoading(true);
    const res = loginAdmin(password);
    setLoading(false);

    if (!res.success) {
      setError('رمز عبور مدیر نادرست است.');
    }
  };

  const handleForceChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ نویسه باشد.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('تکرار رمز عبور جدید مطابقت ندارد.');
      return;
    }

    const res = changePassword(password, newPassword);
    if (res.success) {
      setChangeSuccess(true);
    } else {
      setError(res.error || 'خطا در تغییر رمز عبور.');
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to public link */}
      <button
        onClick={() => navigate({ type: 'home' })}
        className="absolute top-6 right-6 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>بازگشت به سایت کلاسی</span>
      </button>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <Shield className="w-7 h-7" />
        </div>

        {!mustChangePassword ? (
          /* Normal Login Form */
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-white">ورود به پنل مدیریت دبیر</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                برای مدیریت جزوه‌ها، اطلاعیه‌ها، امتحانات و پاکسازی حافظه وارد شوید
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نام کاربری
                </label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-400 text-xs font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رمز عبور مدیریت
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="رمز عبور را وارد کنید..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all mt-2"
              >
                {loading ? 'در حال بررسی...' : 'ورود به پنل'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-500 block">
                رمز عبور اولیه تستی: <code className="text-slate-400">ClassNotes@1405!</code>
              </span>
            </div>
          </>
        ) : (
          /* Mandatory First-Time Password Reset Screen */
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold mb-3">
                <KeyRound className="w-3.5 h-3.5" /> تغییر اجباری رمز عبور اولیه
              </div>
              <h1 className="text-lg font-bold text-white">امنیت حساب کاربری مدیر</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                به دلایل امنیتی، پس از اولین ورود تغییر رمز عبور پیش‌فرض اجباری است.
              </p>
            </div>

            {changeSuccess ? (
              <div className="text-center p-6 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">رمز عبور با موفقیت تغییر یافت</h3>
                <p className="text-xs text-emerald-300">در حال انتقال به پیشخوان مدیریت...</p>
              </div>
            ) : (
              <form onSubmit={handleForceChangePassword} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رمز عبور جدید (حداقل ۸ نویسه)
                  </label>
                  <input
                    type="password"
                    placeholder="رمز جدید..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    تکرار رمز عبور جدید
                  </label>
                  <input
                    type="password"
                    placeholder="تکرار رمز جدید..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/25 transition-all mt-2"
                >
                  ذخیره رمز جدید و ورود به پنل
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
