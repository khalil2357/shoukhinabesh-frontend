import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Heart, ChevronLeft, Star, Send } from 'lucide-react';
import { productsService } from '../services/products.service';
import { reviewsService } from '../services/reviews.service';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

interface Review { id: string; rating: number; comment: string; createdAt?: string; user?: { name?: string; email?: string } | null; }
interface Product {
  id: string; name: string; slug: string; description: string; price: number;
  stock: number; images: string[]; isPublished: boolean;
  category?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
}

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${sz} ${i < rating ? 'star-filled fill-current' : 'star-empty'}`} />
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
          <Star className={`w-5 h-5 transition-colors ${(hover || rating) > i ? 'star-filled fill-current' : 'star-empty'}`} />
        </button>
      ))}
    </div>
  );
};

export const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productsService.getProductBySlug(slug)
      .then((res) => {
        const data = res.data;
        const p = data?.data ?? data;
        setProduct(p);
        // Fetch reviews if we have product id
        const pid = p?.id;
        if (pid) {
          reviewsService.getProductReviews(pid).then((r) => {
            const rd = r.data;
            setReviews(Array.isArray(rd) ? rd : (rd?.data?.data ?? rd?.data ?? rd?.items ?? []));
          }).catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      setAddedMsg('Added to cart!');
      setTimeout(() => setAddedMsg(''), 3000);
    } catch {
      setAddedMsg('Failed to add to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !isAuthenticated) return;
    setSubmittingReview(true);
    try {
      const res = await reviewsService.createReview({ productId: product.id, rating: reviewForm.rating, comment: reviewForm.comment });
      const newReview = res.data?.data ?? res.data;
      setReviews((prev) => [{ ...newReview, user: { name: user?.name } }, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      setReviewMsg('Review submitted!');
      setTimeout(() => setReviewMsg(''), 3000);
    } catch {
      setReviewMsg('You may need a delivered order to review this product.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] skeleton" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-square skeleton" />)}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <div className="h-3 skeleton w-1/3" />
              <div className="h-10 skeleton w-full" />
              <div className="h-6 skeleton w-1/4" />
            </div>
            <div className="h-24 skeleton w-full" />
            <div className="h-12 skeleton w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-32 pb-24 text-center">
        <p className="text-4xl font-serif text-neutral-200">✦</p>
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-400 mt-4">Product not found</p>
        <Link to="/shop" className="inline-block mt-6 text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1">Back to Shop</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [''];

  return (
    <div className="pt-24 pb-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          <Link to="/shop" className="hover:text-brand-onyx transition-colors flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> Shop
          </Link>
          <span>/</span>
          {product.category?.name && <><span>{product.category.name}</span><span>/</span></>}
          <span className="text-brand-onyx">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-neutral-50 overflow-hidden">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-neutral-200">✦</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`aspect-square overflow-hidden border-2 transition-colors ${activeImage === i ? 'border-brand-onyx' : 'border-transparent'}`}>
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              {product.category?.name && (
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">{product.category.name}</span>
              )}
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">{product.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-serif text-brand-gold">${Number(product.price).toLocaleString()}</p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(avgRating)} size="sm" />
                    <span className="text-[10px] text-neutral-400 font-bold">({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed">{product.description}</p>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-400' : 'bg-neutral-300'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Quantity & CTA */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center border border-neutral-200">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-lg hover:bg-neutral-50 transition-colors" id="qty-dec">−</button>
                    <span className="w-12 text-center font-bold text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-3 text-lg hover:bg-neutral-50 transition-colors" id="qty-inc">+</button>
                  </div>
                  <button id="add-to-cart-btn" onClick={handleAddToCart} disabled={adding} className="flex-1 premium-btn flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button className="p-3 border border-neutral-200 hover:bg-neutral-50 transition-colors" aria-label="Wishlist">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                {addedMsg && <p className={`text-[10px] font-bold uppercase tracking-widest ${addedMsg.includes('Failed') ? 'text-rose-500' : 'text-green-600'}`}>{addedMsg}</p>}
              </div>
            )}

            {/* Details accordion */}
            <div className="space-y-0 border-t border-neutral-100 pt-8">
              {[
                { title: 'Product Details', content: `Material: 18k gold. ${product.vendor?.name ? `By ${product.vendor.name}.` : ''} Handcrafted with premium materials.` },
                { title: 'Shipping & Returns', content: 'Complimentary worldwide shipping. Returns accepted within 30 days of delivery.' },
                { title: 'Care Guide', content: 'Store in provided pouch. Clean with soft cloth. Avoid contact with perfumes and chemicals.' },
              ].map(({ title, content }) => (
                <details key={title} className="group border-b border-neutral-100">
                  <summary className="flex justify-between items-center cursor-pointer list-none font-bold text-[10px] uppercase tracking-widest py-4">
                    {title}
                    <ChevronLeft className="w-3 h-3 -rotate-90 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="pb-4 text-xs text-neutral-500 leading-relaxed">{content}</div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 border-t border-neutral-100 pt-16">
          <div className="max-w-3xl">
            <div className="flex items-end justify-between mb-10 gap-6">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Customer Reviews</span>
                <h2 className="text-3xl font-serif font-bold tracking-tighter">
                  {reviews.length > 0 ? `${avgRating.toFixed(1)} / 5` : 'No reviews yet'}
                </h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(avgRating)} size="md" />
                    <span className="text-[10px] text-neutral-400 font-bold">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Review list */}
            <div className="space-y-8 mb-12">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-neutral-100 pb-8">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">{review.user?.name ?? 'Anonymous'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        {review.createdAt && <span className="text-[9px] text-neutral-400">{new Date(review.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>

            {/* Write a review */}
            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <div className="bg-white border border-neutral-100 p-8">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Your Rating</label>
                    <InteractiveStar rating={reviewForm.rating} onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Your Review</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="Share your experience with this piece..."
                      className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-[100px] resize-none"
                      id="review-comment"
                    />
                  </div>
                  {reviewMsg && <p className={`text-[10px] font-bold uppercase tracking-widest ${reviewMsg.includes('need') ? 'text-rose-500' : 'text-green-600'}`}>{reviewMsg}</p>}
                  <button type="submit" disabled={submittingReview} className="premium-btn flex items-center gap-2">
                    <Send className="w-3 h-3" />
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {!isAuthenticated && (
              <div className="bg-neutral-50 border border-neutral-100 p-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Want to leave a review?</p>
                <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest border-b border-brand-onyx pb-1">Sign in to your account</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
