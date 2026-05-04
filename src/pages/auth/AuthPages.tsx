import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.fromTo(imageRef.current,
      { xPercent: -100, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
    )
      .fromTo('.auth-reveal',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
        '-=0.6'
      );
  }, { scope: containerRef });

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
    <div ref={containerRef} className="min-h-screen flex flex-col lg:flex-row bg-[#fafaf8] overflow-hidden">
      {/* Left: Immersive Image */}
      <div ref={imageRef} className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen sticky top-0">
        <img
          src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury Jewelry"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-onyx/30 backdrop-blur-[1px]" />
        <div className="absolute bottom-20 left-20 text-brand-cream z-10 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold auth-reveal">The Vault</p>
          <h2 className="text-6xl font-serif font-bold tracking-tighter auth-reveal">
            Legacy in <br />
            <span className="italic font-normal">Every Reflection.</span>
          </h2>
        </div>
      </div>

      {/* Right: Login Form */}
      <div ref={formRef} className="flex-1 flex items-center justify-center px-6 py-20 md:px-20 lg:px-32">
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400 auth-reveal">Authentication Required</p>
            <h1 className="text-5xl font-serif font-bold tracking-tighter auth-reveal">Enter the Vault.</h1>
            <p className="text-sm text-neutral-500 font-light leading-relaxed auth-reveal">
              Access your curated collection and exclusive member benefits by signing in to your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8 auth-reveal">
              <div className="space-y-2 group">
                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  id="login-email"
                  className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    id="login-password"
                    className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-brand-onyx transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 animate-fadeIn">{error}</p>}

            <div className="space-y-8 auth-reveal">
              <button type="submit" id="login-submit" disabled={loading} className="w-full premium-btn flex items-center justify-center gap-3 py-5">
                {loading ? 'Validating Credentials...' : 'Gain Access'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  New to Shoukhinabesh? <Link to="/register" className="text-brand-onyx border-b border-brand-onyx pb-0.5 ml-2 hover:opacity-60 transition-opacity">Become a Member</Link>
                </p>
              </div>
            </div>
          </form>
        </div>
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

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.fromTo(imageRef.current,
      { xPercent: 100, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
    )
      .fromTo('.auth-reveal',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
        '-=0.6'
      );
  }, { scope: containerRef });

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
    <div ref={containerRef} className="min-h-screen flex flex-col lg:flex-row-reverse bg-[#fafaf8] overflow-hidden">
      {/* Right: Immersive Image (reversed) */}
      <div ref={imageRef} className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen sticky top-0">
        <img
          src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=2000&auto=format&fit=crop"
          alt="Luxury Jewelry"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-onyx/30 backdrop-blur-[1px]" />
        <div className="absolute bottom-20 left-20 text-brand-cream z-10 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold auth-reveal">Membership</p>
          <h2 className="text-6xl font-serif font-bold tracking-tighter auth-reveal">
            Curate your <br />
            <span className="italic font-normal">Destiny.</span>
          </h2>
        </div>
      </div>

      {/* Left: Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-20 md:px-20 lg:px-32">
        <div className="max-w-md w-full space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400 auth-reveal">The Membership</p>
            <h1 className="text-5xl font-serif font-bold tracking-tighter auth-reveal">Join the Circle.</h1>
            <p className="text-sm text-neutral-500 font-light leading-relaxed auth-reveal">
              Gain exclusive access to limited collection drops, bespoke services, and a community of connoisseurs.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6 auth-reveal">
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your name' },
                { key: 'email', label: 'Email Address', type: 'email', placeholder: 'name@example.com' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-2 group">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">
                    {label}
                  </label>
                  <input
                    type={type}
                    required
                    id={`register-${key}`}
                    className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200"
                    placeholder={placeholder}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  />
                </div>
              ))}

              <div className="space-y-2 group">
                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">
                  Secret Key (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    id="register-password"
                    className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-brand-onyx transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

            <div className="space-y-8 auth-reveal">
              <button type="submit" id="register-submit" disabled={loading} className="w-full premium-btn flex items-center justify-center gap-3 py-5">
                {loading ? 'Establishing Profile...' : 'Begin Journey'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
              <div className="text-center pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Already a member? <Link to="/login" className="text-brand-onyx border-b border-brand-onyx pb-0.5 ml-2 hover:opacity-60 transition-opacity">Sign In</Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
