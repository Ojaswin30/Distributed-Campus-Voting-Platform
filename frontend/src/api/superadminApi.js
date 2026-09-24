import { apiClient } from './client';

export const superadminApi = {
  // Admin accounts CRUD
  getAdmins: () => apiClient('/api/superadmin/admins'),

  addAdmin: (data) =>
    apiClient('/api/superadmin/admins', {
      method: 'POST',
      body: data
    }),

  updateAdmin: (adminId, data) =>
    apiClient(`/api/superadmin/admins/${adminId}`, {
      method: 'PUT',
      body: data
    }),

  deleteAdmin: (adminId) =>
    apiClient(`/api/superadmin/admins/${adminId}`, {
      method: 'DELETE'
    }),

  // Access Request Tickets
  getRequests: (status = '') => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient(`/api/superadmin/requests${query}`);
  },

  createRequest: (data) =>
    apiClient('/api/superadmin/requests/create', {
      method: 'POST',
      body: data
    }),

  approveRequest: (ticketId) =>
    apiClient(`/api/superadmin/requests/${ticketId}/approve`, {
      method: 'POST'
    }),

  rejectRequest: (ticketId) =>
    apiClient(`/api/superadmin/requests/${ticketId}/reject`, {
      method: 'POST'
    }),

  deleteRequest: (ticketId) =>
    apiClient(`/api/superadmin/requests/${ticketId}`, {
      method: 'DELETE'
    })
};
