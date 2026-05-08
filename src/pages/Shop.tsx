import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface Product {
  id: string; name: string; slug: string; price: number;
  images: string[]; category?: { name: string } | null; stock: number;
}
interface Category { id: string; name: string; }

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt-desc' },
  { label: 'Oldest First', value: 'createdAt-asc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];

const SkeletonCard = () => (
  <div className="space-y-4 widget">
    <div className="aspect-[4/5] skeleton rounded-[2rem] shadow-sm" />
    <div className="space-y-3 px-2">
      <div className="h-2 skeleton w-1/3 mx-auto rounded-full" />
      <div className="h-3 skeleton w-3/4 mx-auto rounded-full" />
      <div className="h-4 skeleton w-1/2 mx-auto rounded-full" />
    </div>
  </div>
);

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { addItem } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cartMsg, setCartMsg] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortValue, setSortValue] = useState('createdAt-desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const LIMIT = 12;

  useGSAP(() => {
    // Initial entrance - refined power4.out
    const tl = gsap.timeline();
    tl.fromTo('.shop-header',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
    )
      .fromTo('.shop-sidebar .widget',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
        '-=0.8'
      );
  }, { scope: containerRef });

  useGSAP(() => {
    if (!loading && products.length > 0) {
      gsap.fromTo('.product-card',
        { y: 40, scale: 0.95, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'back.out(1.2)' }
      );
    }
  }, [loading, products]);

  useEffect(() => {
    categoriesService.getCategories().then((res) => {
      const data = res.data;
      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.data?.categories)) list = data.data.categories;
      else if (Array.isArray(data?.categories)) list = data.categories;
      else if (Array.isArray(data?.items)) list = data.items;

      setCategories(list);
    }).catch(() => { });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, order] = sortValue.split('-') as [string, 'asc' | 'desc'];
      const params: Record<string, unknown> = { page, limit: LIMIT, sortBy, order };
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);

      const res = await productsService.getProducts(params);
      const data = res.data;

      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.data?.products)) list = data.data.products;
      else if (Array.isArray(data?.data?.data)) list = data.data.data;
      else if (Array.isArray(data?.products)) list = data.products;
      else if (Array.isArray(data?.items)) list = data.items;

      const count = data?.data?.total ?? data?.total ?? list.length;
      setProducts(list);
      setTotal(count);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, minPrice, maxPrice, sortValue, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    const c = searchParams.get('categoryId') || '';
    const min = searchParams.get('minPrice') || '';
    const max = searchParams.get('maxPrice') || '';
    const p = Number(searchParams.get('page')) || 1;

    setSearch(s);
    setCategoryId(c);
    setMinPrice(min);
    setMaxPrice(max);
    setPage(p);
  }, [searchParams]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (categoryId) p.categoryId = categoryId;
    if (minPrice) p.minPrice = minPrice;
    if (maxPrice) p.maxPrice = maxPrice;
    setSearchParams(p);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setSearch(''); setCategoryId(''); setMinPrice(''); setMaxPrice('');
    setSortValue('createdAt-desc'); setPage(1); setSearchParams({});
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingId(product.id);
    setCartMsg('');
    try {
      await addItem(product.id, 1);
      setCartMsg('Added to cart!');
      // Dispatch a global event to show a brief message under the navbar logo
      try {
        window.dispatchEvent(new CustomEvent('show-nav-message', { detail: { message: 'ADDED TO VAULT', type: 'vault' } }));
      } catch (e) {
        // ignore
      }
      window.setTimeout(() => setCartMsg(''), 2500);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      console.error(error);
      setCartMsg('Unable to add this item right now.');
      window.setTimeout(() => setCartMsg(''), 2500);
    } finally {
      setAddingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const hasActiveFilters = !!(search || categoryId || minPrice || maxPrice);

  return (
    <div ref={containerRef} className="pt-32 pb-32 min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-24 mb-16 shop-header">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-white/60 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-white">
            <div className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-gold block">Curated Collection</span>
              <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter leading-[0.85] text-brand-onyx">
                Fine <br />
                <span className="italic font-medium text-brand-onyx/80">Jewellery.</span>
              </h1>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-600 transition-colors bg-rose-500/10 px-4 py-2.5 rounded-full">
                  <X className="w-3 h-3" /> Reset
                </button>
              )}
              <div className="relative group w-full md:w-64 bg-white rounded-full px-6 py-3.5 shadow-sm border border-neutral-100 hover:border-neutral-200 transition-colors">
                <select
                  value={sortValue}
                  onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
                  className="w-full appearance-none bg-transparent text-[10px] font-black uppercase tracking-widest text-brand-onyx focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gold group-hover:text-brand-onyx transition-colors">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="lg:hidden flex items-center justify-center gap-2 bg-brand-onyx text-white px-8 py-3.5 w-full rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:bg-black transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 px-4">
            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">{total} pieces in vault</p>
            {cartMsg && <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold animate-fadeIn">{cartMsg}</p>}
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 relative">

          {/* Mobile Filter Backdrop */}
          <div
            className={`fixed inset-0 bg-brand-onyx/20 backdrop-blur-sm z-[190] lg:hidden transition-opacity duration-500 ${filterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setFilterOpen(false)}
          />

          {/* Sidebar Filters */}
          <aside className={`fixed inset-y-0 left-0 z-[200] w-[85%] max-w-[360px] bg-white/95 backdrop-blur-3xl shadow-[20px_0_40px_rgba(0,0,0,0.1)] transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] lg:relative lg:translate-x-0 lg:z-0 lg:w-80 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none shrink-0 ${filterOpen ? 'translate-x-0' : '-translate-x-full'} shop-sidebar overflow-y-auto lg:overflow-visible`}>
            <div className="p-8 lg:p-0">
              <div className="flex items-center justify-between lg:hidden mb-10">
                <span className="text-lg font-serif font-black tracking-widest text-brand-onyx">Filters</span>
                <button type="button" onClick={() => setFilterOpen(false)} className="p-3 bg-neutral-100 rounded-full text-brand-onyx hover:bg-neutral-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={applyFilters} className="space-y-6">
                {/* Search Widget */}
                <div className="widget bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 mb-4">Search</h4>
                  <div className="flex items-center bg-neutral-50 rounded-2xl px-4 py-3 focus-within:ring-2 ring-brand-onyx/10 transition-all">
                    <Search className="w-4 h-4 text-brand-gold shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Keywords..."
                      className="flex-1 px-3 py-1 text-xs font-medium bg-transparent focus:outline-none placeholder:text-neutral-300 text-brand-onyx"
                      id="shop-search-input"
                    />
                  </div>
                </div>

                {/* Categories Widget */}
                <div className="widget bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 mb-4">Collection</h4>
                  <ul className="space-y-2">
                    <li>
                      <button type="button" onClick={() => setCategoryId('')} className={`text-[10px] font-bold uppercase tracking-widest w-full text-left py-2 px-4 rounded-xl transition-all ${!categoryId ? 'bg-brand-onyx text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                        All Masterpieces
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button type="button" onClick={() => setCategoryId(cat.id)} className={`text-[10px] font-bold uppercase tracking-widest w-full text-left py-2 px-4 rounded-xl transition-all ${categoryId === cat.id ? 'bg-brand-onyx text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Widget */}
                <div className="widget bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 mb-4">Price Point</h4>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 bg-neutral-50 rounded-2xl px-4 py-3 focus-within:ring-2 ring-brand-onyx/10 transition-all flex items-center">
                      <span className="text-neutral-400 text-xs font-bold mr-1">$</span>
                      <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="w-full bg-transparent text-xs font-medium focus:outline-none text-brand-onyx" id="min-price" />
                    </div>
                    <span className="text-neutral-300 font-bold">—</span>
                    <div className="flex-1 bg-neutral-50 rounded-2xl px-4 py-3 focus-within:ring-2 ring-brand-onyx/10 transition-all flex items-center">
                      <span className="text-neutral-400 text-xs font-bold mr-1">$</span>
                      <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-full bg-transparent text-xs font-medium focus:outline-none text-brand-onyx" id="max-price" />
                    </div>
                  </div>
                </div>

                <div className="widget pt-4">
                  <button type="submit" className="w-full bg-brand-gold text-brand-onyx font-black text-[10px] uppercase tracking-[0.4em] py-5 rounded-full shadow-[0_10px_20px_rgba(197,163,93,0.3)] hover:bg-[#b08d4b] hover:shadow-[0_15px_30px_rgba(197,163,93,0.4)] hover:-translate-y-1 transition-all duration-300">
                    Update Vault
                  </button>
                </div>
              </form>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1" ref={gridRef}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-40 space-y-8 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white shadow-sm mx-4">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                  <p className="text-4xl font-serif text-brand-gold">✦</p>
                </div>
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-onyx mb-3">The vault is currently empty</p>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">We couldn't find any pieces matching your current selection. Try adjusting your filters.</p>
                </div>
                <button onClick={clearFilters} className="inline-block bg-brand-onyx text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                {products.map((product) => (
                  <div key={product.id} className="group product-card">
                    <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-white rounded-[2rem] shadow-[0_8px_20px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-700">
                      <Link to={`/product/${product.slug}`} className="block w-full h-full">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-[2s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-110" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                            <span className="text-6xl text-neutral-200 italic font-serif">S</span>
                          </div>
                        )}
                      </Link>

                      {/* iOS style floating add to cart pill */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-10">
                        <button
                          onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                          disabled={addingId === product.id || product.stock === 0}
                          className="w-full bg-white/95 backdrop-blur-md border border-white/20 text-brand-onyx py-3.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] hover:bg-brand-onyx hover:text-white transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(0,0,0,0.15)] disabled:opacity-50"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {addingId === product.id ? 'Adding...' : 'Add to Vault'}
                        </button>
                      </div>

                      {product.stock === 0 && (
                        <div className="absolute top-4 left-4 bg-white/90 px-4 py-2 rounded-full backdrop-blur-md shadow-sm">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Reserved</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center px-4 space-y-3">
                      {product.category?.name && (
                        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-brand-gold block mb-1">
                          {product.category.name}
                        </span>
                      )}
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-onyx hover:text-brand-gold transition-colors leading-relaxed line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-serif italic text-neutral-500">${Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-24">
                <button
                  onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="p-4 bg-white rounded-full shadow-sm border border-neutral-100 hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-brand-onyx" />
                </button>
                <div className="flex gap-2 bg-white rounded-full shadow-sm border border-neutral-100 p-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page + i - 2;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`w-10 h-10 rounded-full text-[10px] font-black transition-all ${p === page ? 'bg-brand-onyx text-white shadow-md' : 'text-neutral-400 hover:bg-neutral-50 hover:text-brand-onyx'}`}
                      >
                        {p < 10 ? `0${p}` : p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === totalPages}
                  className="p-4 bg-white rounded-full shadow-sm border border-neutral-100 hover:shadow-md transition-all disabled:opacity-30 disabled:hover:shadow-sm"
                >
                  <ChevronRight className="w-4 h-4 text-brand-onyx" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};