import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, MapPin, Package, Tag, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useCartStore } from '../store/useCartStore';
import { ordersService } from '../services/orders.service';
import { couponsService } from '../services/coupons.service';
import { useAuthStore } from '../store/useAuthStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface CouponResult {
  code: string;
  discountType: string;
  discountValue: number;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'JP', name: 'Japan' },
  { code: 'BD', name: 'Bangladesh' },
];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

const CheckoutForm = () => {
  const location = useLocation();
  const { cart, fetchCart, clearCart } = useCartStore();
  const { user, token, hasHydrated } = useAuthStore();
  const stripe = useStripe();
  const elements = useElements();

  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', postalCode: '', country: '',
  });
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>((location.state as { coupon?: CouponResult })?.coupon ?? null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [cardError, setCardError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; id: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const canPlaceOrder = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!hasHydrated || !token) return;
    fetchCart().catch(() => {});
  }, [fetchCart, hasHydrated, token]);

  useGSAP(() => {
    if (!orderSuccess && cart?.items?.length) {
      const tl = gsap.timeline();
      tl.fromTo('.checkout-header', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('.checkout-section', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo('.checkout-summary', 
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );
    }
  }, [orderSuccess, cart?.items?.length]);

  useGSAP(() => {
    if (orderSuccess) {
      gsap.fromTo(successRef.current, 
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
      );
      gsap.fromTo('.success-reveal', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.4 }
      );
    }
  }, [orderSuccess]);

  if (!canPlaceOrder) {
    return (
      <div className="pt-40 pb-40 px-6 text-center bg-[#fafaf8]">
        <CreditCard className="w-16 h-16 mx-auto text-neutral-100 mb-8" />
        <h1 className="text-4xl font-serif font-bold tracking-tighter mb-4">Checkout Restricted</h1>
        <p className="text-sm text-neutral-500 mb-8 max-w-xs mx-auto">Only individual customer accounts can finalize orders through the vault.</p>
        <Link to="/shop" className="premium-btn px-12 py-4">Return to Collection</Link>
      </div>
    );
  }

  const subtotal = cart?.items?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) ?? 0;
  const discount = coupon
    ? coupon.discountType === 'percent'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue
    : 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await couponsService.validateCoupon(couponCode.trim().toUpperCase(), subtotal);
      const data = res.data?.data ?? res.data;
      setCoupon(data);
    } catch {
      setCouponError('Invalid or expired coupon.');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.items?.length) return;
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.postalCode.trim() || !addressForm.country.trim()) {
      setError('Shipping address is incomplete');
      return;
    }

    setPlacing(true);
    setError('');
    setCardError('');

    try {
      if (!stripe || !elements) throw new Error('Payment system not ready');
      const countryName = COUNTRIES.find(c => c.code === addressForm.country)?.name || addressForm.country;
      const fullAddress = `${addressForm.street}, ${addressForm.city}, ${addressForm.state} ${addressForm.postalCode}, ${countryName}`;

      const orderRes = await ordersService.placeOrder({
        paymentMethod: 'STRIPE',
        shippingAddress: fullAddress,
        couponCode: coupon?.code || undefined,
        notes: notes.trim() || undefined,
      });
      const order = orderRes.data?.data ?? orderRes.data;
      const intentRes = await ordersService.createStripePaymentIntent(order.id);
      const intentData = (intentRes.data as any)?.data ?? (intentRes.data as any);
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Secure payment field missing');

      const confirmRes = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            address: {
              line1: addressForm.street, city: addressForm.city,
              state: addressForm.state, postal_code: addressForm.postalCode,
              country: addressForm.country,
            },
          },
        },
      });

      if (confirmRes.error) {
        setCardError(confirmRes.error.message || 'Transaction declined');
        setPlacing(false);
        return;
      }

      await clearCart();
      setOrderSuccess({ orderNumber: order.orderNumber ?? order.id, id: order.id });
    } catch (err: any) {
      console.error('[Checkout] Error:', err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred');
    } finally {
      setPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-20 bg-[#fafaf8]">
        <div ref={successRef} className="max-w-xl w-full text-center space-y-12">
          <div className="relative inline-block">
             <CheckCircle className="w-24 h-24 mx-auto text-brand-onyx" strokeWidth={1} />
             <div className="absolute inset-0 border-4 border-brand-gold rounded-full animate-ping opacity-20" />
          </div>
          <div className="space-y-4 success-reveal">
            <h1 className="text-6xl font-serif font-bold tracking-tighter">Order Confirmed.</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold">A legacy begins with you</p>
          </div>
          <div className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-12 space-y-6 success-reveal">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Order Reference</p>
            <p className="text-4xl font-serif font-bold text-brand-onyx">{orderSuccess.orderNumber}</p>
            <div className="pt-6 border-t border-neutral-100">
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                We have received your selection. A confirmation dispatch has been sent to your email address. 
                Our artisans will now begin the final inspection and packaging of your pieces.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center success-reveal">
            <Link to="/dashboard/orders" className="premium-btn flex items-center justify-center gap-3 px-10 py-5">
              <Package className="w-4 h-4" /> View My Vault
            </Link>
            <Link to="/shop" className="px-10 py-5 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:border-brand-onyx transition-all">
              Discover More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pt-32 pb-40 px-6 md:px-12 lg:px-24 min-h-screen bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="checkout-header mb-20">
          <Link to="/cart" className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-onyx transition-all mb-8">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Bag
          </Link>
          <div className="space-y-4">
             <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold block">The Final Step</span>
             <h1 className="text-6xl md:text-7xl font-serif font-bold tracking-tighter">Checkout.</h1>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            <div className="lg:col-span-7 space-y-16">
              {/* Shipping */}
              <div className="checkout-section space-y-10">
                <h2 className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx border-b border-neutral-100 pb-6">
                  <MapPin className="w-4 h-4 text-brand-gold" /> Shipping Intelligence
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2 md:col-span-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-focus-within:text-brand-onyx">Street Address</label>
                     <input
                       type="text" value={addressForm.street}
                       onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                       className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors"
                       required
                     />
                   </div>
                   <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-focus-within:text-brand-onyx">City</label>
                     <input
                       type="text" value={addressForm.city}
                       onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                       className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors"
                       required
                     />
                   </div>
                   <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-focus-within:text-brand-onyx">Province / State</label>
                     <input
                       type="text" value={addressForm.state}
                       onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                       className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors"
                       required
                     />
                   </div>
                   <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-focus-within:text-brand-onyx">Postal Code</label>
                     <input
                       type="text" value={addressForm.postalCode}
                       onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                       className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors"
                       required
                     />
                   </div>
                   <div className="space-y-2 group">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-focus-within:text-brand-onyx">Country</label>
                     <select
                       value={addressForm.country}
                       onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                       className="w-full bg-transparent border-b border-neutral-200 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors cursor-pointer"
                       required
                     >
                       <option value="">Select Destination</option>
                       {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                     </select>
                   </div>
                </div>
              </div>

              {/* Payment */}
              <div className="checkout-section space-y-10">
                <h2 className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx border-b border-neutral-100 pb-6">
                  <CreditCard className="w-4 h-4 text-brand-gold" /> Secure Settlement
                </h2>
                <div className="space-y-8">
                  <div className="flex items-center gap-4 p-6 border border-brand-onyx/20 bg-white">
                    <ShieldCheck className="w-6 h-6 text-brand-gold" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest">Credit / Debit Card</p>
                      <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-tighter">Processed by Stripe Inc. [End-to-End Encrypted]</p>
                    </div>
                    <div className="flex gap-1">
                       {['VISA', 'MC', 'AMEX'].map(p => <span key={p} className="text-[8px] border border-neutral-200 px-1 font-bold text-neutral-300">{p}</span>)}
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-100 p-10 space-y-6">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 block mb-2">Card Credentials</label>
                    <div className="border-b border-neutral-200 pb-4">
                      <CardElement options={{ style: { base: { fontSize: '15px', color: '#1a1a1a', '::placeholder': { color: '#d1d1d1' } } } }} />
                    </div>
                    {cardError && (
                      <div className="p-4 bg-rose-50 flex items-center gap-3 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{cardError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="checkout-section space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-onyx border-b border-neutral-100 pb-6">Artisan Notes</h2>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or gift messaging..."
                  className="w-full bg-transparent border border-neutral-200 p-6 text-sm focus:outline-none focus:border-brand-onyx min-h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="checkout-summary bg-white shadow-[0_30px_60px_rgba(0,0,0,0.04)] p-10 space-y-10 sticky top-32 rounded-sm border border-neutral-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] border-b border-neutral-100 pb-6">Final Summary</h3>

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
                      className="flex-1 bg-[#fafaf8] border-b border-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] focus:outline-none focus:border-brand-onyx transition-all placeholder:text-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="px-8 py-3 bg-brand-onyx text-brand-cream text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-black transition-colors"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 animate-fadeIn">{couponError}</p>}
                </div>

                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                  {cart?.items?.map((item) => (
                    <div key={item.id} className="flex gap-6">
                      <div className="w-16 h-20 bg-neutral-50 shrink-0 rounded-sm overflow-hidden">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest truncate">{item.product.name}</p>
                        <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-widest">Qty: {item.quantity}</p>
                        <p className="text-xs font-serif mt-2">${(item.product.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-8 border-t border-neutral-100">
                   <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                     <span className="text-neutral-400">Inventory Total</span>
                     <span>${subtotal.toLocaleString()}</span>
                   </div>
                   {coupon && (
                     <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-green-600">
                       <span>Privilege Discount</span>
                       <span>−${discount.toLocaleString()}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                     <span className="text-neutral-400">White Glove Delivery</span>
                     <span className="text-brand-gold italic font-normal normal-case text-xs">Complimentary</span>
                   </div>
                   <div className="pt-8 border-t border-neutral-100 flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Total Settlement</span>
                      <span className="text-4xl font-serif font-bold text-brand-onyx leading-none">${total.toLocaleString()}</span>
                   </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 flex items-center gap-3 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit" disabled={placing || !stripe}
                  className="w-full premium-btn py-5 flex items-center justify-center gap-4 text-[11px]"
                >
                  {placing ? (
                    <><span className="spinner" /> Authorizing...</>
                  ) : (
                    <>Finalize Transaction <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <div className="flex flex-col items-center gap-3">
                   <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-300">
                      <ShieldCheck className="w-3 h-3 text-brand-gold" /> Verified Secure Gateway
                   </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};