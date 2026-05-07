import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/useAuthStore';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  // Firebase can pass the code via multiple parameter names
  const code = searchParams.get('oobCode') || searchParams.get('code') || searchParams.get('actionCode') || '';
  const mode = searchParams.get('mode');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const completeVerification = async () => {
      try {
        if (mode === 'resetPassword' || mode === 'reset-password') {
          navigate(`/reset-password?${searchParams.toString()}`, { replace: true });
          return;
        }

        // If there's a code parameter and mode is verifyEmail, use it to apply the action code
        if (code && (mode === 'verifyEmail' || !mode)) {
          await authService.verifyEmail(code);
          setSuccess(true);
          // Redirect to dashboard if authenticated, otherwise to login
          setTimeout(() => navigate(isAuthenticated ? '/dashboard' : '/login'), 2500);
        } else {
          // No code found - show the "open link from email" message
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error('Verification error:', err);
        setError(err instanceof Error ? err.message : 'Verification link is invalid or expired. Please try again.');
      } finally {
        if (loading) setLoading(false);
      }
    };

    completeVerification();
  }, [navigate, code, mode, loading, isAuthenticated, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      <div className="max-w-sm w-full space-y-10 text-center">
        <div className="w-12 h-12 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-serif font-bold tracking-tighter">Verify Email</h1>
        {loading ? (
          <p className="text-sm text-neutral-500">Verifying your email link...</p>
        ) : success ? (
          <div className="space-y-4 bg-white border border-green-100 p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">Email Verified!</p>
            <p className="text-xs text-neutral-500">Redirecting to sign in...</p>
          </div>
        ) : error ? (
          <div className="space-y-4 bg-white border border-rose-100 p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-rose-600">Verification Failed</p>
            <p className="text-xs text-neutral-500 leading-relaxed">{error}</p>
            <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1 hover:opacity-60 transition-opacity">
              Back to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-4 bg-white border border-neutral-100 p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-onyx">No verification code found</p>
            <p className="text-xs text-neutral-500 leading-relaxed">Open the verification link from your email again.</p>
            <Link to="/register" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1 hover:opacity-60 transition-opacity">
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
