import React from 'react';

export const AdminDashboard = () => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 container mx-auto">
      <h1 className="text-4xl font-serif font-bold mb-12">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 bg-white p-10 border border-neutral-100 space-y-8">
          <h2 className="text-xl font-bold uppercase tracking-widest">Platform Overview</h2>
          <p className="text-sm text-neutral-500">
            Welcome to the admin control panel. From here, you can manage users, oversee vendor operations, and monitor platform activity.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-4">
             <div className="p-6 bg-[#fafafa] border border-neutral-100 text-center space-y-2">
                <p className="text-3xl font-serif">124</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total Users</p>
             </div>
             <div className="p-6 bg-[#fafafa] border border-neutral-100 text-center space-y-2">
                <p className="text-3xl font-serif">12</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Active Vendors</p>
             </div>
             <div className="p-6 bg-[#fafafa] border border-neutral-100 text-center space-y-2">
                <p className="text-3xl font-serif">$45k</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Monthly Revenue</p>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-brand-onyx text-brand-cream p-10 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em]">System Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-xs text-neutral-400">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
