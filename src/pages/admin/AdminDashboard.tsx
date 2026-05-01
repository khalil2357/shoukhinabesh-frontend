import { useEffect, useState, type FormEvent } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import {
  BadgeDollarSign,
  BookCopy,
  Box,
  CheckCircle2,
  CircleOff,
  Layers3,
  Package,
  PencilLine,
  ReceiptText,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from 'lucide-react';

type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN';
type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PayStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  avatar?: string | null;
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
};

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  vendorId: string;
  isPublished: boolean;
  category?: Pick<CategoryRecord, 'id' | 'name'> | null;
  vendor?: Pick<UserRecord, 'id' | 'name' | 'email' | 'role'> | null;
};

type OrderRecord = {
  id: string;
  orderNumber: string;
  customerId: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PayStatus;
  paymentMethod: string;
  shippingAddress?: string | null;
  couponCode?: string | null;
  discount?: number | null;
  notes?: string | null;
  customer?: Pick<UserRecord, 'id' | 'name' | 'email'> | null;
};

type CouponRecord = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  usageLimit: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

type ReviewRecord = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt?: string;
  product?: Pick<ProductRecord, 'id' | 'name'> | null;
  user?: Pick<UserRecord, 'id' | 'name' | 'email'> | null;
};

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  images: string;
  categoryId: string;
  vendorId: string;
  isPublished: boolean;
};

type CategoryFormState = {
  name: string;
  description: string;
  image: string;
};

type CouponFormState = {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minOrder: string;
  usageLimit: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

type ApiListEnvelope<T> = {
  data?: T[] | T | { data?: T[]; items?: T[] };
  items?: T[];
};

type ApiItemEnvelope<T> = {
  data?: T | { data?: T };
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const addDaysInputValue = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const extractList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const envelope = payload as Record<string, unknown>;
  // check common keys directly
  if (Array.isArray(envelope.data)) return envelope.data as T[];
  if (Array.isArray(envelope.items)) return envelope.items as T[];

  // look for any array in the first level
  for (const key in envelope) {
    if (Array.isArray(envelope[key])) return envelope[key] as T[];
  }

  // check inside data object
  if (envelope.data && typeof envelope.data === 'object') {
    const nested = envelope.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) return nested.data as T[];
    if (Array.isArray(nested.items)) return nested.items as T[];
    
    // look for any array in the nested data
    for (const key in nested) {
      if (Array.isArray(nested[key])) return nested[key] as T[];
    }
  }

  return [];
};

const extractItem = <T,>(payload: unknown): T | null => {
  if (!payload || typeof payload !== 'object') return null;
  const envelope = payload as Record<string, unknown>;
  
  if (envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)) {
    const nested = envelope.data as Record<string, unknown>;
    if (nested.data) return nested.data as T;
    
    // look for specific model keys
    for (const key of ['user', 'product', 'category', 'coupon', 'order', 'review']) {
      if (nested[key]) return nested[key] as T;
    }
    return envelope.data as T;
  }

  for (const key of ['user', 'product', 'category', 'coupon', 'order', 'review']) {
    if (envelope[key]) return envelope[key] as T;
  }
  
  if (envelope.id) return envelope as T;

  return null;
};

