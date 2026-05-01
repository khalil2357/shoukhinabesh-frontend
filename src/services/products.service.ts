import api from '../api/axios';

export interface ProductsParams {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const productsService = {
  getProducts: (params?: ProductsParams) =>
    api.get('/products', { params }),

  getProductBySlug: (slug: string) =>
    api.get(`/products/${slug}`),

  getVendorProducts: (params?: { page?: number; limit?: number }) =>
    api.get('/products/vendor/mine', { params }),

  createProduct: (data: Record<string, unknown>) =>
    api.post('/products', data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.patch(`/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),
};
