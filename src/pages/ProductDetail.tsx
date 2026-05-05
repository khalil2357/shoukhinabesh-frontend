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
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }, 10);

    toastTimerRef.current = setTimeout(() => {
      gsap.to('.premium-toast', {
        x: 50, opacity: 0, duration: 0.5, ease: 'power3.in',
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
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
      .fromTo('.product-gallery', 
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, ease: 'power4.out' },
        '-=0.6'
      )
      .fromTo('.product-info', 
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 1, ease: 'power4.out' },
        '-=1'
      )
      .fromTo('.info-reveal', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      );
    }
  }, [loading, product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      showToast('Vault Updated', `${quantity} masterpiece${quantity > 1 ? 's' : ''} secured in your selection.`, 'success');
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
      <div className="pt-40 pb-40 px-6 bg-[#fafaf8]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-24">
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[4/5] skeleton rounded-sm" />
            <div className="grid grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square skeleton rounded-sm" />)}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-12 py-10">
            <div className="space-y-4">
              <div className="h-4 skeleton w-1/4" />
              <div className="h-16 skeleton w-full" />
              <div className="h-8 skeleton w-1/3" />
            </div>
            <div className="h-32 skeleton w-full" />
            <div className="h-16 skeleton w-full" />
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
    <div ref={containerRef} className="pt-32 pb-40 px-6 bg-[#fafaf8] overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/* Breadcrumb */}
        <div className="product-breadcrumb mb-16 flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-neutral-300">
          <Link to="/shop" className="hover:text-brand-onyx transition-colors flex items-center gap-2">
            <ChevronLeft className="w-3 h-3" /> Vault
          </Link>
          <span className="text-neutral-100">/</span>
          {product.category?.name && <><span className="text-neutral-400">{product.category.name}</span><span className="text-neutral-100">/</span></>}
          <span className="text-brand-gold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-8 product-gallery">
            <div ref={imageRef} className="aspect-[4/5] bg-white rounded-sm overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
              {images[activeImage] ? (
                <img 
                  src={images[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl text-neutral-50 italic font-serif">S</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-6">
                {images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)} 
                    className={`aspect-square overflow-hidden rounded-sm transition-all duration-500 ${activeImage === i ? 'ring-2 ring-brand-onyx ring-offset-4 ring-offset-[#fafaf8] scale-95' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-5 space-y-12 product-info py-2">
            <div className="space-y-6">
              {product.category?.name && (
                <span className="info-reveal text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold block">
                  {product.category.name}
                </span>
              )}
              <h1 className="info-reveal text-6xl md:text-7xl font-serif font-bold tracking-tighter leading-[0.9]">
                {product.name.split(' ').map((word, i) => (
                  <span key={i} className={i % 2 === 1 ? 'italic font-normal' : ''}>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              
              <div className="info-reveal flex items-center gap-8 pt-4">
                <p className="text-4xl font-serif text-brand-onyx">${Number(product.price).toLocaleString()}</p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-neutral-100">
                    <StarRating rating={Math.round(avgRating)} size="sm" />
                    <span className="text-[10px] text-neutral-400 font-black tracking-widest">({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="info-reveal space-y-6">
               <p className="text-base text-neutral-500 leading-[1.8] font-light">
                 {product.description}
               </p>
               
               <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em]">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-neutral-200'}`} />
                  <span className={product.stock > 0 ? 'text-green-600' : 'text-neutral-300'}>
                    {product.stock > 0 ? `Currently Secured: ${product.stock} Units Available` : 'Sold Out for the Season'}
                  </span>
               </div>
            </div>

            {/* Quantity & CTA */}
            {product.stock > 0 && (
              <div className="info-reveal space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center border border-neutral-200 rounded-full px-4 h-[60px] bg-white">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-2xl hover:text-brand-gold transition-colors" id="qty-dec">−</button>
                    <span className="w-12 text-center font-black text-[11px] tracking-widest">{quantity < 10 ? `0${quantity}` : quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 flex items-center justify-center text-2xl hover:text-brand-gold transition-colors" id="qty-inc">+</button>
                  </div>
                  
                  <button 
                    id="add-to-cart-btn" 
                    onClick={handleAddToCart} 
                    disabled={adding} 
                    className="flex-1 premium-btn h-[60px] w-full flex items-center justify-center gap-4 bg-brand-onyx text-brand-cream hover:bg-black group"
                  >
                    <ShoppingBag className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                    <span className="text-[11px] font-black tracking-[0.4em]">
                      {adding ? 'Securing Item...' : 'Add to Vault'}
                    </span>
                  </button>
                  
                  <button 
                    onClick={handleWishlistToggle}
                    className={`h-[60px] w-[60px] flex items-center justify-center border rounded-full transition-all duration-700 ${isFavorite ? 'bg-brand-onyx border-brand-onyx text-brand-cream' : 'border-neutral-200 hover:bg-white text-neutral-400 hover:text-brand-onyx'}`} 
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="info-reveal grid grid-cols-3 gap-6 pt-6 border-t border-neutral-100">
               {[
                 { icon: Truck, label: 'Global Dispatch' },
                 { icon: ShieldCheck, label: 'Certified Origin' },
                 { icon: RefreshCcw, label: 'Elite Exchange' }
               ].map((item, idx) => (
                 <div key={idx} className="flex flex-col items-center text-center gap-3">
                   <item.icon className="w-5 h-5 text-neutral-200" strokeWidth={1} />
                   <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">{item.label}</span>
                 </div>
               ))}
            </div>

            {/* Details accordion */}
            <div className="info-reveal space-y-0 pt-6">
              {[
                { title: 'The Craftsmanship', content: `Every piece is meticulously examined. This masterwork is forged from 18k solid gold and features hand-set stones of the highest clarity. ${product.vendor?.name ? `Proudly curated from the ${product.vendor.name} Atelier.` : ''}` },
                { title: 'Logistics & Security', content: 'Each order is shipped via priority concierge with full insurance coverage. Global delivery typically occurs within 3-5 business days.' },
                { title: 'Preservation Guide', content: 'To maintain the eternal brilliance of your jewellery, store it in the provided suede pouch and avoid contact with harsh chemicals or abrasive surfaces.' },
              ].map(({ title, content }) => (
                <details key={title} className="group border-b border-neutral-100">
                  <summary className="flex justify-between items-center cursor-pointer list-none font-black text-[10px] uppercase tracking-[0.4em] py-6 text-neutral-400 hover:text-brand-onyx transition-colors">
                    {title}
                    <ChevronLeft className="w-3 h-3 -rotate-90 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="pb-8 text-xs text-neutral-500 leading-relaxed font-light">{content}</div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-40 pt-24 border-t border-neutral-100">
          <div className="max-w-[800px] mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-20 gap-10 text-center md:text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold mb-4 block">Client Testimonials</span>
                <div className="flex items-center gap-6">
                   <h2 className="text-7xl font-serif font-bold tracking-tighter leading-none">
                     {reviews.length > 0 ? avgRating.toFixed(1) : '—'}
                   </h2>
                   <div className="space-y-2">
                      <StarRating rating={Math.round(avgRating)} size="md" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-300">Based on {reviews.length} Experiences</p>
                   </div>
                </div>
              </div>
              {!isAuthenticated && (
                 <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.4em] border-b-2 border-brand-onyx pb-2 hover:opacity-60 transition-opacity">
                   Sign In to Review
                 </Link>
              )}
            </div>

            {/* Review list */}
            <div className="space-y-16 mb-24">
              {reviews.map((review) => (
                <div key={review.id} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-black uppercase text-neutral-300">
                         {review.user?.name?.[0] || 'A'}
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-brand-onyx">{review.user?.name ?? 'Private Client'}</p>
                         <p className="text-[8px] text-neutral-300 uppercase tracking-widest mt-1">Verified Member</p>
                       </div>
                    </div>
                    <div className="text-right space-y-1">
                      <StarRating rating={review.rating} size="sm" />
                      {review.createdAt && <p className="text-[8px] text-neutral-300 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <p className="text-base text-neutral-500 font-light leading-relaxed italic">"{review.comment}"</p>
                  <div className="h-[1px] w-full bg-neutral-50" />
                </div>
              ))}
              
              {reviews.length === 0 && (
                <div className="text-center py-20 bg-white rounded-sm border border-dashed border-neutral-100">
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-200">The first chapter is yours to write</p>
                </div>
              )}
            </div>

            {/* Write a review */}
            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <div className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.03)] p-12 rounded-sm border border-neutral-50">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-onyx mb-10 text-center">Share Your Experience</h3>
                <form onSubmit={handleSubmitReview} className="space-y-10">
                  <div className="space-y-4 flex flex-col items-center">
                    <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400">Merit Score</label>
                    <InteractiveStar rating={reviewForm.rating} onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-400 block">Personal Narrative</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="Describe the piece and your experience..."
                      className="w-full bg-[#fafaf8] border-b-2 border-transparent px-6 py-6 text-sm focus:outline-none focus:border-brand-onyx min-h-[150px] resize-none transition-all placeholder:text-neutral-200"
                      id="review-comment"
                    />
                  </div>
                  {reviewMsg && <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-center ${reviewMsg.includes('Verified') ? 'text-rose-500' : 'text-brand-gold'} animate-fadeIn`}>{reviewMsg}</p>}
                  <button type="submit" disabled={submittingReview} className="w-full premium-btn py-5 flex items-center justify-center gap-4 text-[11px]">
                    <Send className="w-4 h-4" />
                    {submittingReview ? 'Dispatching...' : 'Submit Narrative'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Toast Notification */}
      {toastMsg && (
        <div className="premium-toast fixed bottom-8 right-8 z-50 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-neutral-100 p-6 flex items-start gap-5 max-w-sm">
          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toastMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-500'}`}>
            {toastMsg.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-onyx">{toastMsg.title}</h4>
            <p className="text-xs text-neutral-500 mt-2 font-light leading-relaxed">{toastMsg.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
};
