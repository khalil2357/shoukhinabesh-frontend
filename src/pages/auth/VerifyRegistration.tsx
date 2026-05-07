import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../../services/auth.service';

export const VerifyRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const code = searchParams.get('code') || '';
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    const verify = async () => {
      if (!email || !code) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        await authService.verifyRegistration(email, code);
        setStatus('success');
        setMessage('Your account has been verified successfully.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed.');
      }
    };

    verify();
  }, [email, code]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      <div className="max-w-md w-full text-center space-y-8 bg-white border border-neutral-100 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-2xl">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-brand-onyx animate-spin mx-auto" />
            <h1 className="text-2xl font-serif font-bold">Verifying Account</h1>
            <p className="text-sm text-neutral-400">Please wait while we activate your membership...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold">Verification Successful!</h1>
              <p className="text-sm text-neutral-500">{message}</p>
            </div>
            <div className="pt-4">
              <Link to="/login" className="premium-btn inline-flex items-center gap-2 px-8">
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold">Verification Failed</h1>
              <p className="text-sm text-neutral-500">{message}</p>
            </div>
            <div className="pt-4 flex flex-col gap-4">
              <Link to="/register" className="text-[10px] font-bold uppercase tracking-widest text-brand-onyx border-b border-brand-onyx pb-1 inline-block mx-auto hover:opacity-60 transition-opacity">
                Return to Registration
              </Link>
              <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
