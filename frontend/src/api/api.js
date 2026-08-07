import axios from 'axios';

const API_BASE = '/api/';

const api = axios.create({ baseURL: API_BASE });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (d) => api.post('auth/register', d),
  login: (d) => api.post('auth/login', d),
  me: () => api.get('auth/me'),
  updateProfile: (d) => api.put('auth/update-profile', d),
};

export const vehicleAPI = {
  list: (p) => api.get('vehicles/', { params: p }),
  get: (id) => api.get(`vehicles/${id}`),
  availability: (id, p) => api.get(`vehicles/${id}/availability`, { params: p }),
  types: () => api.get('vehicles/types'),
  locations: () => api.get('vehicles/locations'),
  packages: () => api.get('vehicles/packages'),
};

export const bookingAPI = {
  create: (d) => api.post('bookings/', d),
  myBookings: () => api.get('bookings/my'),
  getBooking: (id) => api.get(`bookings/${id}`),
  cancel: (id) => api.put(`bookings/${id}/cancel`),
};

export const paymentAPI = {
  process: (d) => api.post('payments/', d),
  validateCoupon: (d) => api.post('payments/validate-coupon', d),
  myPayments: () => api.get('payments/my'),
};

export const invoiceAPI = {
  download: (bookingId) =>
    api.get(`invoices/${bookingId}`, { responseType: 'blob' }),
};

export const reviewAPI = {
  submit: (d) => api.post('reviews/', d),
  get: (vehicleId) => api.get(`reviews/${vehicleId}`),
};

export const adminAPI = {
  dashboardStats: () => api.get('admin/stats'),
  vehicles: () => api.get('admin/vehicles'),
  createVehicle: (d) => api.post('admin/vehicles', d),
  updateVehicle: (id, d) => api.put(`admin/vehicles/${id}`, d),
  deleteVehicle: (id) => api.delete(`admin/vehicles/${id}`),
  bookings: () => api.get('admin/bookings'),
  updateBookingStatus: (id, status) => api.put(`admin/bookings/${id}/status`, { status }),
  payments: () => api.get('admin/payments'),
  locations: () => api.get('admin/locations'),
  createLocation: (d) => api.post('admin/locations', d),
  updateLocation: (id, d) => api.put(`admin/locations/${id}`, d),
  deleteLocation: (id) => api.delete(`admin/locations/${id}`),
  users: () => api.get('admin/users'),
  coupons: () => api.get('admin/coupons'),
  createCoupon: (d) => api.post('admin/coupons', d),
};

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('uploads/', formData);
  }
};

export default api;
