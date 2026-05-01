import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck, RefreshCw } from 'lucide-react';
import { categoriesService } from '../services/categories.service';
import { productsService } from '../services/products.service';

interface Category { id: string; name: string; slug: string; imageUrl?: string | null; }
interface Product { id: string; name: string; slug: string; price: number; images: string[]; category?: { name: string } | null; }

const CATEGORY_IMAGES: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop',
  rings: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop',
  bracelets: 'https://images.unsplash.com/photo-1611591437281-460bfbe1520a?q=80&w=800&auto=format&fit=crop',
};

const FALLBACK_PRODUCTS: Product[] = [
  { id: '1', name: 'Diamond Drop Earrings', slug: 'diamond-drop-earrings', price: 2400, images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800'], category: { name: 'Earrings' } },
  { id: '2', name: 'Gold Link Bracelet', slug: 'gold-link-bracelet', price: 1850, images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1520a?q=80&w=800'], category: { name: 'Bracelets' } },
  { id: '3', name: 'Sapphire Pendant', slug: 'sapphire-pendant', price: 3200, images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800'], category: { name: 'Necklaces' } },
];

const features = [
  { icon: Shield, title: 'Authenticated Gems', desc: 'Every stone certified by GIA' },
  { icon: Truck, title: 'Complimentary Shipping', desc: 'Worldwide on all orders' },
  { icon: RefreshCw, title: 'Easy Returns', desc: 'Hassle-free 30-day policy' },
  { icon: Star, title: 'Artisan Crafted', desc: 'Hand-finished in Milan' },
];

export const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    categoriesService.getCategories()
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
        setCategories(list.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoadingCats(false));

    productsService.getProducts({ limit: 3, order: 'desc', sortBy: 'createdAt' })
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.data?.data ?? data?.data ?? data?.items ?? []);
        if (list.length > 0) setFeaturedProducts(list);
      })
      .catch(() => {});
  }, []);

  const getCatImage = (cat: Category) => {
    if (cat.imageUrl) return cat.imageUrl;
    const key = cat.name.toLowerCase();
    return CATEGORY_IMAGES[key] || CATEGORY_IMAGES.default;
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-[92vh] flex items-center justify-center overflow-hidden bg-[#fafaf8]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[22vw] font-serif font-black text-brand-onyx/[0.03] leading-none tracking-tighter">GOLD</span>
        </div>
        <div className="container mx-auto px-6 text-center z-10 space-y-8">
          <span className="text-[10px] uppercase font-bold tracking-[0.6em] text-neutral-400 block animate-fadeInUp">
            Timeless Elegance · Ethically Sourced · Artisan Made
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-serif font-bold leading-[0.88] tracking-tighter animate-fadeInUp">
            Rare Finds.<br />
            <span className="italic font-normal text-brand-gold">Pure Gold.</span>
          </h1>
          <p className="text-sm text-neutral-500 max-w-md mx-auto font-light leading-relaxed animate-fadeInUp">
            Each piece is a testament to master craftsmanship — ethically sourced diamonds, 24k recycled gold, and stories worth wearing.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center animate-fadeInUp">
            <Link to="/shop" id="hero-shop-btn" className="premium-btn min-w-[220px] text-[11px] tracking-[0.3em]">
              Explore the Collection
            </Link>
            <Link to="/shop" className="text-[10px] font-bold uppercase tracking-[0.3em] border-b border-brand-onyx pb-1.5 hover:opacity-60 transition-opacity flex items-center gap-2">
              View Lookbook <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-[1px] h-12 bg-brand-onyx" />
          <span className="text-[8px] font-bold uppercase tracking-[0.4em]">Scroll</span>
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-brand-onyx text-brand-cream py-5 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-brand-gold shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">{title}</p>
                <p className="text-[9px] text-neutral-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-3 block">Browse by Category</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">Shop the Collection</h2>
            </div>
            <Link to="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-neutral-300 hover:border-brand-onyx transition-all pb-1 whitespace-nowrap">All Pieces</Link>
          </div>
          {loadingCats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square skeleton" />)}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/shop?categoryId=${cat.id}`} className="group relative aspect-square overflow-hidden bg-neutral-100">
                  <img src={getCatImage(cat)} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-brand-onyx/30 group-hover:bg-brand-onyx/50 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <p className="text-brand-cream text-[10px] font-bold uppercase tracking-widest">{cat.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['Rings', 'Necklaces', 'Earrings', 'Bracelets'] as const).map((name) => (
                <Link key={name} to={`/shop?search=${name.toLowerCase()}`} className="group relative aspect-[3/4] overflow-hidden bg-neutral-100">
                  <img src={CATEGORY_IMAGES[name.toLowerCase() as keyof typeof CATEGORY_IMAGES]} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-brand-onyx/25 group-hover:bg-brand-onyx/45 transition-colors" />
                  <div className="absolute inset-0 flex items-end p-6">
                    <p className="text-brand-cream text-xs font-bold uppercase tracking-widest">{name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="section-padding grid grid-cols-1 lg:grid-cols-2 gap-20 items-center bg-brand-cream">
        <div className="relative aspect-[4/5] overflow-hidden group">
          <img src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1000&auto=format&fit=crop" alt="Craftsmanship" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" loading="lazy" />
          <div className="absolute bottom-8 left-8 bg-brand-cream/95 p-5 max-w-[200px]">
            <p className="text-2xl font-serif font-bold">100%</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Conflict-Free Gems</p>
          </div>
        </div>
        <div className="space-y-10">
          <div className="space-y-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-gold">Our Promise</span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight tracking-tighter">Crafted for the<br />extraordinary.</h2>
            <p className="text-base text-neutral-500 leading-relaxed max-w-md font-light">
              Every piece in our collection is a testament to the master jeweler's art. From ethically sourced diamonds to 24k recycled gold, we prioritize sustainability without compromising on luxury.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-4">
            {[{ val: '100%', label: 'Ethically Sourced' }, { val: 'Hand', label: 'Finished in Milan' }, { val: '50+', label: 'Master Artisans' }, { val: '24k', label: 'Recycled Gold' }].map(({ val, label }) => (
              <div key={label} className="space-y-1">
                <p className="text-2xl font-serif font-bold">{val}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
              </div>
            ))}
          </div>
          <Link to="/shop" className="flex items-center gap-4 font-bold uppercase text-[10px] tracking-[0.3em] group pt-6">
            Explore Craftsmanship <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="section-padding bg-[#fafaf8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-3 block">New Arrivals</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">The Solitaire Collection</h2>
            </div>
            <Link to="/shop" className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-neutral-300 hover:border-brand-onyx transition-all pb-1 whitespace-nowrap">View All Pieces</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {featuredProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className="group cursor-pointer block">
                <div className="aspect-[3/4] bg-white overflow-hidden flex items-center justify-center relative mb-6">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full skeleton" />
                  )}
                  <div className="absolute inset-0 bg-brand-onyx/0 group-hover:bg-brand-onyx/10 transition-colors duration-500" />
                </div>
                <div className="text-center space-y-2">
                  {product.category?.name && <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{product.category.name}</span>}
                  <h3 className="text-sm font-bold uppercase tracking-widest">{product.name}</h3>
                  <p className="text-base font-serif text-brand-gold">${Number(product.price).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="h-[60vh] relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-fixed bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-brand-onyx/55" />
        <div className="z-10 text-center text-brand-cream space-y-8 px-6 max-w-2xl">
          <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-brand-gold block">Exclusively Yours</span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter">Bespoke Creations</h2>
          <p className="text-sm uppercase tracking-[0.4em] font-light text-neutral-300">Custom designs tailored to your unique story</p>
          <Link to="/shop" className="inline-flex items-center gap-3 px-8 py-3 bg-brand-cream text-brand-onyx text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-white transition-colors">
            Begin Your Journey <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
