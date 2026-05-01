import { useState } from 'react';
import { ShoppingBag, Heart, Share2, Info } from 'lucide-react';

export const ProductDetail = () => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/5] bg-brand-stone/30 overflow-hidden">
             <div className="w-full h-full bg-neutral-200" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="aspect-square bg-brand-stone/20" />
            <div className="aspect-square bg-brand-stone/20" />
            <div className="aspect-square bg-brand-stone/20" />
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Living • Furniture</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">Velvet Lounge Chair</h1>
            <p className="text-2xl font-serif">$1,200.00</p>
          </div>

          <p className="text-neutral-600 leading-relaxed text-sm">
            Exquisitely crafted with premium Italian velvet and a solid oak frame. 
            This piece represents the intersection of classical comfort and 
            minimalist modernism. Designed to be the centerpiece of any room.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center border border-neutral-200 rounded-sm">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-neutral-50">-</button>
                <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-neutral-50">+</button>
              </div>
              <button className="flex-1 premium-btn flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Add to Selection
              </button>
              <button className="p-3 border border-neutral-200 rounded-sm hover:bg-neutral-50 transition-colors">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-10 border-t border-neutral-100">
             <details className="group" open>
               <summary className="flex justify-between items-center cursor-pointer list-none font-bold text-[10px] uppercase tracking-widest py-2">
                 Product Details
                 <span className="group-open:rotate-180 transition-transform">↓</span>
               </summary>
               <div className="py-4 text-xs text-neutral-500 leading-loose">
                 • Handcrafted in Milan <br />
                 • 100% Sustainable Velvet <br />
                 • Dimensions: 85cm x 90cm x 75cm <br />
                 • Professional cleaning only
               </div>
             </details>
             
             <details className="group">
               <summary className="flex justify-between items-center cursor-pointer list-none font-bold text-[10px] uppercase tracking-widest py-2 border-t border-neutral-100">
                 Shipping & Returns
                 <span className="group-open:rotate-180 transition-transform">↓</span>
               </summary>
               <div className="py-4 text-xs text-neutral-500 leading-loose">
                 Complimentary worldwide shipping on all furniture pieces. 
                 Returns accepted within 14 days of delivery.
               </div>
             </details>
          </div>
        </div>
      </div>
    </div>
  );
};
