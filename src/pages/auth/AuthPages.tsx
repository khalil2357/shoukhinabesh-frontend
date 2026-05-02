import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const auth = await authService.login({ email, password });
      const user = auth?.user ?? useAuthStore.getState().user;
      if (user?.role === 'ADMIN') navigate('/admin');
      else if (user?.role === 'VENDOR') navigate('/vendor');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      <div className="max-w-sm w-full space-y-10">
        <div className="text-center space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400">Welcome back</p>
          <h1 className="text-4xl font-serif font-bold tracking-tighter">Enter the Vault</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Secure access to your collection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
            <input
              type="email"
              required
              id="login-email"
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
              placeholder="YOUR@EMAIL.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Password</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                id="login-password"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-brand-onyx transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

          <div className="space-y-5">
            <button type="submit" id="login-submit" disabled={loading} className="w-full premium-btn">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
              <Link to="/register" className="text-neutral-400 hover:text-brand-onyx transition-colors">Create Account</Link>
              <Link to="/forgot-password" className="text-neutral-400 hover:text-brand-onyx transition-colors">Forgot Password?</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const auth = await authService.register(formData);
      const user = auth?.user ?? useAuthStore.getState().user;
      if (user?.role === 'VENDOR') navigate('/vendor');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafaf8]">
      <div className="max-w-sm w-full space-y-10">
        <div className="text-center space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400">New member</p>
          <h1 className="text-4xl font-serif font-bold tracking-tighter">Become a Member</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Join our exclusive jewellery community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'YOUR FULL NAME' },
            { key: 'email', label: 'Email Address', type: 'email', placeholder: 'YOUR@EMAIL.COM' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
              <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{label}</label>
              <input
                type={type}
                required
                id={`register-${key}`}
                className="w-full bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
                placeholder={placeholder}
                value={formData[key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              />
            </div>
          ))}

          <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Password (min 8 chars)</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                id="register-password"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-neutral-300"
                placeholder="MIN 8 CHARACTERS"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-brand-onyx transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">I want to</label>
            <div className="flex gap-3">
              {[{ val: 'CUSTOMER', label: 'Shop Pieces' }, { val: 'VENDOR', label: 'Sell Jewellery' }].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  id={`role-${val.toLowerCase()}`}
                  onClick={() => setFormData({ ...formData, role: val })}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.role === val ? 'border-brand-onyx bg-brand-onyx text-brand-cream' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

          <div className="space-y-5">
            <button type="submit" id="register-submit" disabled={loading} className="w-full premium-btn">
              {loading ? 'Creating Account...' : 'Join Now'}
            </button>
            <div className="text-center text-[9px] font-bold uppercase tracking-widest">
              <Link to="/login" className="text-neutral-400 hover:text-brand-onyx transition-colors">Already a member? Sign In</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
