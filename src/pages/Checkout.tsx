import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, CreditCard, MapPin, Package, Tag, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useCartStore } from '../store/useCartStore';
import { ordersService } from '../services/orders.service';
import { couponsService } from '../services/coupons.service';
import { useAuthStore } from '../store/useAuthStore';

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
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'NZ', name: 'New Zealand' },
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
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
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

  const canPlaceOrder = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!hasHydrated || !token) return;
    fetchCart().catch(() => {});
  }, [fetchCart, hasHydrated, token]);

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

    // Validate address fields
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.postalCode.trim() || !addressForm.country.trim()) {
      setError('Please fill in all shipping address fields');
      return;
    }

    setPlacing(true);
    setError('');
    setCardError('');

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      // Get country name from code for display
      const countryName = COUNTRIES.find(c => c.code === addressForm.country)?.name || addressForm.country;

      // Build full address for backend
      const fullAddress = `${addressForm.street}, ${addressForm.city}, ${addressForm.state} ${addressForm.postalCode}, ${countryName}`;

      // Step 1: Create order
      const orderRes = await ordersService.placeOrder({
        paymentMethod: 'STRIPE',
        shippingAddress: fullAddress,
        couponCode: coupon?.code || undefined,
        notes: notes.trim() || undefined,
      });
      const order = orderRes.data?.data ?? orderRes.data;
      const orderId = order.id;

      // Step 2: Create PaymentIntent on backend
      const intentRes = await ordersService.createStripePaymentIntent(orderId);
      const intentData = (intentRes.data as any)?.data ?? (intentRes.data as any);
      const { clientSecret } = intentData;

      // Step 3: Confirm payment with card
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const confirmRes = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            address: {
              line1: addressForm.street,
              city: addressForm.city,
              state: addressForm.state,
              postal_code: addressForm.postalCode,
              country: addressForm.country,
            },
          },
        },
      });

      if (confirmRes.error) {
        setCardError(confirmRes.error.message || 'Payment failed');
        setPlacing(false);
        return;
      }

      // Payment succeeded
      await clearCart();
      setOrderSuccess({
        orderNumber: order.orderNumber ?? order.id,
        id: order.id,
      });
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
              We’ll send you a confirmation email shortly. Your jewellery will be carefully packaged and shipped.
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
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mt-2">Simple order review</p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">
                  <MapPin className="w-4 h-4 text-brand-gold" /> Shipping Address
                </h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="Street Address *"
                    className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="City *"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                      required
                    />
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="State/Province *"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      placeholder="Postal Code *"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                      required
                    />
                    <select
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                      required
                    >
                      <option value="">Select Country *</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">
                  <CreditCard className="w-4 h-4 text-brand-gold" /> Payment Method
                </h2>
                <div className="flex items-center gap-4 p-5 border-2 border-brand-onyx bg-neutral-50">
                  <span className="text-2xl">💳</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest">Credit/Debit Card</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Pay securely with Stripe</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="bg-neutral-50 border border-neutral-100 p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                  <span className="text-brand-gold">●</span>
                  Enter card details below to proceed securely.
                </div>

                <div className="border border-neutral-200 p-5 bg-white">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-700 mb-3">
                    Card Details
                  </label>
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '14px',
                          color: '#000000',
                          '::placeholder': {
                            color: '#9CA3AF',
                          },
                        },
                        invalid: {
                          color: '#DC2626',
                        },
                      },
                      hidePostalCode: true,
                    }}
                    onChange={(e) => {
                      if (e.error) {
                        setCardError(e.error.message);
                      } else {
                        setCardError('');
                      }
                    }}
                  />
                  {cardError && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{cardError}</p>
                    </div>
                  )}
                </div>
              </div>

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

              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest border-b border-neutral-100 pb-4">Order Notes (Optional)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, gift message, delivery notes, etc."
                  className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-[80px] resize-none"
                  id="order-notes"
                />
              </div>
            </div>

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

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  id="place-order-btn"
                  disabled={placing || !stripe}
                  className="w-full premium-btn flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <><span className="spinner" /> Processing Payment...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay ${total.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                    </>
                  )}
                </button>

                <p className="text-[9px] text-neutral-400 text-center uppercase tracking-widest leading-loose">
                  Your payment information is encrypted and secure.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};