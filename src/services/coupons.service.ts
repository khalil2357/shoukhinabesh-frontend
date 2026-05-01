import api from '../api/axios';

export const couponsService = {
  validateCoupon: (code: string, orderTotal: number) =>
    api.post('/coupons/validate', { code, orderTotal }),
};
