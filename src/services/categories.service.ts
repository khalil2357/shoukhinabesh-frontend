import api from '../api/axios';

export const categoriesService = {
  getCategories: () => api.get('/categories'),
  getCategoryById: (id: string) => api.get(`/categories/${id}`),
};