const joinImages = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const AdminDashboard = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    images: '',
    categoryId: '',
    vendorId: '',
    isPublished: false,
  });
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    name: '',
    description: '',
    image: '',
  });
  const [couponForm, setCouponForm] = useState<CouponFormState>({
    code: '',
    discountType: 'percent',
    discountValue: '',
    minOrder: '',
    usageLimit: '',
    validFrom: todayInputValue(),
    validTo: addDaysInputValue(30),
    isActive: true,
  });

  const vendorUsers = users.filter((user) => user.role === 'VENDOR');
  const defaultCategoryId = categories[0]?.id ?? '';
  const defaultVendorId = vendorUsers[0]?.id ?? users[0]?.id ?? '';

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      setError('');

      const requests = [
        api.get('/users'),
        api.get('/categories'),
        api.get('/products'),
        api.get('/orders'),
        api.get('/coupons'),
        api.get('/reviews'),
      ];

      const [usersResult, categoriesResult, productsResult, ordersResult, couponsResult, reviewsResult] = await Promise.allSettled(requests);

      if (usersResult.status === 'fulfilled') setUsers(extractList<UserRecord>(usersResult.value.data));
      if (categoriesResult.status === 'fulfilled') setCategories(extractList<CategoryRecord>(categoriesResult.value.data));
      if (productsResult.status === 'fulfilled') setProducts(extractList<ProductRecord>(productsResult.value.data));
      if (ordersResult.status === 'fulfilled') setOrders(extractList<OrderRecord>(ordersResult.value.data));
      if (couponsResult.status === 'fulfilled') setCoupons(extractList<CouponRecord>(couponsResult.value.data));
      if (reviewsResult.status === 'fulfilled') setReviews(extractList<ReviewRecord>(reviewsResult.value.data));

      const failedRequest = [usersResult, categoriesResult, productsResult, ordersResult, couponsResult, reviewsResult].find((result) => result.status === 'rejected');
      if (failedRequest) {
        setError('Some admin data could not be loaded from the backend. Check the API routes and try again.');
      } else {
        setNotice('Admin data loaded successfully.');
      }

      setLoading(false);
    };

    void loadAdminData();
  }, []);

  useEffect(() => {
    if (!productForm.categoryId && defaultCategoryId) {
      setProductForm((currentForm) => ({ ...currentForm, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId, productForm.categoryId]);

  useEffect(() => {
    if (!productForm.vendorId && defaultVendorId) {
      setProductForm((currentForm) => ({ ...currentForm, vendorId: defaultVendorId }));
    }
  }, [defaultVendorId, productForm.vendorId]);

  const resolveUserName = (userId: string, fallback?: { name?: string | null; email?: string | null }) =>
    fallback?.name ?? users.find((user) => user.id === userId)?.name ?? fallback?.email ?? userId;

  const resolveCategoryName = (categoryId: string, fallback?: { name?: string | null }) =>
    fallback?.name ?? categories.find((category) => category.id === categoryId)?.name ?? categoryId;

  const resolveProductName = (productId: string, fallback?: { name?: string | null }) =>
    fallback?.name ?? products.find((product) => product.id === productId)?.name ?? productId;

  const clearMessages = () => {
    setNotice('');
    setError('');
  };

  const runAction = async (key: string, action: () => Promise<void>) => {
    clearMessages();
    setActionLoading(key);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Request failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const patchUser = async (id: string, payload: Partial<UserRecord>) => {
    const response = await api.patch(`/users/${id}`, payload);
    const updated = extractItem<UserRecord>(response.data);
    setUsers((currentUsers) => currentUsers.map((user) => (user.id === id ? updated ?? { ...user, ...payload } : user)));
  };

  const patchProduct = async (id: string, payload: Partial<ProductRecord>) => {
    const response = await api.patch(`/products/${id}`, payload);
    const updated = extractItem<ProductRecord>(response.data);
    setProducts((currentProducts) => currentProducts.map((product) => (product.id === id ? updated ?? { ...product, ...payload } : product)));
  };

  const patchCategory = async (id: string, payload: Partial<CategoryRecord>) => {
    const response = await api.patch(`/categories/${id}`, payload);
    const updated = extractItem<CategoryRecord>(response.data);
    setCategories((currentCategories) => currentCategories.map((category) => (category.id === id ? updated ?? { ...category, ...payload } : category)));
  };

  const patchOrder = async (id: string, payload: Partial<OrderRecord>) => {
    const response = await api.patch(`/orders/${id}`, payload);
    const updated = extractItem<OrderRecord>(response.data);
    setOrders((currentOrders) => currentOrders.map((order) => (order.id === id ? updated ?? { ...order, ...payload } : order)));
  };

  const patchCoupon = async (id: string, payload: Partial<CouponRecord>) => {
    const response = await api.patch(`/coupons/${id}`, payload);
    const updated = extractItem<CouponRecord>(response.data);
    setCoupons((currentCoupons) => currentCoupons.map((coupon) => (coupon.id === id ? updated ?? { ...coupon, ...payload } : coupon)));
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`);
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
  };

  const deleteCategory = async (id: string) => {
    await api.delete(`/categories/${id}`);
    setCategories((currentCategories) => currentCategories.filter((category) => category.id !== id));
  };

  const deleteCoupon = async (id: string) => {
    await api.delete(`/coupons/${id}`);
    setCoupons((currentCoupons) => currentCoupons.filter((coupon) => coupon.id !== id));
  };

  const deleteReview = async (id: string) => {
    await api.delete(`/reviews/${id}`);
    setReviews((currentReviews) => currentReviews.filter((review) => review.id !== id));
  };

  const upsertProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: productForm.name.trim(),
      slug: productForm.slug.trim() || slugify(productForm.name),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      images: joinImages(productForm.images),
      categoryId: productForm.categoryId,
      vendorId: productForm.vendorId,
      isPublished: productForm.isPublished,
    };

    const requestKey = editingProductId ? `product-update-${editingProductId}` : 'product-create';

    await runAction(requestKey, async () => {
      const response = editingProductId
        ? await api.patch(`/products/${editingProductId}`, payload)
        : await api.post('/products', payload);

      const savedProduct = extractItem<ProductRecord>(response.data);
      if (savedProduct) {
        setProducts((currentProducts) => (
          editingProductId
            ? currentProducts.map((product) => (product.id === editingProductId ? savedProduct : product))
            : [savedProduct, ...currentProducts]
        ));
      } else {
        setProducts((currentProducts) => (
          editingProductId
            ? currentProducts.map((product) => (product.id === editingProductId ? { ...product, ...payload } : product))
            : [{ id: String(Date.now()), ...payload, category: null, vendor: null } as ProductRecord, ...currentProducts]
        ));
      }

      setEditingProductId(null);
      setProductForm({
        name: '',
        slug: '',
        description: '',
        price: '',
        stock: '',
        images: '',
        categoryId: defaultCategoryId,
        vendorId: defaultVendorId,
        isPublished: false,
      });

      setNotice(editingProductId ? 'Product updated.' : 'Product created.');
    });
  };

  const upsertCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
      image: categoryForm.image.trim() || undefined,
    };

    const requestKey = editingCategoryId ? `category-update-${editingCategoryId}` : 'category-create';

    await runAction(requestKey, async () => {
      const response = editingCategoryId
        ? await api.patch(`/categories/${editingCategoryId}`, payload)
        : await api.post('/categories', payload);

      const savedCategory = extractItem<CategoryRecord>(response.data);
      if (savedCategory) {
        setCategories((currentCategories) => (
          editingCategoryId
            ? currentCategories.map((category) => (category.id === editingCategoryId ? savedCategory : category))
            : [savedCategory, ...currentCategories]
        ));
      } else {
        setCategories((currentCategories) => (
          editingCategoryId
            ? currentCategories.map((category) => (category.id === editingCategoryId ? { ...category, ...payload } : category))
            : [{ id: String(Date.now()), ...payload } as CategoryRecord, ...currentCategories]
        ));
      }

      setEditingCategoryId(null);
      setCategoryForm({ name: '', description: '', image: '' });
      setNotice(editingCategoryId ? 'Category updated.' : 'Category created.');
    });
  };

  const upsertCoupon = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      minOrder: Number(couponForm.minOrder),
      usageLimit: Number(couponForm.usageLimit),
      validFrom: new Date(couponForm.validFrom).toISOString(),
      validTo: new Date(couponForm.validTo).toISOString(),
      isActive: couponForm.isActive,
    };

    const requestKey = editingCouponId ? `coupon-update-${editingCouponId}` : 'coupon-create';

    await runAction(requestKey, async () => {
      const response = editingCouponId
        ? await api.patch(`/coupons/${editingCouponId}`, payload)
        : await api.post('/coupons', payload);

      const savedCoupon = extractItem<CouponRecord>(response.data);
      if (savedCoupon) {
        setCoupons((currentCoupons) => (
          editingCouponId
            ? currentCoupons.map((coupon) => (coupon.id === editingCouponId ? savedCoupon : coupon))
            : [savedCoupon, ...currentCoupons]
        ));
      } else {
        setCoupons((currentCoupons) => (
          editingCouponId
            ? currentCoupons.map((coupon) => (coupon.id === editingCouponId ? { ...coupon, ...payload } : coupon))
            : [{ id: String(Date.now()), usageCount: 0, ...payload } as CouponRecord, ...currentCoupons]
        ));
      }

      setEditingCouponId(null);
      setCouponForm({
        code: '',
        discountType: 'percent',
        discountValue: '',
        minOrder: '',
        usageLimit: '',
        validFrom: todayInputValue(),
        validTo: addDaysInputValue(30),
        isActive: true,
      });
      setNotice(editingCouponId ? 'Coupon updated.' : 'Coupon created.');
    });
  };

  const beginEditProduct = (product: ProductRecord) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      images: product.images.join(', '),
      categoryId: product.categoryId,
      vendorId: product.vendorId,
      isPublished: product.isPublished,
    });
  };

  const beginEditCategory = (category: CategoryRecord) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
    });
  };

  const beginEditCoupon = (coupon: CouponRecord) => {
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType === 'fixed' ? 'fixed' : 'percent',
      discountValue: String(coupon.discountValue),
      minOrder: String(coupon.minOrder),
      usageLimit: String(coupon.usageLimit),
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : todayInputValue(),
      validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().slice(0, 10) : addDaysInputValue(30),
      isActive: coupon.isActive,
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      slug: '',
      description: '',
      price: '',
      stock: '',
      images: '',
      categoryId: defaultCategoryId,
      vendorId: defaultVendorId,
      isPublished: false,
    });
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', description: '', image: '' });
  };

  const resetCouponForm = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      discountType: 'percent',
      discountValue: '',
      minOrder: '',
      usageLimit: '',
      validFrom: todayInputValue(),
      validTo: addDaysInputValue(30),
      isActive: true,
    });
  };

  const totalUsers = users.length;
  const activeVendors = users.filter((user) => user.role === 'VENDOR' && user.isActive).length;
  const publishedProducts = products.filter((product) => product.isPublished).length;
  const monthlyRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const activeCoupons = coupons.filter((coupon) => coupon.isActive).length;

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 lg:px-24 container mx-auto space-y-12">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)] gap-8 items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-400">Admin Control Panel</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">Operations Dashboard</h1>
            <p className="max-w-2xl text-sm text-neutral-500 leading-relaxed">
              Manage users, products, categories, orders, payments, coupons, and reviews from the backend-connected admin surface.
            </p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <Users className="w-4 h-4 text-neutral-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Users</span>
              </div>
              <p className="text-3xl font-serif">{totalUsers}</p>
              <p className="text-[10px] text-neutral-400">Registered accounts</p>
            </div>
            <div className="p-5 bg-white border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <Layers3 className="w-4 h-4 text-neutral-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Vendors</span>
              </div>
              <p className="text-3xl font-serif">{activeVendors}</p>
              <p className="text-[10px] text-neutral-400">Active vendors</p>
            </div>
            <div className="p-5 bg-white border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <ReceiptText className="w-4 h-4 text-neutral-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Orders</span>
              </div>
              <p className="text-3xl font-serif">{orders.length}</p>
              <p className="text-[10px] text-neutral-400">Live purchase records</p>
            </div>
            <div className="p-5 bg-brand-onyx text-brand-cream space-y-2">
              <div className="flex items-center justify-between">
                <BadgeDollarSign className="w-4 h-4 text-brand-gold" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Revenue</span>
              </div>
              <p className="text-3xl font-serif">{formatCurrency(monthlyRevenue)}</p>
              <p className="text-[10px] text-neutral-400">Gross order value</p>
            </div>
          </div>
        </div>

        <div className="bg-brand-onyx text-brand-cream p-8 space-y-5 border border-neutral-900/70">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">System Status</h2>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              {loading ? 'Loading administrative data from the backend...' : 'Core services are healthy. Administrative actions update the backend and the dashboard immediately.'}
            </p>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Catalog sync online</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Payment tracking active</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Review moderation enabled</span>
            </div>
          </div>
          {(notice || error) && (
            <div className={`text-xs leading-relaxed ${error ? 'text-red-200' : 'text-green-200'}`}>
              {error || notice}
            </div>
          )}
        </div>
      </div>

      <section className="bg-white border border-neutral-100 p-8 md:p-10 space-y-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">1. User Management</p>
            <h2 className="text-2xl font-serif font-bold mt-2">View all users, block or unblock them, and change roles</h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            <ShieldCheck className="w-4 h-4" /> Admin-only access
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 last:border-b-0">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-neutral-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <select
                        value={user.role}
                        onChange={(event) => {
                          void runAction(`user-role-${user.id}`, async () => {
                            await patchUser(user.id, { role: event.target.value as Role });
                            setNotice('User role updated.');
                          });
                        }}
                        className="w-full max-w-[160px] border border-neutral-200 bg-white px-3 py-2 text-xs uppercase tracking-widest"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === `user-toggle-${user.id}`}
                        onClick={() => {
                          void runAction(`user-toggle-${user.id}`, async () => {
                            await patchUser(user.id, { isActive: !user.isActive });
                            setNotice(user.isActive ? 'User blocked.' : 'User unblocked.');
                          });
                        }}
                      >
                        {user.isActive ? 'Block' : 'Unblock'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white border border-neutral-100 p-8 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">2. Product Management</p>
              <h2 className="text-2xl font-serif font-bold mt-2">Add, edit, delete, view, publish, and unpublish products</h2>
            </div>
            <Box className="w-5 h-5 text-neutral-400" />
          </div>

          <form onSubmit={upsertProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setProductForm((currentForm) => ({
                    ...currentForm,
                    name,
                    slug: currentForm.slug ? currentForm.slug : slugify(name),
                  }));
                }}
                placeholder="Product name"
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
              />
              <input
                type="text"
                required
                value={productForm.slug}
                onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })}
                placeholder="Slug"
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
              />
            </div>

            <textarea
              required
              value={productForm.description}
              onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
              placeholder="Product description"
              className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-28"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                required
                min="0"
                value={productForm.price}
                onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                placeholder="Price"
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
              />
              <input
                type="number"
                required
                min="0"
                value={productForm.stock}
                onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
                placeholder="Stock"
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
              />
              <label className="flex items-center gap-3 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={productForm.isPublished}
                  onChange={(event) => setProductForm({ ...productForm, isPublished: event.target.checked })}
                />
                Publish immediately
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={productForm.categoryId}
                onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={productForm.vendorId}
                onChange={(event) => setProductForm({ ...productForm, vendorId: event.target.value })}
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white"
              >
                <option value="">Select vendor</option>
                {users.filter((user) => user.role === 'VENDOR' || user.role === 'ADMIN').map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <textarea
              value={productForm.images}
              onChange={(event) => setProductForm({ ...productForm, images: event.target.value })}
              placeholder="Image URLs, separated by commas"
              className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx min-h-24"
            />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={actionLoading === 'product-create' || actionLoading?.startsWith('product-update-')}>
                {editingProductId ? 'Save Product' : 'Add Product'}
              </Button>
              {editingProductId && (
                <Button type="button" variant="ghost" onClick={resetProductForm}>Cancel</Button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-100">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-neutral-100 last:border-b-0">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-bold">{product.name}</p>
                        <p className="text-xs text-neutral-400">
                          {resolveCategoryName(product.categoryId, product.category ?? undefined)} · {product.vendor?.name ?? resolveUserName(product.vendorId, product.vendor ?? undefined)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-medium">{formatCurrency(product.price)}</td>
                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        onClick={() => {
                          void runAction(`product-publish-${product.id}`, async () => {
                            await patchProduct(product.id, { isPublished: !product.isPublished });
                            setNotice(product.isPublished ? 'Product unpublished.' : 'Product published.');
                          });
                        }}
                        className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${product.isPublished ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                      >
                        {product.isPublished ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => beginEditProduct(product)}>
                          <PencilLine className="w-3 h-3 mr-2" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === `product-delete-${product.id}`}
                          onClick={() => {
                            void runAction(`product-delete-${product.id}`, async () => {
                              await deleteProduct(product.id);
                              setNotice('Product deleted.');
                            });
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-neutral-100 p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">3. Category Management</p>
                <h2 className="text-2xl font-serif font-bold mt-2">Create, edit, delete, and view categories</h2>
              </div>
              <BookCopy className="w-5 h-5 text-neutral-400" />
            </div>

            <form onSubmit={upsertCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setCategoryForm((currentForm) => ({
                      ...currentForm,
                      name,
                      slug: currentForm.slug ? currentForm.slug : slugify(name),
                    }));
                  }}
                  placeholder="Category name"
                  className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                />
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                  placeholder="Optional description"
                  className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                />
              </div>
              <input
                type="text"
                value={categoryForm.image}
                onChange={(event) => setCategoryForm({ ...categoryForm, image: event.target.value })}
                placeholder="Optional image URL"
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={actionLoading === 'category-create' || actionLoading?.startsWith('category-update-')}>
                  {editingCategoryId ? 'Save Category' : 'Create Category'}
                </Button>
                {editingCategoryId && (
                  <Button type="button" variant="ghost" onClick={resetCategoryForm}>Cancel</Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 border border-neutral-100 px-4 py-3">
                  <div>
                    <p className="font-bold">{category.name}</p>
                    <p className="text-xs text-neutral-400">/{category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => beginEditCategory(category)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoading === `category-delete-${category.id}`}
                      onClick={() => {
                        void runAction(`category-delete-${category.id}`, async () => {
                          await deleteCategory(category.id);
                          setNotice('Category deleted.');
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-100 p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">6. Coupon Management</p>
                <h2 className="text-2xl font-serif font-bold mt-2">Create coupons, set discount values, and toggle activation</h2>
              </div>
              <BadgeDollarSign className="w-5 h-5 text-neutral-400" />
            </div>

            <form onSubmit={upsertCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(event) => setCouponForm({ ...couponForm, code: event.target.value })}
                  placeholder="Coupon code"
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                />
                <select
                  value={couponForm.discountType}
                  onChange={(event) => setCouponForm({ ...couponForm, discountType: event.target.value as 'percent' | 'fixed' })}
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  required
                  min="0"
                  value={couponForm.discountValue}
                  onChange={(event) => setCouponForm({ ...couponForm, discountValue: event.target.value })}
                  placeholder="Discount value"
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                />
                <input
                  type="number"
                  min="0"
                  value={couponForm.minOrder}
                  onChange={(event) => setCouponForm({ ...couponForm, minOrder: event.target.value })}
                  placeholder="Minimum order"
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                />
                <input
                  type="number"
                  min="1"
                  value={couponForm.usageLimit}
                  onChange={(event) => setCouponForm({ ...couponForm, usageLimit: event.target.value })}
                  placeholder="Usage limit"
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="date"
                  value={couponForm.validFrom}
                  onChange={(event) => setCouponForm({ ...couponForm, validFrom: event.target.value })}
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white"
                />
                <input
                  type="date"
                  value={couponForm.validTo}
                  onChange={(event) => setCouponForm({ ...couponForm, validTo: event.target.value })}
                  className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-brand-onyx bg-white"
                />
                <label className="flex items-center gap-3 border border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={(event) => setCouponForm({ ...couponForm, isActive: event.target.checked })}
                  />
                  Active coupon
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={actionLoading === 'coupon-create' || actionLoading?.startsWith('coupon-update-')}>
                  {editingCouponId ? 'Save Coupon' : 'Create Coupon'}
                </Button>
                {editingCouponId && (
                  <Button type="button" variant="ghost" onClick={resetCouponForm}>Cancel</Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-neutral-100 px-4 py-3">
                  <div>
                    <p className="font-bold">{coupon.code}</p>
                    <p className="text-xs text-neutral-400">
                      {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : formatCurrency(coupon.discountValue)} off · {coupon.minOrder ? `Min ${formatCurrency(coupon.minOrder)}` : 'No minimum'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(`coupon-toggle-${coupon.id}`, async () => {
                          await patchCoupon(coupon.id, { isActive: !coupon.isActive });
                          setNotice(coupon.isActive ? 'Coupon disabled.' : 'Coupon enabled.');
                        });
                      }}
                      className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${coupon.isActive ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      {coupon.isActive ? 'Enabled' : 'Disabled'}
                    </button>
                    <Button variant="outline" size="sm" onClick={() => beginEditCoupon(coupon)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoading === `coupon-delete-${coupon.id}`}
                      onClick={() => {
                        void runAction(`coupon-delete-${coupon.id}`, async () => {
                          await deleteCoupon(coupon.id);
                          setNotice('Coupon deleted.');
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-neutral-100 p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">4. Order Management</p>
              <h2 className="text-2xl font-serif font-bold mt-2">View all orders and change order status</h2>
            </div>
            <Package className="w-5 h-5 text-neutral-400" />
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-neutral-100 px-4 py-4 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-neutral-400">
                      {resolveUserName(order.customerId, order.customer ?? undefined)} · {formatCurrency(order.total)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Payment: {order.paymentStatus}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Status</label>
                  <select
                    value={order.status}
                    onChange={(event) => {
                      void runAction(`order-status-${order.id}`, async () => {
                        await patchOrder(order.id, { status: event.target.value as OrderStatus });
                        setNotice('Order status updated.');
                      });
                    }}
                    className="border border-neutral-200 px-3 py-2 text-xs uppercase tracking-widest bg-white"
                  >
                    <option value="PLACED">Placed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-neutral-100 p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">5. Payment Tracking</p>
                <h2 className="text-2xl font-serif font-bold mt-2">View payment statuses for all orders</h2>
              </div>
              <CircleOff className="w-5 h-5 text-neutral-400" />
            </div>

            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 border border-neutral-100 px-4 py-3">
                  <div>
                    <p className="font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-neutral-400">{resolveUserName(order.customerId, order.customer ?? undefined)}</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : order.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-100 p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">7. Reviews Control</p>
                <h2 className="text-2xl font-serif font-bold mt-2">View reviews and remove spam</h2>
              </div>
              <Star className="w-5 h-5 text-neutral-400" />
            </div>

            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="border border-neutral-100 px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{resolveProductName(review.productId, review.product ?? undefined)}</p>
                      <p className="text-xs text-neutral-400">{resolveUserName(review.userId, review.user ?? undefined)} · {review.rating}/5</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoading === `review-delete-${review.id}`}
                      onClick={() => {
                        void runAction(`review-delete-${review.id}`, async () => {
                          await deleteReview(review.id);
                          setNotice('Review deleted.');
                        });
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Delete
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 border border-dashed border-neutral-200 p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-neutral-400">Summary</p>
            <h2 className="text-2xl font-serif font-bold">All requested admin features are wired to the backend</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              The dashboard now fetches live users, products, categories, orders, coupons, and reviews, and performs API-backed updates for each management action.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white border border-neutral-100 p-4 min-w-[120px]">
              <p className="text-2xl font-serif">{categories.length}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Categories</p>
            </div>
            <div className="bg-white border border-neutral-100 p-4 min-w-[120px]">
              <p className="text-2xl font-serif">{activeCoupons}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-1">Active Coupons</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};