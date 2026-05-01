import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, Tag, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { couponsService } from '../services/coupons.service';

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

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

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
    try { await removeItem(itemId); } catch (e) { console.error(e); }
    finally { setRemovingId(null); }
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
      <div className="pt-32 pb-24 px-6 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
        <h1 className="text-3xl font-serif font-bold mb-4">Your Cart</h1>
        <p className="text-sm text-neutral-500 mb-6">Sign in to view your cart</p>
        <Link to="/login" className="premium-btn">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link to="/shop" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to Shop
          </Link>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2 block">Your Selection</span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">
                Shopping Cart
                {cart?.items?.length ? <span className="text-neutral-300 text-2xl ml-3">({cart.items.length})</span> : null}
              </h1>
            </div>
            {cart?.items?.length ? (
              <button
                onClick={handleClearCart}
                disabled={clearingCart}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-rose-500 transition-colors"
              >
                {clearingCart ? 'Clearing...' : 'Clear All'}
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-8 pb-10 border-b border-neutral-100">
                <div className="w-28 h-36 skeleton shrink-0" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 skeleton w-1/2" />
                  <div className="h-3 skeleton w-1/4" />
                  <div className="h-3 skeleton w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart?.items?.length ? (
          <div className="text-center py-24 space-y-6">
            <ShoppingBag className="w-12 h-12 mx-auto text-neutral-200" />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Your cart is empty</p>
              <p className="text-xs text-neutral-300 mt-2">Add some beautiful pieces to get started</p>
            </div>
            <Link to="/shop" className="inline-block premium-btn">Explore Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Items */}
            <div className="lg:col-span-8 space-y-0">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-6 py-8 border-b border-neutral-100">
                  {/* Image */}
                  <Link to={`/product/${item.product.slug}`} className="shrink-0 w-28 h-36 bg-neutral-100 overflow-hidden">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-200">✦</div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link to={`/product/${item.product.slug}`}>
                          <h3 className="font-bold uppercase text-xs tracking-widest hover:text-brand-gold transition-colors">{item.product.name}</h3>
                        </Link>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                          ${Number(item.product.price).toLocaleString()} each
                        </p>
                      </div>
                      <p className="font-serif text-base shrink-0">${(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>

                    <div className="flex justify-between items-end">
                      {/* Qty controls */}
                      <div className="flex items-center border border-neutral-200">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          disabled={updatingId === item.id || item.quantity <= 1}
                          className="px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                        >−</button>
                        <span className="w-10 text-center text-sm font-bold">
                          {updatingId === item.id ? <span className="spinner inline-block" /> : item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={updatingId === item.id}
                          className="px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-40 transition-colors"
                        >+</button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-rose-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" /> {removingId === item.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-neutral-100 p-8 space-y-8 sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] border-b border-neutral-100 pb-4">Order Summary</h3>

                {/* Coupon */}
                <div className="space-y-3">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="flex-1 border border-neutral-200 px-3 py-2 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-onyx"
                      id="coupon-input"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-4 py-2 bg-brand-onyx text-brand-cream text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-neutral-800 transition-colors"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{couponError}</p>}
                  {coupon && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">
                      ✓ {coupon.code} — {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `$${coupon.discountValue} off`}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>−${discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Shipping</span>
                    <span className="text-brand-gold italic font-normal normal-case">Complimentary</span>
                  </div>
                  <div className="pt-4 border-t border-neutral-100 flex justify-between text-sm">
                    <span>Total</span>
                    <span className="font-serif text-base">${total.toLocaleString()}</span>
                  </div>
                </div>

                <button id="checkout-btn" onClick={handleCheckout} className="w-full premium-btn">
                  Secure Checkout
                </button>

                <p className="text-[9px] text-neutral-400 text-center uppercase tracking-widest leading-loose">
                  Encrypted & secure payments.<br />Taxes calculated at checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
