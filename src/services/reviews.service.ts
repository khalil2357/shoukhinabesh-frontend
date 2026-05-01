import api from '../api/axios';

export const reviewsService = {
  getProductReviews: (productId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/product/${productId}`, { params }),

  createReview: (data: { productId: string; rating: number; comment: string }) =>
    api.post('/reviews', data),

  deleteReview: (id: string) =>
    api.delete(`/reviews/${id}`),
};
