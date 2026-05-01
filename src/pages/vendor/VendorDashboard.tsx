import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, PlusCircle, PencilLine, Trash2, Eye, EyeOff,
  ReceiptText, TrendingUp, ChevronRight, X, CheckCircle2
} from 'lucide-react';
import { productsService } from '../../services/products.service';
import { ordersService } from '../../services/orders.service';
import { categoriesService } from '../../services/categories.service';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/axios';

type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Product {
  id: string; name: string; slug: string; description: string; price: number;
  stock: number; images: string[]; categoryId: string; isPublished: boolean;
  category?: { name: string } | null;
}

interface Order {
  id: string; orderNumber: string; total: number; status: OrderStatus;
  paymentStatus: string; createdAt?: string;
  customer?: { name?: string; email?: string } | null;
}

interface Category { id: string; name: string; }

type Tab = 'overview' | 'products' | 'orders' | 'add-product';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PLACED: 'bg-blue-50 text-blue-700',
  CONFIRMED: 'bg-indigo-50 text-indigo-700',
  PROCESSING: 'bg-yellow-50 text-yellow-700',
  SHIPPED: 'bg-orange-50 text-orange-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

const ORDER_STATUSES: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const VendorDashboard = () => {
  const { user } = useAuthStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = { name: '', slug: '', description: '', price: '', stock: '', images: '', categoryId: '', isPublished: false };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [prRes, orRes, catRes] = await Promise.allSettled([
        productsService.getVendorProducts({ limit: 50 }),
        ordersService.getAllOrders({ limit: 50 }),
        categoriesService.getCategories(),
      ]);

      const extract = <T,>(d: any, key: string): T[] => {
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if (Array.isArray(d.data)) return d.data;
        if (Array.isArray(d.items)) return d.items;
        if (Array.isArray(d[key])) return d[key];
        if (d.data && typeof d.data === 'object') {
          if (Array.isArray(d.data.data)) return d.data.data;
          if (Array.isArray(d.data.items)) return d.data.items;
          if (Array.isArray(d.data[key])) return d.data[key];
        }
        for (const k in d) if (Array.isArray(d[k])) return d[k];
        return [];
      };

      if (prRes.status === 'fulfilled') setProducts(extract(prRes.value.data, 'products'));
      if (orRes.status === 'fulfilled') setOrders(extract(orRes.value.data, 'orders'));
      if (catRes.status === 'fulfilled') {
        const list = extract<Category>(catRes.value.data, 'categories');
        setCategories(list);
        if (list[0]) setForm((f) => ({ ...f, categoryId: list[0].id }));
      }
      setLoading(false);
    };
    void init();
  }, []);

  const runAction = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    setNotice('');
    setError('');
    try { await fn(); } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Action failed.');
    } finally { setActionLoading(null); }
  };

  const handleUpsert = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      categoryId: form.categoryId,
      isPublished: form.isPublished,
    };

    await runAction(editingId ? `edit-${editingId}` : 'create', async () => {
      let saved: Product | null = null;
      if (editingId) {
        const res = await api.patch(`/products/${editingId}`, payload);
        saved = res.data?.data ?? res.data;
        setProducts((prev) => prev.map((p) => p.id === editingId ? (saved ?? { ...p, ...payload }) : p));
        setNotice('Product updated.');
      } else {
        const res = await productsService.createProduct(payload);
        saved = res.data?.data ?? res.data;
        if (saved) setProducts((prev) => [saved!, ...prev]);
        setNotice('Product created.');
      }
      setEditingId(null);
      setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
      setTab('products');
    });
  };

  const beginEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, slug: p.slug, description: p.description, price: String(p.price), stock: String(p.stock), images: p.images.join(', '), categoryId: p.categoryId, isPublished: p.isPublished });
    setTab('add-product');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await runAction(`del-${id}`, async () => {
      await productsService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setNotice('Product deleted.');
    });
  };

  const handleTogglePublish = async (p: Product) => {
    await runAction(`pub-${p.id}`, async () => {
      await productsService.updateProduct(p.id, { isPublished: !p.isPublished });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isPublished: !x.isPublished } : x));
      setNotice(p.isPublished ? 'Product unpublished.' : 'Product published.');
    });
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    await runAction(`status-${orderId}`, async () => {
      await ordersService.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as OrderStatus } : o));
      setNotice('Order status updated.');
    });
  };

  const totalRevenue = orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const publishedCount = products.filter((p) => p.isPublished).length;

  const navTabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'products', label: `Products (${products.length})`, icon: Package },
    { id: 'orders', label: `Orders (${orders.length})`, icon: ReceiptText },
    { id: 'add-product', label: editingId ? 'Edit Product' : 'Add Product', icon: PlusCircle },
  ];

  return (
    <div className="pt-24 pb-24 px-6 md:px-12 lg:px-24 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Vendor Portal</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter">{user?.name ?? 'My Store'}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 overflow-x-auto pb-1">
          {navTabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${tab === id ? 'bg-brand-onyx text-brand-cream' : 'bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Notices */}
        {(notice || error) && (
          <div className={`mb-6 p-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest ${error ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-700'}`}>
            <span>{error || notice}</span>
            <button onClick={() => { setNotice(''); setError(''); }}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Products', value: products.length, sub: `${publishedCount} published` },
                { label: 'Published', value: publishedCount, sub: 'live in shop' },
                { label: 'Total Orders', value: orders.length, sub: 'all time' },
                { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'from delivered', gold: true },
              ].map(({ label, value, sub, gold }) => (
                <div key={label} className={`p-6 border space-y-2 ${gold ? 'bg-brand-onyx text-brand-cream border-brand-onyx' : 'bg-white border-neutral-100'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${gold ? 'text-neutral-500' : 'text-neutral-400'}`}>{label}</p>
                  <p className="text-3xl font-serif">{loading ? '—' : value}</p>
                  <p className={`text-[9px] ${gold ? 'text-neutral-500' : 'text-neutral-400'}`}>{sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-brand-onyx text-brand-cream p-8 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-xs">Your store is active and products are available in the shop</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <p className="text-xs">Order management and status updates are live</p>
              </div>
              <button onClick={() => setTab('add-product')} className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-light transition-colors">
                <PlusCircle className="w-4 h-4" /> Add New Product
              </button>
            </div>
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton" />)
            ) : products.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <Package className="w-10 h-10 mx-auto text-neutral-200" />
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">No products yet</p>
                <button onClick={() => setTab('add-product')} className="premium-btn">Add First Product</button>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="bg-white border border-neutral-100 p-5 flex items-center gap-6 hover:border-neutral-300 transition-colors">
                  <div className="w-14 h-14 bg-neutral-100 shrink-0 overflow-hidden">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300">✦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest truncate">{product.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-serif text-brand-gold">${Number(product.price).toLocaleString()}</span>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Stock: {product.stock}</span>
                      {product.category?.name && <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{product.category.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 ${product.isPublished ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {product.isPublished ? 'Live' : 'Draft'}
                    </span>
                    <button onClick={() => handleTogglePublish(product)} disabled={actionLoading === `pub-${product.id}`} title={product.isPublished ? 'Unpublish' : 'Publish'} className="p-2 border border-neutral-200 hover:border-brand-onyx transition-colors disabled:opacity-40">
                      {product.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => beginEdit(product)} className="p-2 border border-neutral-200 hover:border-brand-onyx transition-colors">
                      <PencilLine className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} disabled={actionLoading === `del-${product.id}`} className="p-2 border border-neutral-200 hover:border-rose-300 hover:text-rose-500 transition-colors disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link to={`/product/${product.slug}`} target="_blank" className="p-2 border border-neutral-200 hover:border-brand-onyx transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton" />)
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <ReceiptText className="w-10 h-10 mx-auto text-neutral-200 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">No orders yet</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-neutral-100 p-6 flex items-center gap-6 flex-wrap hover:border-neutral-300 transition-colors">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest">#{order.orderNumber}</p>
                    {order.customer?.name && <p className="text-[10px] text-neutral-400">{order.customer.name}</p>}
                    {order.createdAt && <p className="text-[10px] text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-serif">${Number(order.total).toLocaleString()}</span>
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      disabled={actionLoading === `status-${order.id}`}
                      className={`border border-neutral-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-brand-onyx bg-white disabled:opacity-50 ${STATUS_COLORS[order.status]}`}
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add / Edit Product Form */}
        {tab === 'add-product' && (
          <div className="bg-white border border-neutral-100 p-8 md:p-10 max-w-2xl space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              {editingId && (
                <button onClick={() => { setEditingId(null); setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' }); }} className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-onyx flex items-center gap-1">
                  <X className="w-3 h-3" /> Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleUpsert} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Product Name *</label>
                  <input required type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx" id="product-name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx" id="product-slug" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Description *</label>
                <textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-[100px] resize-none" id="product-description" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Price (USD) *</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx" id="product-price" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Stock *</label>
                  <input required type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx" id="product-stock" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Category *</label>
                  <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white" id="product-category">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Image URLs (comma-separated)</label>
                <input type="text" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} placeholder="https://..., https://..." className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx" id="product-images" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} id="product-publish" className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Publish immediately</span>
              </label>
              <button type="submit" disabled={!!actionLoading} className="premium-btn flex items-center gap-2">
                {actionLoading ? <><span className="spinner" /> Saving...</> : <>{editingId ? <PencilLine className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} {editingId ? 'Update Product' : 'Create Product'}</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
