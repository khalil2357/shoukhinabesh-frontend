import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, ChevronLeft, Star, Send, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { productsService } from '../services/products.service';
import { reviewsService } from '../services/reviews.service';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface Review { id: string; rating: number; comment: string; createdAt?: string; user?: { name?: string; email?: string } | null; }
interface Product {
  id: string; name: string; slug: string; description: string; price: number;
  stock: number; images: string[]; isPublished: boolean;
  category?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
}

const extractReviews = (payload: unknown): Review[] => {
  if (Array.isArray(payload)) return payload as Review[];
  if (!payload || typeof payload !== 'object') return [];

  const envelope = payload as Record<string, unknown>;
  if (Array.isArray(envelope.data)) return envelope.data as Review[];
  if (Array.isArray(envelope.items)) return envelope.items as Review[];

  if (envelope.data && typeof envelope.data === 'object') {
    const nested = envelope.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as Review[];
    if (Array.isArray(nested.items)) return nested.items as Review[];
  }

  return [];
};

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${sz} ${i < rating ? 'text-brand-gold fill-current' : 'text-neutral-200'}`} />
      ))}
    </div>
  );
};

const InteractiveStar = ({ rating, onRate }: { rating: number; onRate: (r: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button" onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)} onClick={() => onRate(i + 1)}>
          <Star className={`w-6 h-6 transition-colors ${(hover || rating) > i ? 'text-brand-gold fill-current' : 'text-neutral-200'}`} />
        </button>
      ))}
    </div>
  );
};

export const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist, fetchWishlist } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string, type: 'success'|'error'} | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (title: string, desc: string, type: 'success'|'error') => {
    setToastMsg({ title, desc, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setTimeout(() => {
      gsap.killTweensOf('.premium-toast');
      gsap.fromTo('.premium-toast',
        { y: -30, scale: 0.8, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.7)' }
      );
    }, 10);

    toastTimerRef.current = setTimeout(() => {
      gsap.to('.premium-toast', {
        y: -30, scale: 0.8, opacity: 0, duration: 0.4, ease: 'power3.in',
        onComplete: () => setToastMsg(null)
      });
    }, 4000);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productsService.getProductBySlug(slug)
      .then((res) => {
        const data = res.data;
        const p = data?.data ?? data;
        setProduct(p);
        const pid = p?.id;
        if (pid) {
          reviewsService.getProductReviews(pid).then((r) => {
            setReviews(extractReviews(r.data));
          }).catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));

    if (isAuthenticated) {
      fetchWishlist().catch(() => {});
    }
  }, [slug, isAuthenticated, fetchWishlist]);

  useGSAP(() => {
    if (!loading && product) {
      const tl = gsap.timeline();
      tl.fromTo('.product-breadcrumb', 
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power4.out' }
      )
      .fromTo('.product-gallery', 
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power4.out' },
        '-=0.6'
      )
      .fromTo('.product-info-widget', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' },
        '-=1'
      )
      .fromTo('.info-reveal', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'back.out(1.2)' },
        '-=0.6'
      );

      gsap.fromTo('.review-widget',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      try {
        window.dispatchEvent(new CustomEvent('show-nav-message', { detail: { message: 'ADDED TO VAULT', type: 'vault' } }));
      } catch {}
    } catch (error: any) {
      if (error?.response?.status === 401) {
        useAuthStore.getState().logout();
        navigate('/login');
        return;
      }
      showToast('Transaction Failed', 'Unable to secure item. Please try again.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!product) return;
    try {
      await toggleWishlist(product.id);
    } catch (error) {
      console.error(error);
    }
  };

  const isFavorite = product ? isInWishlist(product.id) : false;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isAuthenticated) return;
    setSubmittingReview(true);
    try {
      const res = await reviewsService.createReview({ productId: product.id, rating: reviewForm.rating, comment: reviewForm.comment });
      const newReview = res.data?.data ?? res.data;
      setReviews((prev) => [{ ...(newReview as Review), user: { name: user?.name } }, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      setReviewMsg('Review submitted successfully.');
      setTimeout(() => setReviewMsg(''), 3000);
    } catch {
      setReviewMsg('Verified purchase required for review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="pt-40 pb-40 px-6 bg-[#fafaf8] min-h-screen">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[4/5] skeleton rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)]" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square skeleton rounded-2xl" />)}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-12 py-10">
            <div className="space-y-4">
              <div className="h-4 skeleton w-1/4 rounded-full" />
              <div className="h-16 skeleton w-full rounded-2xl" />
              <div className="h-8 skeleton w-1/3 rounded-full" />
            </div>
            <div className="h-40 skeleton w-full rounded-[2rem]" />
            <div className="h-16 skeleton w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-40 text-center bg-[#fafaf8]">
        <p className="text-8xl font-serif text-neutral-100 italic">?</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-neutral-300 mt-8">Masterpiece Not Found</p>
        <Link to="/shop" className="inline-block mt-12 premium-btn px-12 py-4">Return to Shop</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [''];

  return (
    <div ref={containerRef} className="pt-32 pb-40 px-6 bg-[#fafaf8] overflow-hidden min-h-screen">
      <div className="max-w-[1280px] mx-auto">
        {/* Breadcrumb */}
        <div className="product-breadcrumb mb-12 flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-neutral-400 bg-white/40 backdrop-blur-xl w-fit px-6 py-3 rounded-full shadow-sm">
          <Link to="/shop" className="hover:text-brand-onyx transition-colors flex items-center gap-2">
            <ChevronLeft className="w-3 h-3" /> Vault
          </Link>
          <span className="text-neutral-300">/</span>
          {product.category?.name && <><span className="text-neutral-500">{product.category.name}</span><span className="text-neutral-300">/</span></>}
          <span className="text-brand-gold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-6 product-gallery">
            <div ref={imageRef} className="aspect-[4/5] bg-white rounded-[3rem] overflow-hidden group shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white relative">
              {images[activeImage] ? (
                <img 
                  src={images[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-[2.5s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl text-neutral-200 italic font-serif">S</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)} 
                    className={`aspect-square overflow-hidden rounded-2xl transition-all duration-500 border-2 ${activeImage === i ? 'border-brand-onyx scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-5 product-info-widget lg:sticky lg:top-32">
            <div className="bg-white/60 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-white space-y-10">
              <div className="space-y-6">
                {product.category?.name && (
                  <span className="info-reveal inline-block px-4 py-1.5 bg-brand-gold/10 text-brand-gold text-[9px] font-black uppercase tracking-[0.6em] rounded-full">
                    {product.category.name}
                  </span>
                )}
                <h1 className="info-reveal text-5xl md:text-6xl font-serif font-black tracking-tighter leading-[0.9] text-brand-onyx">
                  {product.name.split(' ').map((word, i) => (
                    <span key={i} className={i % 2 === 1 ? 'italic font-medium text-brand-onyx/80' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                
                <div className="info-reveal flex items-center gap-6 pt-2">
                  <p className="text-3xl font-serif italic text-brand-onyx">${Number(product.price).toLocaleString()}</p>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-50">
                      <StarRating rating={Math.round(avgRating)} size="sm" />
                      <span className="text-[10px] text-brand-onyx font-black tracking-widest ml-1">{avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-reveal space-y-6">
                 <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                   {product.description}
                 </p>
                 
                 <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] bg-white w-fit px-5 py-2.5 rounded-full shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-neutral-200'}`} />
                    <span className={product.stock > 0 ? 'text-brand-onyx' : 'text-neutral-400'}>
                      {product.stock > 0 ? `Currently Secured: ${product.stock} Units Available` : 'Sold Out for the Season'}
                    </span>
                 </div>
              </div>

              {/* Quantity & CTA */}
              {product.stock > 0 && (
                <div className="info-reveal space-y-6 pt-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center border border-neutral-100 rounded-full px-2 h-[60px] bg-white shadow-sm flex-shrink-0">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-xl text-neutral-400 hover:text-brand-onyx transition-colors" id="qty-dec">−</button>
                      <span className="w-10 text-center font-black text-xs">{quantity < 10 ? `0${quantity}` : quantity}</span>
                      <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-12 h-full flex items-center justify-center text-xl text-neutral-400 hover:text-brand-onyx transition-colors" id="qty-inc">+</button>
                    </div>
                    
                    <button 
                      id="add-to-cart-btn" 
                      onClick={handleAddToCart} 
                      disabled={adding} 
                      className="flex-1 w-full flex items-center justify-center gap-4 bg-brand-onyx text-white h-[60px] rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none"
                    >
                      <ShoppingBag className="w-4 h-4 text-brand-gold" />
                      {adding ? 'Securing Item...' : 'Add to Vault'}
                    </button>
                    
                    <button 
                      onClick={handleWishlistToggle}
                      className={`h-[60px] w-[60px] flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-500 shadow-sm ${isFavorite ? 'bg-brand-onyx text-brand-gold shadow-[0_10px_20px_rgba(0,0,0,0.1)]' : 'bg-white text-neutral-400 hover:text-rose-500 hover:shadow-md'}`} 
                      aria-label="Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-brand-gold text-brand-gold' : ''}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="info-reveal grid grid-cols-3 gap-4 pt-6 border-t border-neutral-100/50">
                 {[
                   { icon: Truck, label: 'Global Dispatch' },
                   { icon: ShieldCheck, label: 'Certified Origin' },
                   { icon: RefreshCcw, label: 'Elite Exchange' }
                 ].map((item, idx) => (
                   <div key={idx} className="flex flex-col items-center justify-center text-center gap-3 bg-white/40 rounded-2xl p-4 border border-white shadow-sm">
                     <item.icon className="w-5 h-5 text-brand-gold" strokeWidth={1.5} />
                     <span className="text-[7px] font-black uppercase tracking-widest text-brand-onyx leading-tight">{item.label}</span>
                   </div>
                 ))}
              </div>

              {/* Details accordion */}
              <div className="info-reveal space-y-3 pt-6 border-t border-neutral-100/50">
                {[
                  { title: 'The Craftsmanship', content: `Every piece is meticulously examined. This masterwork is forged from 18k solid gold and features hand-set stones of the highest clarity. ${product.vendor?.name ? `Proudly curated from the ${product.vendor.name} Atelier.` : ''}` },
                  { title: 'Logistics & Security', content: 'Each order is shipped via priority concierge with full insurance coverage. Global delivery typically occurs within 3-5 business days.' },
                  { title: 'Preservation Guide', content: 'To maintain the eternal brilliance of your jewellery, store it in the provided suede pouch and avoid contact with harsh chemicals or abrasive surfaces.' },
                ].map(({ title, content }) => (
                  <details key={title} className="group bg-white/40 rounded-2xl border border-white shadow-sm overflow-hidden">
                    <summary className="flex justify-between items-center cursor-pointer list-none font-black text-[9px] uppercase tracking-[0.4em] px-6 py-5 text-brand-onyx hover:bg-white/60 transition-colors">
                      {title}
                      <ChevronLeft className="w-4 h-4 -rotate-90 group-open:rotate-90 transition-transform text-brand-gold" />
                    </summary>
                    <div className="px-6 pb-6 pt-2 text-xs text-neutral-500 leading-relaxed font-medium">{content}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-40 pt-24 border-t border-neutral-100/50 reviews-container">
          <div className="max-w-[800px] mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 gap-8 text-center md:text-left bg-white/60 backdrop-blur-2xl p-10 rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.02)] border border-white">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold mb-4 block">Client Testimonials</span>
                <div className="flex items-center justify-center md:justify-start gap-6">
                   <h2 className="text-7xl font-serif font-black tracking-tighter leading-none text-brand-onyx">
                     {reviews.length > 0 ? avgRating.toFixed(1) : '—'}
                   </h2>
                   <div className="space-y-2">
                      <StarRating rating={Math.round(avgRating)} size="md" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Based on {reviews.length} Experiences</p>
                   </div>
                </div>
              </div>
              {!isAuthenticated && (
                 <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.4em] bg-white px-6 py-3 rounded-full border border-neutral-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-brand-onyx">
                   Sign In to Review
                 </Link>
              )}
            </div>

            {/* Review list */}
            <div className="space-y-8 mb-24">
              {reviews.map((review) => (
                <div key={review.id} className="review-widget bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-brand-onyx flex items-center justify-center text-xs font-black uppercase text-brand-gold shadow-md">
                         {review.user?.name?.[0] || 'A'}
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-brand-onyx">{review.user?.name ?? 'Private Client'}</p>
                         <p className="text-[8px] text-brand-gold font-bold uppercase tracking-widest mt-1">Verified Member</p>
                       </div>
                    </div>
                    <div className="text-right space-y-2">
                      <StarRating rating={review.rating} size="sm" />
                      {review.createdAt && <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed italic bg-white/50 p-6 rounded-2xl">"{review.comment}"</p>
                </div>
              ))}
              
              {reviews.length === 0 && (
                <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white shadow-sm">
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-400">The first chapter is yours to write</p>
                </div>
              )}
            </div>

            {/* Write a review */}
            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <div className="bg-white/80 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.05)] p-10 md:p-14 rounded-[3rem] border border-white">
                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-brand-onyx mb-10 text-center">Share Your Experience</h3>
                <form onSubmit={handleSubmitReview} className="space-y-10">
                  <div className="space-y-6 flex flex-col items-center">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold">Merit Score</label>
                    <div className="bg-neutral-50 px-8 py-4 rounded-full shadow-inner">
                      <InteractiveStar rating={reviewForm.rating} onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-gold block pl-6">Personal Narrative</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="Describe the piece and your experience..."
                      className="w-full bg-neutral-50 rounded-[2rem] px-8 py-6 text-sm font-medium focus:outline-none focus:ring-2 ring-brand-onyx/10 min-h-[160px] resize-none transition-all placeholder:text-neutral-300 text-brand-onyx"
                      id="review-comment"
                    />
                  </div>
                  {reviewMsg && <p className={`text-[10px] font-black uppercase tracking-[0.4em] text-center bg-white px-6 py-3 rounded-full shadow-sm w-fit mx-auto ${reviewMsg.includes('Verified') ? 'text-rose-500' : 'text-brand-gold'} animate-fadeIn`}>{reviewMsg}</p>}
                  <button type="submit" disabled={submittingReview} className="w-full bg-brand-onyx text-white py-6 rounded-full font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-black shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none">
                    <Send className="w-4 h-4 text-brand-gold" />
                    {submittingReview ? 'Dispatching...' : 'Submit Narrative'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Toast Notification (iOS Style Dynamic Pill) */}
      {toastMsg && (
        <div className="premium-toast fixed top-[100px] left-1/2 -translate-x-1/2 z-[250] bg-brand-onyx/95 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_30px_rgba(244,63,94,0.15)] border border-white/10 px-6 py-3 rounded-full flex items-center justify-center gap-3">
          <div className="relative flex items-center justify-center w-5 h-5 bg-white/10 rounded-full flex-shrink-0">
            {toastMsg.type === 'success' ? <ShieldCheck className="w-3 h-3 text-green-400" /> : <Star className="w-3 h-3 text-rose-400" />}
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest mt-0.5 text-white">
            {toastMsg.title}: <span className="font-medium text-neutral-300 italic normal-case tracking-normal">{toastMsg.desc}</span>
          </span>
        </div>
      )}
    </div>
  );
};
