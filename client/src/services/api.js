import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Members API
export const membersAPI = {
  auth: (lineUserId, displayName, pictureUrl) =>
    api.post('/members/auth', { lineUserId, displayName, pictureUrl }),

  register: (data) =>
    api.post('/members/register', data),

  getProfile: (memberId, sessionToken) =>
    api.get('/members', { params: { memberId, sessionToken } }),

  updateProfile: (memberId, data) =>
    api.put('/members', data, { params: { memberId } }),

  getCoupons: (memberId) =>
    api.get('/members', { params: { memberId, action: 'get-coupons' } }),

  shareCoupon: (memberId, couponId, quantity) =>
    api.post('/members', { memberId, couponId, quantity }, { params: { action: 'share-coupon' } }),

  purchaseCoupon: (memberId, couponForSaleId, quantity, paymentMethod) =>
    api.post('/members', { memberId, couponForSaleId, quantity, paymentMethod }, { params: { action: 'purchase-coupon' } }),

  requestUpgrade: (memberId, paymentMethod) =>
    api.post('/members', { memberId, paymentMethod }, { params: { action: 'upgrade-membership' } }),
};

// Classes API
export const classesAPI = {
  getAll: () =>
    api.get('/classes'),

  getById: (id) =>
    api.get('/classes', { params: { id } }),

  enroll: (classId, data) =>
    api.post('/classes', data, { params: { id: classId, action: 'enroll' } }),
};

// Activities API
export const activitiesAPI = {
  getAll: () =>
    api.get('/activities'),

  getById: (id) =>
    api.get('/activities', { params: { id } }),

  enroll: (activityId, data) =>
    api.post('/activities', data, { params: { id: activityId, action: 'enroll' } }),
};

// Coupons API
export const couponsAPI = {
  getProfiles: () =>
    api.get('/coupons', { params: { resource: 'profiles' } }),

  getForSale: () =>
    api.get('/coupons', { params: { resource: 'for-sale' } }),

  claimCoupon: (token, memberId) =>
    api.post('/coupon-claim', { token, memberId }),
};

// Association Meetings API
export const meetingsAPI = {
  getUpcoming: () =>
    api.get('/association-meetings', { params: { status: 'upcoming' } }),

  getMemberStats: (memberId) =>
    api.get('/association-meetings', { params: { action: 'member-stats', memberId } }),

  register: (meetingId, memberId) =>
    api.post('/association-meetings', { meetingId, memberId }, { params: { action: 'register' } }),

  submitAbsence: (meetingId, memberId, formData) =>
    api.post('/association-meetings', formData, {
      params: { action: 'submit-absence', meetingId },
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
