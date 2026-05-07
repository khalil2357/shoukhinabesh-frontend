import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import gsap from 'gsap';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Firebase can pass the code via multiple parameter names
  const oobCode = searchParams.get('oobCode') || searchParams.get('code') || searchParams.get('actionCode') || '';
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(Boolean(oobCode));

  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'verifyEmail') {
      navigate(`/verify-email?${searchParams.toString()}`, { replace: true });
      return;
    }

    if (!oobCode) {
      setReady(false);
      return;
    }
    setReady(true);
  }, [oobCode, searchParams, navigate]);

  const showToast = (title: string, desc: string, type: 'success' | 'error') => {
    setToastMsg({ title, desc, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setTimeout(() => {
      const el = document.querySelector('.premium-toast');
      if (el) {
        gsap.killTweensOf(el);
        gsap.fromTo(el, { y: 50, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' });
      }
    }, 10);

    toastTimerRef.current = setTimeout(() => {
      const el = document.querySelector('.premium-toast');
      if (el) {
        gsap.to(el, { y: 20, opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in', onComplete: () => setToastMsg(null) });
      } else {
        setToastMsg(null);
      }
    }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!oobCode) {
      setError('Missing reset code. Open the link from your email again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(oobCode, newPassword);

      // Show success toast
      showToast('Password updated successfully', 'Your account security has been updated. Please sign in with your new password.', 'success');
      
      // Force local + Firebase sign-out to clear everything
      await authService.logout();
      useAuthStore.getState().logout();
      useAuthStore.getState().clearAuth();

      setSuccess(true);
      // Wait for toast to be seen before redirecting
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reset password. Please request a new link.');
      showToast('Reset Failed', err instanceof Error ? err.message : 'Link is invalid or expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`premium-toast fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 bg-white border ${toastMsg.type === 'success' ? 'border-green-100' : 'border-rose-100'} shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-xl min-w-[320px]`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toastMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
            {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-onyx">{toastMsg.title}</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">{toastMsg.desc}</p>
          </div>
        </div>
      )}

      <div className="max-w-sm w-full space-y-10">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter">Reset Password</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            {oobCode ? 'Set a new password and verify your identity' : 'Open the reset link from your email'}
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 bg-white border border-green-100 p-10">
            <div className="text-3xl">✅</div>
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">Password Updated!</p>
            <p className="text-xs text-neutral-500">Session cleared. Redirecting to sign in...</p>
          </div>
        ) : !ready ? (
          <div className="text-center space-y-4 bg-white border border-neutral-100 p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-onyx">Reset link required</p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Use the reset link sent to your email. If you need a new one, go back to forgot password.
            </p>
            <Link to="/forgot-password" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1 hover:opacity-60 transition-opacity">
              Request New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">New Password</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    id="reset-password"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
                    placeholder="MIN 8 CHARACTERS"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-brand-onyx transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

            <div className="space-y-4">
              <button type="submit" disabled={loading} className="w-full premium-btn">
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                <Link to="/login" className="text-neutral-400 hover:text-brand-onyx transition-colors">Back to Sign In</Link>
                <Link to="/forgot-password" className="text-neutral-400 hover:text-brand-onyx transition-colors">Request New Link</Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
