import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CreditCard, MapPin, Tag, Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { loadStripe } from '@stripe/stripe-js';
import { ordersService, type StripePaymentIntentPayload } from '../services/orders.service';
import { couponsService } from '../services/coupons.service';
import { useAuthStore } from '../store/useAuthStore';

interface CouponResult { code: string; discountType: string; discountValue: number; }

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Stripe', desc: 'Credit/Debit Card', icon: '💳' },
  { id: 'offline', label: 'Offline Payment', desc: 'Pay later — Cash on Delivery / Bank Transfer', icon: '🏷️' },
];

export const Checkout = () => {
  const location = useLocation();
  const { cart, fetchCart, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const cardElementRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);

  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>((location.state as { coupon?: CouponResult })?.coupon ?? null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; id: string } | null>(null);

  // Card form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardError, setCardError] = useState('');

  const canPlaceOrder = user?.role === 'CUSTOMER';

  useEffect(() => {
    fetchCart().catch(() => {});
  }, []);

  // Initialize Stripe when component mounts
  useEffect(() => {
    const initStripe = async () => {
      if (paymentMethod !== 'stripe' || !cardElementRef.current) return;

      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        setCardError('Missing Stripe configuration');
        return;
      }

      if (!stripeRef.current) {
        stripeRef.current = await loadStripe(publishableKey);
      }

      if (stripeRef.current && !elementsRef.current) {
        elementsRef.current = stripeRef.current.elements();
        const cardElement = elementsRef.current.create('card');
        cardElement.mount(cardElementRef.current);
        cardElement.addEventListener('change', (event: any) => {
          setCardError(event.error ? event.error.message : '');
        });
      }
    };

    initStripe();
  }, [paymentMethod]);

  if (!canPlaceOrder) {
    return (
      <div className="pt-32 pb-24 px-6 text-center">
        <CreditCard className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
        <h1 className="text-3xl font-serif font-bold mb-4">Checkout unavailable</h1>
        <p className="text-sm text-neutral-500 mb-6">Only customer accounts can place orders.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/shop" className="premium-btn">Back to Shop</Link>
          <Link to="/dashboard" className="px-6 py-3 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest hover:border-brand-onyx transition-colors">
            Go to Dashboard
          </Link>
        </div>
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
    setPlacing(true);
    setError('');
    try {
      if (paymentMethod === 'offline') {
        const res = await ordersService.placeOrder({
          paymentMethod: 'OFFLINE',
          shippingAddress: shippingAddress.trim() || undefined,
          couponCode: coupon?.code || undefined,
          notes: notes.trim() || undefined,
        });
        const order = res.data?.data ?? res.data;
        await clearCart();
        setOrderSuccess({ orderNumber: order.orderNumber ?? order.id, id: order.id });
      } else if (paymentMethod === 'stripe') {
        if (!stripeRef.current || !elementsRef.current) {
          throw new Error('Stripe not initialized. Please refresh and try again.');
        }

        if (!cardholderName.trim()) {
          throw new Error('Cardholder name is required');
        }

        // Create Payment Intent with full order details
        const intentPayload: StripePaymentIntentPayload = {
          amount: Math.round(total * 100),
          currency: 'usd',
          items: cart.items.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: Math.round(item.product.price * 100),
          })),
          shippingAddress: shippingAddress.trim() || undefined,
          couponCode: coupon?.code || undefined,
          notes: notes.trim() || undefined,
          customerName: cardholderName,
          customerEmail: user?.email,
        };

        console.log('[Stripe] Creating payment intent with payload:', intentPayload);
        let intentRes;
        try {
          intentRes = await ordersService.createStripePaymentIntent(intentPayload);
          console.log('[Stripe] Payment intent response:', intentRes.data);
        } catch (intentErr: unknown) {
          const e = intentErr as any;
          console.error('[Stripe] Payment intent error:', e);
          console.error('[Stripe] Full error response:', e.response?.data);
          if (e.response?.data?.errors && Array.isArray(e.response.data.errors)) {
            console.error('[Stripe] Validation errors:', e.response.data.errors);
            const errorList = e.response.data.errors.map((err: any) => {
              if (typeof err === 'string') return err;
              return `${err.field || err.path || 'unknown'}: ${err.message || JSON.stringify(err)}`;
            }).join('; ');
            throw new Error(`Payment setup failed: ${errorList}`);
          }
          const backendMsg = e.response?.data?.message || e.response?.data?.error || e.message;
          throw new Error(`Payment setup failed: ${backendMsg || 'Unknown error'}`);
        }

        const clientSecret = intentRes.data?.clientSecret ?? intentRes.data?.data?.clientSecret;

        if (!clientSecret) {
          throw new Error('Failed to create payment intent: no clientSecret in response');
        }

        // Get card element and confirm payment
        const cardElement = elementsRef.current.getElement('card');
        const result = await stripeRef.current.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { name: cardholderName },
          },
        });

        if (result.error) {
          throw new Error(result.error.message || 'Payment failed');
        }

        if (result.paymentIntent.status === 'succeeded') {
          // Payment successful, now place order
          const res = await ordersService.placeOrder({
            paymentMethod: 'STRIPE',
            shippingAddress: shippingAddress.trim() || undefined,
            couponCode: coupon?.code || undefined,
            notes: notes.trim() || undefined,
          });
          const order = res.data?.data ?? res.data;
          await clearCart();
          setOrderSuccess({ orderNumber: order.orderNumber ?? order.id, id: order.id });
        } else {
          throw new Error(`Payment not completed. Status: ${result.paymentIntent.status}`);
        }
      }
    } catch (err: unknown) {
      const e = err as any;
      console.error('[Checkout] Error:', e);
      let errorMsg = 'Failed to place order. Please try again.';
      if (e.response?.data?.message) {
        errorMsg = e.response.data.message;
      } else if (e.response?.data?.error) {
        errorMsg = e.response.data.error;
      } else if (e.message) {
        errorMsg = e.message;
      }
      setError(errorMsg);
    } finally {
      setPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="max-w-md w-full text-center space-y-8">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold tracking-tighter">Order Placed!</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Thank you for your purchase</p>
          </div>
          <div className="bg-white border border-neutral-100 p-8 space-y-4">
            <p className="text-xs text-neutral-500">Your order number</p>
            <p className="text-2xl font-serif font-bold text-brand-gold">{orderSuccess.orderNumber}</p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We'll send you a confirmation email shortly. Your jewellery will be carefully packaged and shipped.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard/orders" className="premium-btn flex items-center gap-2">
              <Package className="w-4 h-4" /> Track Order
            </Link>
            <Link to="/shop" className="px-6 py-3 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest hover:border-brand-onyx transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="pt-32 pb-24 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">Your cart is empty</p>
        <Link to="/shop" className="premium-btn">Explore Collection</Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <Link to="/cart" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to Cart
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">Checkout</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mt-2">Secure & Encrypted</p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left — form */}
            <div className="lg:col-span-7 space-y-10">
              {/* Shipping */}
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">
                  <MapPin className="w-4 h-4 text-brand-gold" /> Shipping Address
                </h2>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your full shipping address (optional)"
                  className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-[100px] resize-none"
                  id="shipping-address"
                />
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">
                  <CreditCard className="w-4 h-4 text-brand-gold" /> Payment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-5 border-2 cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-brand-onyx bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="sr-only"
                        id={`payment-${method.id}`}
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">{method.label}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{method.desc}</p>
                      </div>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-brand-onyx' : 'border-neutral-300'}`}>
                        {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-brand-onyx" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card Details (Stripe) */}
              {paymentMethod === 'stripe' && (
                <div className="space-y-4 bg-neutral-50 border border-neutral-100 p-6">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">
                    <CreditCard className="w-4 h-4 text-brand-gold" /> Card Details
                  </h2>
                  
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="cardholder-name" className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-2">
                        Cardholder Name
                      </label>
                      <input
                        id="cardholder-name"
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Full name as it appears on card"
                        className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="card-element" className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 block mb-2">
                        Card Information
                      </label>
                      <div 
                        id="card-element"
                        ref={cardElementRef}
                        className="border border-neutral-200 px-4 py-3 bg-white rounded"
                      />
                      {cardError && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mt-2">{cardError}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon */}
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">
                  <Tag className="w-4 h-4 text-brand-gold" /> Coupon Code
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-1 border border-neutral-200 px-4 py-3 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-onyx"
                    id="checkout-coupon"
                  />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} className="px-6 py-3 bg-brand-onyx text-brand-cream text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-neutral-800 transition-colors">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{couponError}</p>}
                {coupon && <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">✓ {coupon.code} applied — {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `$${coupon.discountValue} off`}</p>}
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">Order Notes (Optional)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, gift message, etc."
                  className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-[80px] resize-none"
                  id="order-notes"
                />
              </div>
            </div>

            {/* Right — summary */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-neutral-100 p-8 space-y-8 sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] border-b border-neutral-100 pb-4">Your Items ({cart.items.length})</h3>

                <div className="space-y-4 max-h-72 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-14 h-16 bg-neutral-100 shrink-0 overflow-hidden">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">✦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest truncate">{item.product.name}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-serif shrink-0">${(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-xs font-bold uppercase tracking-widest border-t border-neutral-100 pt-6">
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
                    <span className="text-brand-gold italic font-normal normal-case">Free</span>
                  </div>
                  <div className="flex justify-between text-base border-t border-neutral-100 pt-3">
                    <span>Total</span>
                    <span className="font-serif">${total.toLocaleString()}</span>
                  </div>
                </div>

                {error && <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">{error}</p>}

                <button
                  type="submit"
                  id="place-order-btn"
                  disabled={placing}
                  className="w-full premium-btn flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <><span className="spinner" /> Processing...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      {paymentMethod === 'stripe' ? 'Pay Now' : 'Place Order'} — ${total.toLocaleString()}</>
                  )}
                </button>

                <p className="text-[9px] text-neutral-400 text-center uppercase tracking-widest leading-loose">
                  🔒 SSL encrypted · Your data is safe
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
