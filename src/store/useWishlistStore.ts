import { create } from 'zustand';
import { wishlistService } from '../services/wishlist.service';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    category?: { name: string } | null;
  };
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true });
    try {
      const res = await wishlistService.getWishlist();
      const data = res.data?.data ?? res.data;
      set({ items: data.items || [] });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      set({ loading: false });
    }
  },

  toggleWishlist: async (productId: string) => {
    try {
      const res = await wishlistService.toggleWishlist(productId);
      const data = res.data?.data ?? res.data;
      
      // Refresh the wishlist after toggle
      await get().fetchWishlist();
      
      return data.added;
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      throw error;
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some(item => item.productId === productId);
  },

  clearWishlist: () => {
    set({ items: [] });
  },
}));
