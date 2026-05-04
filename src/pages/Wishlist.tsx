import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const Wishlist = () => {
  const { items, loading, fetchWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist().catch(() => {});
    }
  }, [isAuthenticated, fetchWishlist]);

  useGSAP(() => {
    if (!loading && items.length > 0) {
      const tl = gsap.timeline();
      tl.fromTo('.wishlist-header', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('.wishlist-item', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      );
    }
  }, [loading, items]);

  const handleMoveToCart = async (productId: string) => {
    try {
      await addItem(productId, 1);
      await toggleWishlist(productId);
    } catch (error) {
      console.error('Failed to move item to cart:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-40 pb-40 flex flex-col items-center justify-center px-6 text-center">
        <Heart className="w-16 h-16 text-neutral-100 mb-6" />
        <h1 className="text-4xl font-serif font-bold tracking-tighter mb-4">Your Treasury</h1>
        <p className="text-sm text-neutral-500 max-w-sm mb-8">
          Sign in to view and manage your curated collection of future heirlooms.
        </p>
        <Link to="/login" className="premium-btn px-12 py-4">Sign In</Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pt-32 pb-40 min-h-screen bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        {/* Header */}
        <div className="wishlist-header mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold block mb-4">The Treasury</span>
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter">Your <br /><span className="italic font-normal">Selection.</span></h1>
          <p className="text-[10px] text-neutral-400 mt-6 font-bold uppercase tracking-widest">{items.length} pieces saved for later</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] skeleton rounded-sm" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border-t border-neutral-100">
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-neutral-300 mb-8">Your treasury is currently empty</p>
            <Link to="/shop" className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-widest border-b-2 border-brand-onyx pb-2 hover:text-brand-gold hover:border-brand-gold transition-all">
              Discover Masterpieces <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {items.map((item) => (
              <div key={item.product.id} className="wishlist-item group">
                <div className="relative aspect-[4/5] overflow-hidden bg-white rounded-sm mb-8">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-brand-onyx/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col items-center justify-center p-8">
                    <button 
                      onClick={() => handleMoveToCart(item.product.id)}
                      className="w-full bg-brand-cream text-brand-onyx py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-colors flex items-center justify-center gap-3 translate-y-4 group-hover:translate-y-0 duration-700"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Vault
                    </button>
                    <button 
                      onClick={() => toggleWishlist(item.product.id)}
                      className="mt-4 text-[9px] font-bold uppercase tracking-[0.4em] text-brand-cream hover:text-white transition-colors flex items-center gap-2 translate-y-4 group-hover:translate-y-0 duration-700 delay-75"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Piece
                    </button>
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-brand-gold block">
                    {item.product.category?.name || 'Jewellery'}
                  </span>
                  <Link to={`/product/${item.product.slug}`}>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] hover:text-brand-gold transition-colors leading-relaxed">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-serif text-brand-onyx">${Number(item.product.price).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
