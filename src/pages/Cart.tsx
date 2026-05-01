import { Link } from 'react-router-dom';
import { Trash2, ArrowLeft } from 'lucide-react';

export const Cart = () => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 container mx-auto">
      <header className="mb-16">
        <Link to="/shop" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to Shop
        </Link>
        <h1 className="text-5xl font-serif font-bold tracking-tighter">Your Selection</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-12">
          {/* Cart Items */}
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-8 pb-12 border-b border-neutral-100">
              <div className="w-32 h-40 bg-brand-stone/30 shrink-0" />
              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold uppercase text-xs tracking-widest mb-1">Velvet Lounge Chair</h3>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Onyx / Oak</p>
                  </div>
                  <p className="font-serif">$1,200.00</p>
                </div>
                
                <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                     <span className="text-neutral-400">Qty:</span>
                     <select className="bg-transparent focus:outline-none">
                       <option>1</option>
                       <option>2</option>
                     </select>
                  </div>
                  <button className="text-neutral-300 hover:text-rose-500 transition-colors flex items-center gap-2">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white p-10 border border-neutral-100 space-y-10 sticky top-32">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] border-b border-neutral-100 pb-4">Order Summary</h3>
            
            <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span>$2,400.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Shipping</span>
                <span className="text-brand-gold italic font-normal normal-case">Complimentary</span>
              </div>
              <div className="pt-6 border-t border-neutral-100 flex justify-between text-base">
                <span>Total</span>
                <span className="font-serif">$2,400.00</span>
              </div>
            </div>

            <button className="w-full premium-btn">
              Secure Checkout
            </button>
            
            <p className="text-[9px] text-neutral-400 text-center uppercase tracking-widest leading-loose">
              Taxes and duties calculated at checkout. <br />
              Secure encrypted payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
