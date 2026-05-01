import api from '../api/axios';

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (productId: string, quantity: number) => api.post('/cart/items', { productId, quantity }),
  updateItem: (itemId: string, quantity: number) => api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart'),
};
