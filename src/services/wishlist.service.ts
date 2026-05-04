import api from '../api/axios';

export const wishlistService = {
  getWishlist: () => 
    api.get('/wishlist'),

  toggleWishlist: (productId: string) => 
    api.post(`/wishlist/toggle/${productId}`),
};
