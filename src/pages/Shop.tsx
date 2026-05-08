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
  <div className="space-y-4">
    <div className="aspect-[3/4] skeleton rounded-sm" />
    <div className="space-y-2">
      <div className="h-3 skeleton w-2/3 mx-auto" />
      <div className="h-4 skeleton w-1/2 mx-auto" />
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
    // Initial entrance
    const tl = gsap.timeline();
    tl.fromTo('.shop-header', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.shop-sidebar', 
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    );
  }, { scope: containerRef });

  useGSAP(() => {
    if (!loading && products.length > 0) {
      gsap.fromTo('.product-card', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power2.out' }
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
    }).catch(() => {});
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
      <div className="px-6 md:px-12 lg:px-24 mb-20 shop-header">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-gold block">Curated Collection</span>
              <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter leading-[0.85]">
                Fine <br />
                <span className="italic font-normal">Jewellery.</span>
              </h1>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500 hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3" /> Reset
                </button>
              )}
              <div className="relative group w-full md:w-64">
                <select
                  value={sortValue}
                  onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
                  className="w-full appearance-none border-b border-neutral-200 bg-transparent py-2 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-onyx transition-colors cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-hover:text-brand-onyx transition-colors">
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </div>
              </div>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="lg:hidden flex items-center justify-center gap-2 border border-brand-onyx px-8 py-3 w-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-onyx hover:text-brand-cream transition-all"
              >
                <SlidersHorizontal className="w-3 h-3" /> Filters
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-8 border-t border-neutral-100 pt-6">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{total} pieces in vault</p>
            {cartMsg && <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold animate-fadeIn">{cartMsg}</p>}
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-72 shrink-0 space-y-12 shop-sidebar ${filterOpen ? 'block' : 'hidden lg:block'}`}>
            <form onSubmit={applyFilters} className="space-y-12">
              {/* Search */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 border-b border-neutral-100 pb-3">Search</h4>
                <div className="flex items-center border-b border-neutral-200 focus-within:border-brand-onyx transition-all duration-500">
                  <Search className="w-4 h-4 text-neutral-300 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Keywords..."
                    className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none placeholder:text-neutral-200"
                    id="shop-search-input"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 border-b border-neutral-100 pb-3">Collection</h4>
                <ul className="space-y-3">
                  <li>
                    <button type="button" onClick={() => setCategoryId('')} className={`text-[11px] uppercase tracking-widest w-full text-left py-1.5 transition-all ${!categoryId ? 'font-black text-brand-onyx translate-x-2' : 'text-neutral-400 hover:text-brand-onyx hover:translate-x-1'}`}>
                      All Masterpieces
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button type="button" onClick={() => setCategoryId(cat.id)} className={`text-[11px] uppercase tracking-widest w-full text-left py-1.5 transition-all ${categoryId === cat.id ? 'font-black text-brand-onyx translate-x-2' : 'text-neutral-400 hover:text-brand-onyx hover:translate-x-1'}`}>
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price range */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400 border-b border-neutral-100 pb-3">Price Point</h4>
                <div className="flex gap-4 items-center">
                  <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min $" className="w-full bg-transparent border-b border-neutral-200 px-2 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors" id="min-price" />
                  <span className="text-neutral-300 text-xs shrink-0">—</span>
                  <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max $" className="w-full bg-transparent border-b border-neutral-200 px-2 py-3 text-sm focus:outline-none focus:border-brand-onyx transition-colors" id="max-price" />
                </div>
              </div>

              <button type="submit" className="w-full premium-btn text-[11px] py-4 bg-brand-onyx text-brand-cream hover:bg-black">Update Vault</button>
            </form>
          </aside>

          {/* Product Grid */}
          <div className="flex-1" ref={gridRef}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
                {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-40 space-y-6">
                <p className="text-6xl font-serif text-neutral-100">✦</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">The vault is currently empty</p>
                <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-brand-onyx border-b border-brand-onyx pb-1 hover:opacity-60 transition-opacity">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
                {products.map((product) => (
                  <div key={product.id} className="group product-card">
                    <Link to={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden mb-8 bg-white rounded-sm">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                          <span className="text-5xl text-neutral-100 italic font-serif">S</span>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-brand-onyx/0 group-hover:bg-brand-onyx/40 transition-all duration-700 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-8">
                        <button 
                          onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                          disabled={addingId === product.id || product.stock === 0}
                          className="bg-brand-cream text-brand-onyx w-full py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-white transition-colors flex items-center justify-center gap-3 translate-y-4 group-hover:translate-y-0 duration-700"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          {addingId === product.id ? 'Adding...' : 'Add to Vault'}
                        </button>
                      </div>

                      {product.stock === 0 && (
                        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1.5 backdrop-blur-md">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Reserved</span>
                        </div>
                      )}
                    </Link>
                    
                    <div className="text-center space-y-3">
                      {product.category?.name && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-brand-gold block mb-1">
                          {product.category.name}
                        </span>
                      )}
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] hover:text-brand-gold transition-colors leading-relaxed">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-serif text-brand-onyx">${Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-8 mt-32 border-t border-neutral-100 pt-12">
                <button 
                  onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={page === 1} 
                  className="p-4 border border-transparent hover:border-neutral-200 transition-all disabled:opacity-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-4">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page + i - 2;
                    if (p > totalPages) return null;
                    return (
                      <button 
                        key={p} 
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                        className={`w-12 h-12 text-[11px] font-black transition-all ${p === page ? 'bg-brand-onyx text-brand-cream' : 'text-neutral-400 hover:text-brand-onyx'}`}
                      >
                        {p < 10 ? `0${p}` : p}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  disabled={page === totalPages} 
                  className="p-4 border border-transparent hover:border-neutral-200 transition-all disabled:opacity-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
