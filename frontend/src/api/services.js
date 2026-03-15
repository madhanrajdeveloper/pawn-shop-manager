// frontend/src/api/services.js
import apiClient from './client';

export const CustomerService = {
  getAll: () => apiClient.get('/customers/'),
  create: (data) => apiClient.post('/customers/', data),
};

export const LoanService = {
  getAll: () => apiClient.get('/loans/'),
  create: (data) => apiClient.post('/loans/', data),
};

export const PaymentService = {
  getAll: () => apiClient.get('/payments/'),
  create: (data) => apiClient.post('/payments/', data),
};

export const BuySellService = {
  getAll: () => apiClient.get('/buy-sell/'),
  create: (data) => apiClient.post('/buy-sell/', data),
};

export const DashboardService = {
  // Matches the new backend route that calculates monthly interest and gold weight
  getSummary: () => apiClient.get('/dashboard-summary/'),
};