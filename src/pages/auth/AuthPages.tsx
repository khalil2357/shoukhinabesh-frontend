import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({ email, password });
      const user = res.data.user;
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'VENDOR') navigate('/vendor');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafafa]">
      <div className="max-w-sm w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold tracking-tighter">Enter the Vault</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Secure Access to your Collection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
            <input 
              type="email" required
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="YOUR@EMAIL.COM"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2 border-b border-neutral-200 pb-2 focus-within:border-brand-onyx transition-colors">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Password</label>
            <input 
              type="password" required
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-4 space-y-6">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
            {error && <p className="text-center text-[10px] text-rose-500 font-bold uppercase tracking-widest">{error}</p>}
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
              <Link to="/register" className="text-neutral-400 hover:text-brand-onyx transition-colors">Create Account</Link>
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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register(formData);
      navigate(formData.role === 'VENDOR' ? '/vendor' : '/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16 bg-[#fafafa]">
      <div className="max-w-sm w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold tracking-tighter">Become a Member</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
            Join our exclusive jewellery community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2 border-b border-neutral-200 pb-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Full Name</label>
            <input 
              type="text" required
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="FULL NAME"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2 border-b border-neutral-200 pb-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
            <input 
              type="email" required
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="YOUR@EMAIL.COM"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2 border-b border-neutral-200 pb-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Password</label>
            <input 
              type="password" required
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="space-y-4">
             <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">I want to</label>
             <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, role: 'CUSTOMER'})}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border ${formData.role === 'CUSTOMER' ? 'border-brand-onyx bg-brand-onyx text-brand-cream' : 'border-neutral-200 text-neutral-400'}`}
                >
                  Shop Pieces
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, role: 'VENDOR'})}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border ${formData.role === 'VENDOR' ? 'border-brand-onyx bg-brand-onyx text-brand-cream' : 'border-neutral-200 text-neutral-400'}`}
                >
                  Sell Jewellery
                </button>
             </div>
          </div>

          <div className="pt-4 space-y-6">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Account...' : 'Join Now'}
            </Button>
            <div className="text-center text-[9px] font-bold uppercase tracking-widest">
              <Link to="/login" className="text-neutral-400 hover:text-brand-onyx transition-colors">Already a member? Sign In</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
