import { create } from 'zustand';
import api from '../api/axios';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  reset: () => void;
}

const extractCart = (data: unknown): Cart | null => {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.data && typeof d.data === 'object') return d.data as Cart;
  if (d.id) return data as Cart;
  return null;
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  itemCount: 0,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/cart');
      const cart = extractCart(res.data);
      set({
        cart,
        itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
      });
    } catch {
      set({ cart: null, itemCount: 0 });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (productId, quantity) => {
    const res = await api.post('/cart/items', { productId, quantity });
    const cart = extractCart(res.data);
    set({
      cart,
      itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? get().itemCount + quantity,
    });
  },

  updateItem: async (itemId, quantity) => {
    const res = await api.patch(`/cart/items/${itemId}`, { quantity });
    const cart = extractCart(res.data);
    set({
      cart,
      itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    });
  },

  removeItem: async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    const cart = extractCart(res.data);
    set({
      cart,
      itemCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    });
  },

  clearCart: async () => {
    await api.delete('/cart');
    set({ cart: null, itemCount: 0 });
  },

  reset: () => set({ cart: null, itemCount: 0, loading: false }),
}));
