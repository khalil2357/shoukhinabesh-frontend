import api from '../api/axios';

export interface PlaceOrderPayload {
  paymentMethod: string;
  shippingAddress?: string;
  couponCode?: string;
  notes?: string;
}

export interface StripePaymentIntentPayload {
  amount: number;
  currency: string;
  items?: Array<{ id: string; name: string; quantity: number; price: number }>;
  shippingAddress?: string;
  couponCode?: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface StripePaymentIntentResponse {
  clientSecret?: string;
  id?: string;
  status?: string;
  data?: {
    clientSecret?: string;
    id?: string;
    status?: string;
  };
}

export const ordersService = {
  placeOrder: (data: PlaceOrderPayload) => api.post('/orders', data),
  getMyOrders: (params?: { page?: number; limit?: number }) => api.get('/orders/me', { params }),
  getAllOrders: (params?: { page?: number; limit?: number }) => api.get('/orders', { params }),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => api.post(`/orders/${id}/cancel`),
  createStripePaymentIntent: (payload: StripePaymentIntentPayload) =>
    api.post<StripePaymentIntentResponse>('/payments/stripe/intent', payload),
};
