import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User as UserIcon, LogOut, ChevronRight, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { ordersService } from '../../services/orders.service';
import api from '../../api/axios';

type Tab = 'orders' | 'profile';
type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Order {
  id: string; orderNumber: string; total: number; status: OrderStatus;
  paymentStatus: string; paymentMethod: string; createdAt?: string;
  items?: { id: string; quantity: number; product?: { name: string; price: number; images: string[] } }[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PLACED: 'bg-blue-50 text-blue-700',
  CONFIRMED: 'bg-indigo-50 text-indigo-700',
  PROCESSING: 'bg-yellow-50 text-yellow-700',
  SHIPPED: 'bg-orange-50 text-orange-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export const CustomerDashboard = ({ initialTab = 'profile' }: { initialTab?: Tab }) => {
  const { user, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', avatar: user?.avatar ?? '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    if (tab === 'orders') {
      setLoadingOrders(true);
      ordersService.getMyOrders({ limit: 20 })
        .then((res) => {
          let items: unknown = res?.data;
          // Normalize common API shapes into an array
          if (items && typeof items === 'object') {
            const d: any = items;
            if (Array.isArray(d)) {
              // already an array
            } else if (Array.isArray(d.data)) items = d.data;
            else if (Array.isArray(d.data?.data)) items = d.data.data;
            else if (Array.isArray(d.items)) items = d.items;
            else if (Array.isArray(d.orders)) items = d.orders;
            else items = [];
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

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await ordersService.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((o) => o ? { ...o, status: 'CANCELLED' } : o);
    } catch (e) { console.error(e); }
    finally { setCancellingId(null); }
  };

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
      setProfileMsg('Profile updated successfully!');
    } catch {
      setProfileMsg('Failed to update profile.');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(''), 4000);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Account Details', icon: UserIcon },
    { id: 'orders', label: 'My Orders', icon: Package },
  ];

  return (
    <div className="pt-24 pb-24 px-6 md:px-12 lg:px-24 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-12 gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2 block">Welcome Back</span>
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name ?? 'Avatar'} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 bg-brand-onyx text-brand-cream rounded-full flex items-center justify-center text-xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">{user?.name}</h1>
                <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-brand-onyx/10 text-brand-onyx">{user?.role}</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-rose-500 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar nav */}
          <div className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full text-left p-5 flex items-center gap-4 transition-all border ${tab === id ? 'border-brand-onyx bg-brand-onyx text-brand-cream' : 'border-neutral-100 bg-white hover:border-neutral-300'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                <ChevronRight className="w-3 h-3 ml-auto" />
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="bg-white border border-neutral-100 p-8 md:p-10">
                <h2 className="text-xs font-bold uppercase tracking-widest mb-8 border-b border-neutral-100 pb-4">Personal Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Full Name</label>
                      <input
                        type="text"
                        required
                        id="profile-name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Email Address</label>
                      <input type="email" value={user?.email ?? ''} readOnly className="w-full border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-400 cursor-not-allowed" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Avatar URL (optional)</label>
                      <input
                        type="url"
                        id="profile-avatar"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm((f) => ({ ...f, avatar: e.target.value }))}
                        placeholder="https://..."
                        className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                      />
                    </div>
                  </div>
                  {profileMsg && (
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${profileMsg.includes('Failed') ? 'text-rose-500' : 'text-green-600'}`}>
                      {profileMsg}
                    </p>
                  )}
                  <button type="submit" disabled={savingProfile} className="premium-btn">
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
              <div className="space-y-4">
                {loadingOrders ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-neutral-100 p-6 space-y-3">
                      <div className="h-4 skeleton w-1/3" /><div className="h-3 skeleton w-1/4" /><div className="h-3 skeleton w-1/2" />
                    </div>
                  ))
                ) : orders.length === 0 ? (
                  <div className="bg-white border border-neutral-100 p-16 text-center space-y-4">
                    <Package className="w-10 h-10 mx-auto text-neutral-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">No orders yet</p>
                    <Link to="/shop" className="text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1">Start Shopping</Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white border border-neutral-100 p-6 space-y-4 hover:border-neutral-300 transition-colors">
                      <div className="flex flex-wrap justify-between gap-4 items-start">
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-widest">Order #{order.orderNumber}</p>
                          {order.createdAt && <p className="text-[10px] text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 ${STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-serif">${Number(order.total).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap pt-2 border-t border-neutral-50">
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-brand-onyx transition-colors flex items-center gap-1"
                        >
                          {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'}
                          <ChevronRight className={`w-3 h-3 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''}`} />
                        </button>
                        {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors disabled:opacity-40"
                          >
                            {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                      {selectedOrder?.id === order.id && (
                        <div className="pt-4 border-t border-neutral-50 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div><p className="text-neutral-400 font-bold uppercase tracking-widest text-[9px]">Payment</p><p className="font-bold mt-1 capitalize">{order.paymentMethod}</p></div>
                            <div><p className="text-neutral-400 font-bold uppercase tracking-widest text-[9px]">Payment Status</p><p className="font-bold mt-1">{order.paymentStatus}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
