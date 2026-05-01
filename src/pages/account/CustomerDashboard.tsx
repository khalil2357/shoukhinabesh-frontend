import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Package, User as UserIcon, Heart, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 container mx-auto">
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2 block">Welcome Back</span>
          <h1 className="text-5xl font-serif font-bold tracking-tighter">{user?.name}</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="space-y-2">
           <button className="w-full text-left p-6 bg-white border border-neutral-100 flex items-center gap-4 hover:border-brand-onyx transition-all">
             <Package className="w-5 h-5 text-neutral-400" />
             <span className="text-xs font-bold uppercase tracking-widest">My Orders</span>
           </button>
           <button className="w-full text-left p-6 bg-white border border-neutral-100 flex items-center gap-4 hover:border-brand-onyx transition-all">
             <Heart className="w-5 h-5 text-neutral-400" />
             <span className="text-xs font-bold uppercase tracking-widest">Wishlist</span>
           </button>
           <button className="w-full text-left p-6 bg-white border border-neutral-100 flex items-center gap-4 hover:border-brand-onyx transition-all border-brand-onyx bg-neutral-50">
             <UserIcon className="w-5 h-5 text-brand-onyx" />
             <span className="text-xs font-bold uppercase tracking-widest">Account Details</span>
           </button>
        </div>

        <div className="lg:col-span-3 space-y-12">
           <div className="bg-white p-10 border border-neutral-100">
             <h3 className="text-xs font-bold uppercase tracking-widest mb-8 border-b border-neutral-100 pb-4">Personal Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Full Name</p>
                  <p className="font-bold">{user?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Email Address</p>
                  <p className="font-bold">{user?.email}</p>
                </div>
             </div>
             <div className="mt-12">
                <Button variant="outline" size="sm">Edit Details</Button>
             </div>
           </div>

           <div className="space-y-8">
             <h3 className="text-xs font-bold uppercase tracking-widest">Recent Activity</h3>
             <div className="bg-neutral-50 p-12 text-center border border-dashed border-neutral-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">No recent orders found.</p>
                <a href="/shop" className="text-[10px] font-bold uppercase tracking-widest text-brand-onyx mt-4 inline-block underline">Discover the Collection</a>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
