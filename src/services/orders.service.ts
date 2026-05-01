import api from '../api/axios';

export interface PlaceOrderPayload {
  paymentMethod: string;
  shippingAddress?: string;
  couponCode?: string;
  notes?: string;
}

export const ordersService = {
  placeOrder: (data: PlaceOrderPayload) => api.post('/orders', data),
  getMyOrders: (params?: { page?: number; limit?: number }) => api.get('/orders/me', { params }),
  getAllOrders: (params?: { page?: number; limit?: number }) => api.get('/orders', { params }),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => api.post(`/orders/${id}/cancel`),
};
