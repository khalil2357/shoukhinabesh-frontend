import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import api from '../api/axios';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      <div className="max-w-sm w-full space-y-10">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter">Forgot Password</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Enter your email to receive an OTP
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-6 bg-white border border-neutral-100 p-10">
            <div className="text-3xl">✉️</div>
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest text-green-600">OTP Sent!</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Check your inbox at <strong>{email}</strong>. Use the OTP to reset your password.
              </p>
            </div>
            <Link
              to="/reset-password"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1 hover:opacity-60 transition-opacity"
            >
              Enter OTP <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
              <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
              <input
                type="email"
                required
                id="forgot-email"
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
                placeholder="YOUR@EMAIL.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

            <div className="space-y-4">
              <button type="submit" disabled={loading} className="w-full premium-btn">
                {loading ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                <Link to="/login" className="text-neutral-400 hover:text-brand-onyx transition-colors">Back to Sign In</Link>
                <Link to="/reset-password" className="text-neutral-400 hover:text-brand-onyx transition-colors">Have an OTP?</Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
