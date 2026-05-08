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
      { y: -40, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power4.out' }
    )
    .fromTo('.dash-sidebar',
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: 'power4.out' },
      '-=0.8'
    )
    .fromTo('.dash-content',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power4.out' },
      '-=0.8'
    );
  }, []);

  // Animate tab content change
  useGSAP(() => {
    gsap.fromTo(contentRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.2)' }
    );
  }, [tab]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Identity Profile', icon: UserIcon },
    { id: 'orders', label: 'Vault History', icon: Package },
  ];

  return (
    <div ref={containerRef} className="pt-32 pb-40 px-6 md:px-12 lg:px-24 min-h-screen bg-[#fafaf8] overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="dash-header bg-white/40 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] border border-white shadow-[0_20px_60px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold mb-6 block">Private Client Access</span>
            <div className="flex items-center gap-8">
              {user?.avatar ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-[0_15px_30px_rgba(0,0,0,0.1)] flex-shrink-0">
                   <img src={user.avatar} alt={user?.name ?? 'Avatar'} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-brand-onyx text-brand-gold rounded-full flex items-center justify-center text-4xl font-serif italic shadow-[0_15px_30px_rgba(0,0,0,0.1)] border-4 border-white flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter leading-none text-brand-onyx">{user?.name}</h1>
                <div className="flex items-center gap-3 bg-white w-fit px-4 py-2 rounded-full shadow-sm border border-neutral-50">
                   <ShieldCheck className="w-4 h-4 text-green-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-brand-onyx">Verified Member</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="group bg-white hover:bg-rose-50 border border-neutral-100 hover:border-rose-100 flex items-center gap-3 px-8 py-4 rounded-full shadow-sm transition-all duration-300 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-rose-500 hover:shadow-md hover:-translate-y-0.5">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Sidebar nav */}
          <div className="dash-sidebar lg:col-span-3 lg:sticky lg:top-32 bg-white/40 backdrop-blur-3xl p-4 rounded-[3rem] border border-white shadow-[0_20px_60px_rgba(0,0,0,0.02)] space-y-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full text-left px-8 py-5 flex items-center gap-4 transition-all duration-500 rounded-[2rem] ${tab === id ? 'bg-white shadow-sm border border-neutral-50 text-brand-onyx' : 'text-neutral-500 hover:text-brand-onyx hover:bg-white/60'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${tab === id ? 'text-brand-gold' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
                <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${tab === id ? 'translate-x-1 text-brand-gold' : 'opacity-0'}`} />
              </button>
            ))}
          </div>

          {/* Main content */}
          <div ref={contentRef} className="dash-content lg:col-span-9">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="bg-white/60 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.03)] p-10 md:p-16 rounded-[3rem] border border-white">
                <div className="mb-12 pb-6 border-b border-neutral-100/50 flex items-center gap-4 bg-white w-fit px-6 py-3 rounded-full shadow-sm">
                   <UserIcon className="w-4 h-4 text-brand-gold" />
                   <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-onyx">Identity Configuration</h2>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold pl-6 block">Full Name</label>
                      <input
                        type="text"
                        required
                        id="profile-name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full bg-white rounded-full px-8 py-5 text-sm font-medium focus:outline-none focus:ring-2 ring-brand-onyx/10 shadow-sm transition-all text-brand-onyx placeholder:text-neutral-300 border border-transparent focus:border-brand-onyx/20"
                      />
                    </div>
                    <div className="space-y-4 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold pl-6 block">Email Address <span className="text-neutral-400 normal-case tracking-normal ml-2 font-serif italic">(Immutable)</span></label>
                      <input type="email" value={user?.email ?? ''} readOnly className="w-full bg-neutral-100/50 rounded-full px-8 py-5 text-sm text-neutral-400 cursor-not-allowed border border-transparent font-medium" />
                    </div>
                    <div className="md:col-span-2 space-y-4 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold pl-6 block">Avatar Portrait (URL)</label>
                      <input
                        type="url"
                        id="profile-avatar"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm((f) => ({ ...f, avatar: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-white rounded-full px-8 py-5 text-sm font-medium focus:outline-none focus:ring-2 ring-brand-onyx/10 shadow-sm transition-all text-brand-onyx placeholder:text-neutral-300 border border-transparent focus:border-brand-onyx/20"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-t border-neutral-100/50">
                    {profileMsg ? (
                      <p className={`text-[10px] font-black uppercase tracking-[0.4em] animate-fadeIn px-6 py-3 rounded-full shadow-sm bg-white border border-neutral-50 ${profileMsg.includes('failed') ? 'text-rose-500' : 'text-green-500'}`}>
                        {profileMsg}
                      </p>
                    ) : (
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-400 flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-brand-gold" /> Secure Data Transfer
                      </p>
                    )}
                    <button type="submit" disabled={savingProfile} className="bg-brand-onyx text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] hover:bg-black shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none">
                      {savingProfile ? 'Authenticating...' : 'Update Identity'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
              <div className="space-y-6 order-list">
                {loadingOrders ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white p-10 space-y-6 shadow-sm">
                      <div className="h-4 skeleton w-1/3 rounded-full" /><div className="h-3 skeleton w-1/4 rounded-full" /><div className="h-3 skeleton w-1/2 rounded-full" />
                    </div>
                  ))
                ) : orders.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-white p-24 rounded-[3rem] text-center space-y-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border border-neutral-50">
                       <Package className="w-10 h-10 text-brand-gold" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-4">
                       <p className="text-[12px] font-black uppercase tracking-[0.5em] text-brand-onyx">Vault Empty</p>
                       <p className="text-sm text-neutral-500 font-medium">Your order history awaits its first masterpiece.</p>
                    </div>
                    <Link to="/shop" className="bg-brand-onyx text-brand-gold px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:bg-black hover:-translate-y-1 transition-all duration-300">Discover Collection</Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between mb-8 bg-white/40 backdrop-blur-xl px-8 py-5 rounded-full shadow-sm border border-white">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx">Order History</h2>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 bg-white px-4 py-1.5 rounded-full shadow-sm">{orders.length} Records</span>
                     </div>
                    {orders.map((order) => (
                      <div key={order.id} className={`bg-white/60 backdrop-blur-xl shadow-sm border border-white hover:border-brand-onyx/20 transition-all duration-500 group overflow-hidden ${selectedOrder?.id === order.id ? 'rounded-[3rem]' : 'rounded-[2rem]'}`}>
                        <button 
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="w-full text-left px-8 py-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-8"
                        >
                          <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold">Reference</p>
                            <p className="text-xl font-serif font-black text-brand-onyx">#{order.orderNumber}</p>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold">Date Issued</p>
                            <p className="text-xs font-black uppercase tracking-widest text-neutral-600 bg-white px-4 py-2 rounded-full shadow-sm w-fit">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</p>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold">Status</p>
                            <span className={`inline-block border text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm ${STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-3 text-left md:text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold">Settlement</p>
                            <span className="text-2xl font-serif font-black text-brand-onyx italic">${Number(order.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                          </div>
                          
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 shadow-sm ${selectedOrder?.id === order.id ? 'bg-brand-onyx text-brand-gold shadow-[0_10px_20px_rgba(0,0,0,0.1)]' : 'bg-white text-neutral-400 group-hover:text-brand-onyx group-hover:shadow-md'}`}>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${selectedOrder?.id === order.id ? '-rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Order Details Accordion */}
                        <div 
                          className={`overflow-hidden transition-all duration-[600ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${selectedOrder?.id === order.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="p-8 md:p-12 pt-0 border-t border-neutral-100/50 space-y-12">
                            {/* Detailed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                              <div className="space-y-8">
                                <div className="bg-white/80 p-8 rounded-[2rem] shadow-sm border border-white">
                                  <div className="flex items-center gap-3 mb-6 bg-neutral-50 w-fit px-4 py-2 rounded-full">
                                     <CreditCard className="w-4 h-4 text-brand-gold" />
                                     <p className="text-brand-onyx font-black uppercase tracking-[0.3em] text-[9px]">Financial Summary</p>
                                  </div>
                                  <div className="space-y-6">
                                     <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Method</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-onyx bg-neutral-50 px-3 py-1 rounded-full">{order.paymentMethod}</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Gateway Status</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-neutral-50 text-neutral-600 border border-neutral-100'}`}>{order.paymentStatus}</span>
                                     </div>
                                  </div>
                                </div>
                                
                                {order.shippingAddress && (
                                  <div className="bg-white/80 p-8 rounded-[2rem] shadow-sm border border-white">
                                    <div className="flex items-center gap-3 mb-6 bg-neutral-50 w-fit px-4 py-2 rounded-full">
                                       <MapPin className="w-4 h-4 text-brand-gold" />
                                       <p className="text-brand-onyx font-black uppercase tracking-[0.3em] text-[9px]">Dispatch Destination</p>
                                    </div>
                                    <p className="text-xs leading-relaxed text-neutral-500 font-medium">{order.shippingAddress}</p>
                                  </div>
                                )}
                              </div>

                              {/* Order Items */}
                              {order.items && order.items.length > 0 && (
                                <div className="bg-white/80 p-8 rounded-[2rem] shadow-sm border border-white h-full">
                                  <div className="flex items-center gap-3 mb-6 bg-neutral-50 w-fit px-4 py-2 rounded-full">
                                     <Package className="w-4 h-4 text-brand-gold" />
                                     <p className="text-brand-onyx font-black uppercase tracking-[0.3em] text-[9px]">Manifest Items</p>
                                  </div>
                                  <div className="space-y-4">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex gap-6 p-4 bg-neutral-50 rounded-[1.5rem] hover:bg-neutral-100/50 transition-colors border border-neutral-100/50">
                                        {item.product?.images?.[0] ? (
                                          <img 
                                            src={item.product.images[0]} 
                                            alt={item.product.name} 
                                            className="w-20 h-24 object-cover rounded-xl shadow-sm bg-white"
                                          />
                                        ) : (
                                          <div className="w-20 h-24 bg-white rounded-xl shadow-sm flex items-center justify-center text-xs font-serif italic text-neutral-300 border border-neutral-100">P</div>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-onyx line-clamp-2 leading-relaxed">{item.product?.name || 'Archived Masterpiece'}</p>
                                          <div className="flex items-center justify-between gap-4 mt-4">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 bg-white px-3 py-1 rounded-full shadow-sm">Qty: {item.quantity}</p>
                                            <p className="text-sm font-serif font-black text-brand-onyx italic">${(item.product?.price ? item.product.price * item.quantity : 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {order.notes && (
                              <div className="bg-brand-onyx text-white p-8 rounded-[2rem] shadow-[0_15px_30px_rgba(0,0,0,0.1)] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-brand-gold" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold mb-4 ml-2">Artisan Notes / Instructions</p>
                                <p className="text-sm text-neutral-300 font-medium italic leading-relaxed ml-2">"{order.notes}"</p>
                              </div>
                            )}

                            {/* Total Bar */}
                            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-50 mt-8">
                               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Total Settlement</p>
                               <p className="text-4xl font-serif font-black text-brand-onyx italic">${order.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
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
