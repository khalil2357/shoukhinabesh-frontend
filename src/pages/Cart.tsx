import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, Tag, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { couponsService } from '../services/coupons.service';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface CouponResult { code: string; discountType: string; discountValue: number; }

export const Cart = () => {
  const { isAuthenticated } = useAuthStore();
  const { cart, loading, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  useGSAP(() => {
    if (!loading && cart?.items?.length) {
      const tl = gsap.timeline();
      tl.fromTo('.cart-header', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('.cart-item', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo('.cart-summary', 
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );
    }
  }, [loading, cart?.items?.length]);

  const subtotal = cart?.items?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) ?? 0;
  const discount = coupon
    ? coupon.discountType === 'percent'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue
    : 0;
  const total = Math.max(0, subtotal - discount);

  const handleUpdateQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    try { await updateItem(itemId, qty); } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  };

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    try { 
      gsap.to(`#cart-item-${itemId}`, { 
        x: 50, 
        opacity: 0, 
        duration: 0.4, 
        onComplete: async () => {
          await removeItem(itemId);
        }
      });
    } catch (e) { 
      console.error(e); 
      setRemovingId(null);
    }
  };

  const handleClearCart = async () => {
    setClearingCart(true);
    try { await clearCart(); } catch (e) { console.error(e); }
    finally { setClearingCart(false); }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await couponsService.validateCoupon(couponCode.trim().toUpperCase(), subtotal);
      const data = res.data?.data ?? res.data;
      setCoupon(data);
    } catch {
      setCouponError('Invalid or expired coupon code.');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate('/checkout', { state: { coupon } });
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-40 pb-40 px-6 text-center bg-[#fafaf8]">
        <ShoppingBag className="w-16 h-16 mx-auto text-neutral-100 mb-6" />
        <h1 className="text-4xl font-serif font-bold tracking-tighter mb-4">Your Bag</h1>
        <p className="text-sm text-neutral-500 mb-8 max-w-xs mx-auto">Sign in to view your selection and proceed to checkout.</p>
        <Link to="/login" className="premium-btn px-12 py-4">Sign In</Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pt-32 pb-40 px-6 md:px-12 lg:px-24 min-h-screen bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="cart-header mb-16">
          <Link to="/shop" className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-onyx transition-all mb-8">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Collection
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold mb-4 block">Review Selection</span>
              <h1 className="text-6xl md:text-7xl font-serif font-bold tracking-tighter leading-tight">
                Shopping Bag.
                {cart?.items?.length ? <span className="text-neutral-200 text-3xl ml-6">[{cart.items.length}]</span> : null}
              </h1>
            </div>
            {cart?.items?.length ? (
              <button
                onClick={handleClearCart}
                disabled={clearingCart}
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300 hover:text-rose-500 transition-colors py-2"
              >
                {clearingCart ? 'Clearing Vault...' : 'Clear All'}
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-10 pb-12 border-b border-neutral-100">
                <div className="w-32 h-44 skeleton rounded-sm shrink-0" />
                <div className="flex-1 space-y-4 py-2">
                  <div className="h-6 skeleton w-1/2" />
                  <div className="h-4 skeleton w-1/4" />
                  <div className="h-4 skeleton w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart?.items?.length ? (
          <div className="text-center py-32 space-y-8 border-t border-neutral-100">
            <ShoppingBag className="w-16 h-16 mx-auto text-neutral-100" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Your bag is currently empty</p>
              <p className="text-sm font-serif italic text-neutral-300">Seek the extraordinary in our shop.</p>
            </div>
            <Link to="/shop" className="inline-block premium-btn px-12 py-4">Explore Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Items */}
            <div className="lg:col-span-7 space-y-0">
              {cart.items.map((item) => (
                <div key={item.id} id={`cart-item-${item.id}`} className="cart-item group flex flex-col sm:flex-row gap-8 py-10 border-b border-neutral-100 last:border-0">
                  {/* Image */}
                  <Link to={`/product/${item.product.slug}`} className="shrink-0 w-32 h-44 bg-white overflow-hidden rounded-sm relative block">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-neutral-100 italic font-serif">S</div>
                    )}
                    {(updatingId === item.id || removingId === item.id) && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-brand-onyx border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <Link to={`/product/${item.product.slug}`}>
                            <h3 className="font-bold uppercase text-sm tracking-[0.2em] hover:text-brand-gold transition-colors">{item.product.name}</h3>
                          </Link>
                          <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">
                            Ref: {item.product.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <p className="font-serif text-xl font-bold text-brand-onyx">${(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center border border-neutral-200 rounded-full px-2">
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                            disabled={updatingId === item.id || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:text-brand-gold disabled:opacity-30 transition-colors"
                          >−</button>
                          <span className="w-8 text-center text-[11px] font-black tracking-widest">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            disabled={updatingId === item.id}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:text-brand-gold disabled:opacity-30 transition-colors"
                          >+</button>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                          @ ${Number(item.product.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300 hover:text-rose-500 transition-all hover:translate-x-1 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {removingId === item.id ? 'Discarding...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-5">
              <div className="cart-summary bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10 space-y-10 sticky top-32 rounded-sm border border-neutral-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] border-b border-neutral-100 pb-6">Order Summary</h3>

                {/* Coupon */}
                <div className="space-y-4">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                    <Tag className="w-3.5 h-3.5" /> Promotion Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CODE"
                      className="flex-1 bg-[#fafaf8] border-b-2 border-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200"
                      id="coupon-input"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-8 py-3 bg-brand-onyx text-brand-cream text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-black transition-colors"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 animate-fadeIn">{couponError}</p>}
                  {coupon && (
                    <div className="bg-green-50 p-3 flex justify-between items-center animate-fadeIn">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">
                        ✓ {coupon.code} Applied
                      </p>
                      <p className="text-[10px] font-bold text-green-700">
                        {coupon.discountType === 'percent' ? `${coupon.discountValue}% Off` : `$${coupon.discountValue} Off`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-5 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="text-brand-onyx">${subtotal.toLocaleString()}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Privilege Discount</span>
                      <span>−${discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Concierge Shipping</span>
                    <span className="text-brand-gold italic font-normal normal-case tracking-normal text-xs">Complimentary</span>
                  </div>
                  <div className="pt-8 border-t border-neutral-100 flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400">Estimated Total</span>
                      <p className="font-serif text-3xl text-brand-onyx leading-none">${total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-neutral-300 normal-case tracking-normal">Tax included</p>
                    </div>
                  </div>
                </div>

                <button id="checkout-btn" onClick={handleCheckout} className="w-full premium-btn py-5 flex items-center justify-center gap-4 text-[11px]">
                  Proceed to Secure Checkout
                </button>

                <div className="pt-6 flex flex-col items-center gap-4">
                   <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                     <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" /> 
                     Encrypted Transactions
                   </div>
                   <p className="text-[9px] text-neutral-300 text-center uppercase tracking-widest leading-loose max-w-[200px]">
                     Your selection is held for 60 minutes.
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
