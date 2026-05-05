import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User as UserIcon, LogOut, ChevronRight, ShieldCheck, MapPin, CreditCard, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ordersService } from '../../services/orders.service';
import api from '../../api/axios';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

type Tab = 'orders' | 'profile';
type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Order {
  id: string; orderNumber: string; total: number; status: OrderStatus;
  paymentStatus: string; paymentMethod: string; createdAt?: string; shippingAddress?: string; notes?: string;
  items?: { id: string; quantity: number; product?: { name: string; price: number; images: string[] } }[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PLACED: 'bg-blue-50/50 text-blue-600 border-blue-100',
  CONFIRMED: 'bg-indigo-50/50 text-indigo-600 border-indigo-100',
  PROCESSING: 'bg-yellow-50/50 text-yellow-700 border-yellow-200',
  SHIPPED: 'bg-orange-50/50 text-orange-600 border-orange-200',
  DELIVERED: 'bg-green-50/50 text-green-700 border-green-200',
  CANCELLED: 'bg-neutral-100/50 text-neutral-500 border-neutral-200',
};

export const CustomerDashboard = ({ initialTab = 'profile' }: { initialTab?: Tab }) => {
  const { user, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', avatar: user?.avatar ?? '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    if (tab === 'orders') {
      setLoadingOrders(true);
      ordersService.getMyOrders({ limit: 20 })
        .then((res) => {
          let items: unknown = res?.data;
          if (items && typeof items === 'object') {
            const d: any = items;
            if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) {
              items = d.data;
            }
          }
          if (items && typeof items === 'object') {
            const d: any = items;
            if (Array.isArray(d)) {
            } else if (Array.isArray(d.data)) {
              items = d.data;
            } else if (Array.isArray(d.items)) {
              items = d.items;
            } else if (Array.isArray(d.orders)) {
              items = d.orders;
            } else {
              items = [];
            }
          } else {
            items = [];
          }
          if (!Array.isArray(items)) items = [];
          setOrders(items as Order[]);
        })
        .catch(() => { setOrders([]); })
        .finally(() => setLoadingOrders(false));
    }
  }, [tab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const payload: Record<string, string> = { name: profileForm.name };
      if (profileForm.avatar) payload.avatar = profileForm.avatar;
      const res = await api.patch('/users/me', payload);
      const updated = res.data?.data ?? res.data;
      if (updated && user) setAuth({ ...user, name: updated.name ?? profileForm.name, avatar: updated.avatar ?? profileForm.avatar }, useAuthStore.getState().token ?? '');
      setProfileMsg('Identity updated securely.');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return;
      }
      setProfileMsg('Update failed. Please try again.');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  };

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo('.dash-header', 
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    )
    .fromTo('.dash-sidebar',
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
      '-=0.6'
    )
    .fromTo('.dash-content',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
      '-=0.6'
    );
  }, []);

  // Animate tab content change
  useGSAP(() => {
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, [tab]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Identity Profile', icon: UserIcon },
    { id: 'orders', label: 'Vault History', icon: Package },
  ];

  return (
    <div ref={containerRef} className="pt-32 pb-40 px-6 md:px-12 lg:px-24 min-h-screen bg-[#fafaf8]">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="dash-header flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold mb-6 block">Private Client Access</span>
            <div className="flex items-center gap-8">
              {user?.avatar ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                   <img src={user.avatar} alt={user?.name ?? 'Avatar'} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-3xl font-serif italic shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter leading-none">{user?.name}</h1>
                <div className="flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4 text-brand-gold" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Verified Member</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-brand-onyx transition-colors">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          {/* Sidebar nav */}
          <div className="dash-sidebar lg:col-span-3 space-y-2 sticky top-32">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full text-left p-6 flex items-center gap-4 transition-all duration-300 border-b ${tab === id ? 'border-brand-onyx text-brand-onyx bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]' : 'border-transparent text-neutral-400 hover:text-brand-onyx hover:bg-white hover:border-neutral-100'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${tab === id ? 'text-brand-gold' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
                <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${tab === id ? 'translate-x-1' : ''}`} />
              </button>
            ))}
          </div>

          {/* Main content */}
          <div ref={contentRef} className="dash-content lg:col-span-9">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.03)] p-10 md:p-16 border border-neutral-100">
                <div className="mb-12 border-b border-neutral-100 pb-6 flex items-center gap-4">
                   <UserIcon className="w-5 h-5 text-brand-gold" />
                   <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-onyx">Identity Configuration</h2>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3 group">
                      <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors block">Full Name</label>
                      <input
                        type="text"
                        required
                        id="profile-name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors"
                      />
                    </div>
                    <div className="space-y-3 group">
                      <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 block">Email Address <span className="text-neutral-300 normal-case tracking-normal ml-2 font-serif italic">(Immutable)</span></label>
                      <input type="email" value={user?.email ?? ''} readOnly className="w-full bg-[#fafaf8] border-b border-neutral-100 py-3 px-4 text-sm text-neutral-400 cursor-not-allowed" />
                    </div>
                    <div className="md:col-span-2 space-y-3 group">
                      <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors block">Avatar Portrait (URL)</label>
                      <input
                        type="url"
                        id="profile-avatar"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm((f) => ({ ...f, avatar: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-neutral-100">
                    {profileMsg ? (
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] animate-fadeIn ${profileMsg.includes('failed') ? 'text-rose-500' : 'text-brand-gold'}`}>
                        {profileMsg}
                      </p>
                    ) : (
                      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Secure Data Transfer
                      </p>
                    )}
                    <button type="submit" disabled={savingProfile} className="premium-btn px-12 py-5 text-[10px]">
                      {savingProfile ? 'Authenticating...' : 'Update Identity'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
              <div className="space-y-6">
                {loadingOrders ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-neutral-100 p-8 space-y-4">
                      <div className="h-4 skeleton w-1/3" /><div className="h-3 skeleton w-1/4" /><div className="h-3 skeleton w-1/2" />
                    </div>
                  ))
                ) : orders.length === 0 ? (
                  <div className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-neutral-100 p-24 text-center space-y-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-[#fafaf8] rounded-full flex items-center justify-center">
                       <Package className="w-8 h-8 text-neutral-200" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-3">
                       <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-onyx">Vault Empty</p>
                       <p className="text-sm text-neutral-400 font-light">Your order history awaits its first masterpiece.</p>
                    </div>
                    <Link to="/shop" className="premium-btn px-10 py-4 mt-4">Discover Collection</Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx">Order History</h2>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{orders.length} Records</span>
                     </div>
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-neutral-100 hover:border-neutral-200 transition-colors group">
                        <button 
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="w-full text-left p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Reference</p>
                            <p className="text-lg font-serif font-bold text-brand-onyx">#{order.orderNumber}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Date Issued</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-brand-onyx">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</p>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Status</p>
                            <span className={`inline-block border text-[8px] font-black uppercase tracking-widest px-3 py-1 ${STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-2 text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Settlement</p>
                            <span className="text-xl font-serif text-brand-onyx">${Number(order.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                          </div>
                          
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#fafaf8] group-hover:bg-brand-onyx group-hover:text-brand-cream transition-colors">
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${selectedOrder?.id === order.id ? '-rotate-180 text-brand-cream' : ''}`} />
                          </div>
                        </button>

                        {/* Order Details Accordion */}
                        <div 
                          className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selectedOrder?.id === order.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="p-8 pt-0 border-t border-neutral-100 space-y-12 mt-4 bg-[#fafaf8]/50">
                            {/* Detailed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
                              <div className="space-y-8">
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                     <CreditCard className="w-4 h-4 text-brand-gold" />
                                     <p className="text-neutral-400 font-black uppercase tracking-[0.3em] text-[9px]">Financial Summary</p>
                                  </div>
                                  <div className="bg-white p-5 border border-neutral-100 space-y-4">
                                     <div className="flex justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Method</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-onyx">{order.paymentMethod}</span>
                                     </div>
                                     <div className="flex justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Gateway Status</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-neutral-600'}`}>{order.paymentStatus}</span>
                                     </div>
                                  </div>
                                </div>
                                
                                {order.shippingAddress && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                       <MapPin className="w-4 h-4 text-brand-gold" />
                                       <p className="text-neutral-400 font-black uppercase tracking-[0.3em] text-[9px]">Dispatch Destination</p>
                                    </div>
                                    <div className="bg-white p-5 border border-neutral-100">
                                      <p className="text-xs leading-relaxed text-neutral-600 font-light">{order.shippingAddress}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Order Items */}
                              {order.items && order.items.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                     <Package className="w-4 h-4 text-brand-gold" />
                                     <p className="text-neutral-400 font-black uppercase tracking-[0.3em] text-[9px]">Manifest Items</p>
                                  </div>
                                  <div className="bg-white border border-neutral-100 p-2 space-y-2">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex gap-4 p-4 hover:bg-neutral-50 transition-colors">
                                        {item.product?.images?.[0] ? (
                                          <img 
                                            src={item.product.images[0]} 
                                            alt={item.product.name} 
                                            className="w-16 h-20 object-cover bg-[#fafaf8]"
                                          />
                                        ) : (
                                          <div className="w-16 h-20 bg-[#fafaf8] flex items-center justify-center text-xs font-serif italic text-neutral-300">P</div>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-onyx truncate">{item.product?.name || 'Archived Masterpiece'}</p>
                                          <div className="flex items-center justify-between gap-2 mt-3">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Qty: {item.quantity}</p>
                                            <p className="text-sm font-serif font-bold text-brand-onyx">${(item.product?.price ? item.product.price * item.quantity : 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {order.notes && (
                              <div className="bg-brand-onyx/5 p-6 border-l-2 border-brand-gold">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-onyx mb-2">Artisan Notes / Instructions</p>
                                <p className="text-xs text-neutral-600 font-light italic">"{order.notes}"</p>
                              </div>
                            )}

                            {/* Total Bar */}
                            <div className="flex justify-between items-end pt-8 border-t border-neutral-200">
                               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Total Settlement</p>
                               <p className="text-4xl font-serif font-bold text-brand-onyx leading-none">${order.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
