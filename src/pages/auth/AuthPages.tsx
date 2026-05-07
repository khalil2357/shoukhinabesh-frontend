import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Star } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && authUser) {
      let target = '/dashboard';
      if (authUser.role === 'ADMIN') target = '/admin';
      else if (authUser.role === 'VENDOR') target = '/vendor';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, authUser, navigate]);

  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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
        gsap.to(el, {
          y: 20,
          opacity: 0,
          scale: 0.95,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => setToastMsg(null),
        });
      } else {
        setToastMsg(null);
      }
    }, 4000);
  };

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(imageRef.current, { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out' })
      .fromTo('.auth-reveal', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.6');
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = await authService.login({ email, password });
      showToast('Access Granted', 'Login successful. Redirecting...', 'success');
      
      const user = auth?.user;
      let target = '/dashboard';
      if (user?.role === 'ADMIN') target = '/admin';
      else if (user?.role === 'VENDOR') target = '/vendor';
      
      setTimeout(() => navigate(target, { replace: true }), 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      showToast('Access Denied', message, 'error');
      setError(message);
      setLoading(false);
    } finally {
      // If we are still on the page after 2 seconds, reset loading
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col lg:flex-row bg-[#fafaf8] overflow-hidden">
      {toastMsg && (
        <div className="premium-toast fixed bottom-8 right-8 z-50 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-neutral-100 p-6 flex items-start gap-5 max-w-sm">
          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toastMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-500'}`}>
            {toastMsg.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-onyx">{toastMsg.title}</h4>
            <p className="text-xs text-neutral-500 mt-2 font-light leading-relaxed">{toastMsg.desc}</p>
          </div>
        </div>
      )}

      <div ref={imageRef} className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen sticky top-0">
        <img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=2000&auto=format&fit=crop" alt="Luxury Jewelry" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand-onyx/30 backdrop-blur-[1px]" />
        <div className="absolute bottom-20 left-20 text-brand-cream z-10 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold auth-reveal">The Vault</p>
          <h2 className="text-6xl font-serif font-bold tracking-tighter auth-reveal">Legacy in <br /><span className="italic font-normal">Every Reflection.</span></h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-20 md:px-20 lg:px-32">
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400 auth-reveal">Authentication Required</p>
            <h1 className="text-5xl font-serif font-bold tracking-tighter auth-reveal">Enter the Vault.</h1>
            <p className="text-sm text-neutral-500 font-light leading-relaxed auth-reveal">Sign in with your Firebase account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8 auth-reveal">
              <div className="space-y-2 group">
                <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">Email Address</label>
                <input type="email" required id="login-email" className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">Password</label>
                  <Link to="/forgot-password" className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors">Forgot?</Link>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required id="login-password" className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
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
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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
        gsap.to(el, {
          y: 20,
          opacity: 0,
          scale: 0.95,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => setToastMsg(null),
        });
      } else {
        setToastMsg(null);
      }
    }, 4000);
  };

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(imageRef.current, { xPercent: 100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.2, ease: 'power4.out' })
      .fromTo('.auth-reveal', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.6');
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
      setSent(true);
      showToast('Verification Email Sent', 'Check your inbox to verify your account.', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col lg:flex-row-reverse bg-[#fafaf8] overflow-hidden">
      {toastMsg && (
        <div className="premium-toast fixed bottom-8 right-8 z-50 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-neutral-100 p-6 flex items-start gap-5 max-w-sm">
          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toastMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-500'}`}>
            {toastMsg.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-onyx">{toastMsg.title}</h4>
            <p className="text-xs text-neutral-500 mt-2 font-light leading-relaxed">{toastMsg.desc}</p>
          </div>
        </div>
      )}

      <div ref={imageRef} className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen sticky top-0">
        <img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=2000&auto=format&fit=crop" alt="Luxury Jewelry" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brand-onyx/30 backdrop-blur-[1px]" />
        <div className="absolute bottom-20 left-20 text-brand-cream z-10 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold auth-reveal">Membership</p>
          <h2 className="text-6xl font-serif font-bold tracking-tighter auth-reveal">Curate your <br /><span className="italic font-normal">Destiny.</span></h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-20 md:px-20 lg:px-32">
        <div className="max-w-md w-full space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400 auth-reveal">The Membership</p>
            <h1 className="text-5xl font-serif font-bold tracking-tighter auth-reveal">Join the Circle.</h1>
            <p className="text-sm text-neutral-500 font-light leading-relaxed auth-reveal">Create your Firebase account and verify your email to continue.</p>
          </div>

          {sent ? (
            <div className="bg-white border border-neutral-100 p-8 space-y-4 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-green-600">Verification email sent</p>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Check <strong>{formData.email}</strong> for the verification link. Once verified, return to sign in.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1 hover:opacity-60 transition-opacity">
                Go to Login <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6 auth-reveal">
                {[
                  { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your name' },
                  { key: 'email', label: 'Email Address', type: 'email', placeholder: 'name@example.com' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className="space-y-2 group">
                    <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">{label}</label>
                    <input type={type} required id={`register-${key}`} className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200" placeholder={placeholder} value={formData[key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
                  </div>
                ))}

                <div className="space-y-2 group">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required minLength={8} id="register-password" className="w-full bg-transparent text-base border-b border-neutral-200 py-3 focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200" placeholder="Minimum 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-brand-onyx transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

              <div className="space-y-8 auth-reveal">
                <button type="submit" id="register-submit" disabled={loading} className="w-full premium-btn flex items-center justify-center gap-3 py-5">
                  {loading ? 'Processing...' : 'Create Account'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="text-center pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Already a member? <Link to="/login" className="text-brand-onyx border-b border-brand-onyx pb-0.5 ml-2 hover:opacity-60 transition-opacity">Sign In</Link>
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
