import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, LogOut, ChevronRight, Settings, ShieldCheck, MapPin, Key } from 'lucide-react';
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
  PLACED: 'border-blue-200 text-blue-700 bg-blue-50/50',
  CONFIRMED: 'border-indigo-200 text-indigo-700 bg-indigo-50/50',
  PROCESSING: 'border-brand-gold text-brand-gold bg-brand-gold/10',
  SHIPPED: 'border-orange-200 text-orange-700 bg-orange-50/50',
  DELIVERED: 'border-green-200 text-green-700 bg-green-50/50',
  CANCELLED: 'border-neutral-200 text-neutral-500 bg-neutral-50',
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
              // already an array
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

  // Initial Entrance Animation
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo('.dashboard-header', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.dashboard-sidebar', 
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo('.dashboard-content', 
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    );
  }, []);

  // Tab Content Entrance Animation
  useGSAP(() => {
    gsap.fromTo('.tab-reveal', 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }
    );
  }, [tab, loadingOrders]);

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
      setProfileMsg('Identity Verified & Updated.');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return;
      }
      setProfileMsg('Failed to update identity.');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Identity & Access', icon: Key },
    { id: 'orders', label: 'Order Legacy', icon: Package },
  ];

  return (
    <div ref={containerRef} className="pt-32 pb-40 px-6 md:px-12 lg:px-24 min-h-screen bg-[#fafaf8]">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="dashboard-header flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8 border-b border-neutral-200 pb-12">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold mb-4 block">Private Client Dashboard</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {user?.avatar ? (
                <div className="relative">
                   <img src={user.avatar} alt={user?.name ?? 'Avatar'} className="w-24 h-24 rounded-full object-cover shadow-lg" />
                   <div className="absolute inset-0 rounded-full border border-brand-gold/30 scale-110 pointer-events-none" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-3xl font-serif italic shadow-lg relative">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  <div className="absolute inset-0 rounded-full border border-brand-onyx/30 scale-110 pointer-events-none" />
                </div>
              )}
              <div>
                <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter">{user?.name}</h1>
                <div className="flex items-center gap-3 mt-4">
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 border border-brand-onyx text-brand-onyx">
                    Verified Member
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-neutral-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Secure Session
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-brand-onyx transition-colors">
            <span className="border-b border-transparent group-hover:border-brand-onyx pb-0.5 transition-colors">Terminate Session</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Sidebar nav */}
          <div className="dashboard-sidebar lg:col-span-3 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400 mb-8 px-4">Navigation</h3>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full text-left px-6 py-5 flex items-center gap-4 transition-all duration-300 rounded-sm ${tab === id ? 'bg-brand-onyx text-brand-cream shadow-lg translate-x-2' : 'bg-transparent text-neutral-500 hover:bg-white hover:text-brand-onyx hover:shadow-sm'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tab === id ? 'text-brand-gold' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
                <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${tab === id ? 'translate-x-1' : ''}`} />
              </button>
            ))}
          </div>

          {/* Main content */}
          <div ref={contentRef} className="dashboard-content lg:col-span-9">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.03)] border border-neutral-100 p-10 md:p-16">
                <div className="tab-reveal flex items-center gap-4 mb-12 border-b border-neutral-100 pb-8">
                   <Settings className="w-6 h-6 text-brand-gold" />
                   <div>
                     <h2 className="text-2xl font-serif font-bold tracking-tighter">Identity Settings</h2>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Manage your private client details</p>
                   </div>
                </div>
                
                <form onSubmit={handleSaveProfile} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="tab-reveal space-y-3 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">Full Legal Name</label>
                      <input
                        type="text"
                        required
                        id="profile-name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full bg-[#fafaf8] border-b border-transparent px-4 py-4 text-sm font-bold focus:outline-none focus:border-brand-onyx transition-all"
                      />
                    </div>
                    <div className="tab-reveal space-y-3 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Registered Email</label>
                      <input 
                        type="email" 
                        value={user?.email ?? ''} 
                        readOnly 
                        className="w-full bg-neutral-100 border-b border-transparent px-4 py-4 text-sm font-bold text-neutral-400 cursor-not-allowed" 
                      />
                    </div>
                    <div className="tab-reveal md:col-span-2 space-y-3 group">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 group-focus-within:text-brand-onyx transition-colors">Portrait URL (Optional)</label>
                      <input
                        type="url"
                        id="profile-avatar"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm((f) => ({ ...f, avatar: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-[#fafaf8] border-b border-transparent px-4 py-4 text-sm focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-300"
                      />
                    </div>
                  </div>
                  
                  <div className="tab-reveal pt-6 flex flex-col sm:flex-row items-center gap-6 justify-between border-t border-neutral-100">
                    {profileMsg ? (
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${profileMsg.includes('Failed') ? 'text-rose-500' : 'text-brand-gold'} animate-fadeIn`}>
                        {profileMsg}
                      </p>
                    ) : <div />}
                    
                    <button type="submit" disabled={savingProfile} className="premium-btn px-12 py-5 w-full sm:w-auto">
                      {savingProfile ? 'Updating Registry...' : 'Update Identity'}
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
                    <div key={i} className="tab-reveal bg-white border border-neutral-100 p-8 space-y-4 shadow-sm">
                      <div className="h-5 skeleton w-1/4 rounded-sm" />
                      <div className="h-4 skeleton w-1/3 rounded-sm" />
                      <div className="h-10 skeleton w-full mt-6 rounded-sm" />
                    </div>
                  ))
                ) : orders.length === 0 ? (
                  <div className="tab-reveal bg-white border border-dashed border-neutral-200 p-24 text-center space-y-6">
                    <Package className="w-12 h-12 mx-auto text-neutral-200" strokeWidth={1} />
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-onyx">Your Vault is Empty</p>
                       <p className="text-xs text-neutral-400 font-light">You have not acquired any masterpieces yet.</p>
                    </div>
                    <Link to="/shop" className="inline-block mt-4 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-brand-onyx pb-1 hover:opacity-60 transition-opacity">
                      Explore Collection
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="tab-reveal flex items-center justify-between mb-8 px-2">
                      <h2 className="text-2xl font-serif font-bold tracking-tighter">Order Legacy</h2>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">{orders.length} Records Found</span>
                    </div>
                    {orders.map((order) => (
                      <div key={order.id} className="tab-reveal bg-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-neutral-100 p-8 md:p-10 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                        {/* Decorative background accent */}
                        <div className={`absolute top-0 right-0 w-2 h-full opacity-50 transition-opacity group-hover:opacity-100 ${
                          order.status === 'DELIVERED' ? 'bg-green-400' :
                          order.status === 'PROCESSING' ? 'bg-brand-gold' :
                          order.status === 'CANCELLED' ? 'bg-neutral-300' : 'bg-blue-400'
                        }`} />
                        
                        <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <p className="text-xl font-serif font-bold tracking-tighter">Reference #{order.orderNumber}</p>
                              <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 border ${STATUS_COLORS[order.status] ?? 'border-neutral-200 text-neutral-500 bg-neutral-50'}`}>
                                {order.status}
                              </span>
                            </div>
                            {order.createdAt && <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Initiated on {new Date(order.createdAt).toLocaleDateString()}</p>}
                          </div>
                          
                          <div className="flex flex-col md:items-end gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Settlement</span>
                            <span className="text-2xl font-serif font-bold text-brand-onyx">${Number(order.total).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-start md:justify-end mt-8 border-t border-neutral-100 pt-6">
                          <button
                            onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-brand-onyx transition-colors flex items-center gap-2"
                          >
                            <span className="border-b border-transparent hover:border-brand-onyx pb-0.5">
                              {selectedOrder?.id === order.id ? 'Close Dossier' : 'Inspect Dossier'}
                            </span>
                            <ChevronRight className={`w-3 h-3 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                        
                        {/* Expanded Details */}
                        {selectedOrder?.id === order.id && (
                          <div className="mt-8 pt-8 border-t border-neutral-100 space-y-10 animate-fadeIn">
                            {/* Meta Info */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 bg-[#fafaf8] p-6 border border-neutral-100">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-2">Transaction Method</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-brand-onyx flex items-center gap-2">
                                  <ShieldCheck className="w-3 h-3 text-brand-gold" /> {order.paymentMethod}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-2">Clearance Status</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-brand-onyx">{order.paymentStatus}</p>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-2">Destination</p>
                                <p className="text-xs text-neutral-600 font-light leading-relaxed flex items-start gap-2">
                                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-brand-gold" /> 
                                  {order.shippingAddress || 'Not specified'}
                                </p>
                              </div>
                            </div>
  
                            {/* Order Items */}
                            {order.items && order.items.length > 0 && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx mb-6 border-b border-neutral-100 pb-3">Acquired Pieces</p>
                                <div className="space-y-4">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-6 items-center p-4 hover:bg-[#fafaf8] transition-colors border border-transparent hover:border-neutral-100 group">
                                      {item.product?.images?.[0] ? (
                                        <div className="w-16 h-20 bg-neutral-100 overflow-hidden rounded-sm flex-shrink-0">
                                          <img 
                                            src={item.product.images[0]} 
                                            alt={item.product.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-16 h-20 bg-neutral-100 flex-shrink-0 rounded-sm" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest truncate text-brand-onyx mb-1">{item.product?.name || 'Archived Masterpiece'}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Qty: {item.quantity}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-serif font-bold text-brand-onyx">${(item.product?.price ? item.product.price * item.quantity : 0).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
  
                            {/* Notes */}
                            {order.notes && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx mb-4 border-b border-neutral-100 pb-3">Artisan Notes</p>
                                <p className="text-sm text-neutral-600 font-light leading-relaxed italic bg-white p-6 border border-neutral-100">"{order.notes}"</p>
                              </div>
                            )}
                            
                            {/* Summary */}
                            <div className="flex justify-between items-end pt-6 border-t border-brand-onyx">
                               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Total Valuation</p>
                               <p className="text-4xl font-serif font-bold text-brand-onyx leading-none">${order.total.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
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
