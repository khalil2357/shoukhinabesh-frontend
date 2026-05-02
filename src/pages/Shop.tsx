import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';

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
    <div className="aspect-[3/4] skeleton" />
    <div className="space-y-2">
      <div className="h-3 skeleton w-2/3 mx-auto" />
      <div className="h-4 skeleton w-1/2 mx-auto" />
    </div>
  </div>
);

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortValue, setSortValue] = useState('createdAt-desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const LIMIT = 12;

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
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    setAddingId(product.id);
    try { await addItem(product.id, 1); } catch (e) { console.error(e); }
    finally { setAddingId(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const hasActiveFilters = !!(search || categoryId || minPrice || maxPrice);

  return (
    <div className="pt-24 pb-24 min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-24 mb-12">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-3 block">The Collection</span>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter">All Jewellery</h1>
            <div className="flex items-center gap-4">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3" /> Clear Filters
                </button>
              )}
              <select
                value={sortValue}
                onChange={(e) => { setSortValue(e.target.value); setPage(1); }}
                className="border border-neutral-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-onyx"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="md:hidden flex items-center gap-2 border border-neutral-200 px-4 py-2 text-[11px] font-bold uppercase tracking-widest"
              >
                <SlidersHorizontal className="w-3 h-3" /> Filters
              </button>
            </div>
          </div>
          {total > 0 && <p className="text-[10px] text-neutral-400 mt-3 font-bold uppercase tracking-widest">{total} pieces found</p>}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-64 shrink-0 space-y-10 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
            <form onSubmit={applyFilters} className="space-y-8">
              {/* Search */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">Search</h4>
                <div className="flex items-center border border-neutral-200 focus-within:border-brand-onyx transition-colors">
                  <Search className="w-4 h-4 ml-3 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search pieces..."
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                    id="shop-search-input"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">Category</h4>
                <ul className="space-y-2">
                  <li>
                    <button type="button" onClick={() => setCategoryId('')} className={`text-sm w-full text-left py-1 transition-colors ${!categoryId ? 'font-bold text-brand-onyx' : 'text-neutral-500 hover:text-brand-onyx'}`}>
                      All Pieces
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button type="button" onClick={() => setCategoryId(cat.id)} className={`text-sm w-full text-left py-1 transition-colors ${categoryId === cat.id ? 'font-bold text-brand-onyx' : 'text-neutral-500 hover:text-brand-onyx'}`}>
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price range */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">Price Range</h4>
                <div className="flex gap-3 items-center">
                  <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min $" className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-onyx" id="min-price" />
                  <span className="text-neutral-400 text-sm shrink-0">—</span>
                  <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max $" className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-onyx" id="max-price" />
                </div>
              </div>

              <button type="submit" className="w-full premium-btn text-[11px]">Apply Filters</button>
            </form>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
                {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <p className="text-4xl font-serif text-neutral-200">✦</p>
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">No pieces found</p>
                <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-widest text-brand-onyx border-b border-brand-onyx pb-1">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
                {products.map((product) => (
                  <div key={product.id} className="group">
                    <Link to={`/product/${product.slug}`} className="block">
                      <div className="aspect-[3/4] bg-white overflow-hidden mb-5 relative">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                            <span className="text-3xl text-neutral-300">✦</span>
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Sold Out</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="text-center space-y-2">
                      {product.category?.name && <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{product.category.name}</span>}
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="text-xs font-bold uppercase tracking-widest hover:text-brand-gold transition-colors">{product.name}</h3>
                      </Link>
                      <p className="text-sm font-serif text-brand-gold">${Number(product.price).toLocaleString()}</p>
                      <button
                        id={`add-to-cart-${product.id}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={addingId === product.id || product.stock === 0}
                        className="mt-3 w-full py-2.5 border border-brand-onyx text-[10px] font-bold uppercase tracking-widest hover:bg-brand-onyx hover:text-brand-cream transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {addingId === product.id ? 'Adding...' : product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 border border-neutral-200 hover:border-brand-onyx transition-colors disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page + i - 2;
                    if (p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 text-sm font-bold transition-colors ${p === page ? 'bg-brand-onyx text-brand-cream' : 'border border-neutral-200 hover:border-brand-onyx'}`}>{p}</button>
                    );
                  })}
                </div>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 border border-neutral-200 hover:border-brand-onyx transition-colors disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
