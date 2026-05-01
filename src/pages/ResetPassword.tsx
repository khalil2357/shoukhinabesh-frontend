import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Invalid OTP or email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      <div className="max-w-sm w-full space-y-10">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter">Reset Password</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Enter your OTP and new password
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 bg-white border border-green-100 p-10">
            <div className="text-3xl">✅</div>
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">Password Updated!</p>
            <p className="text-xs text-neutral-500">Redirecting to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {[
              { key: 'email', label: 'Email Address', type: 'email', placeholder: 'YOUR@EMAIL.COM' },
              { key: 'otp', label: 'OTP Code', type: 'text', placeholder: '6-DIGIT CODE' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{label}</label>
                <input
                  type={type}
                  required
                  id={`reset-${key}`}
                  className="w-full bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}

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
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-brand-onyx transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

            <div className="space-y-4">
              <button type="submit" disabled={loading} className="w-full premium-btn">
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                <Link to="/login" className="text-neutral-400 hover:text-brand-onyx transition-colors">Back to Sign In</Link>
                <Link to="/forgot-password" className="text-neutral-400 hover:text-brand-onyx transition-colors">Resend OTP</Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
