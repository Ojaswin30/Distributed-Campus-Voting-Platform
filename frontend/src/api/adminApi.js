import { apiClient } from './client';

export const adminApi = {
  login: (username, password) => 
    apiClient('/api/admin/login', {
      method: 'POST',
      body: { username, password }
    }),

  getDashboardData: (campus = '') => {
    const query = campus ? `?campus=${encodeURIComponent(campus)}` : '';
    return apiClient(`/api/admin/dashboard-data${query}`);
  },

  getCampuses: (activeOnly = false) =>
    apiClient(`/api/admin/campuses?active_only=${activeOnly}`),

  addCampus: (data) =>
    apiClient('/api/admin/add-campus', {
      method: 'POST',
      body: data
    }),

  updateCampus: (campusId, data) =>
    apiClient(`/api/admin/update-campus/${campusId}`, {
      method: 'PUT',
      body: data
    }),

  deleteCampus: (campusId, force = false) =>
    apiClient(`/api/admin/delete-campus/${campusId}?force=${force}`, {
      method: 'DELETE'
    }),

  addClub: (data) =>
    apiClient('/api/admin/add-club', {
      method: 'POST',
      body: data
    }),

  updateClub: (clubId, data) =>
    apiClient(`/api/admin/update-club/${clubId}`, {
      method: 'PUT',
      body: data
    }),

  toggleClubStatus: (clubId, isActive = null) => {
    const query = isActive !== null ? `?is_active=${isActive ? 1 : 0}` : '';
    return apiClient(`/api/admin/toggle-club/${clubId}${query}`, {
      method: 'PUT'
    });
  },

  deleteClub: (clubId) =>
    apiClient(`/api/admin/delete-club/${clubId}`, {
      method: 'DELETE'
    }),

  addCandidate: (studentId, clubId) =>
    apiClient('/api/admin/add-candidate', {
      method: 'POST',
      body: { student_id: studentId, club_id: clubId }
    }),

  deleteCandidate: (candidateId) =>
    apiClient(`/api/admin/delete-candidate/${candidateId}`, {
      method: 'DELETE'
    }),

  addStudent: (data) =>
    apiClient('/api/admin/add-student', {
      method: 'POST',
      body: data
    }),

  bulkUploadStudents: (students) =>
    apiClient('/api/admin/bulk-upload-students', {
      method: 'POST',
      body: { students }
    }),

  deleteStudent: (enrollmentId) =>
    apiClient(`/api/admin/student/${encodeURIComponent(enrollmentId)}`, {
      method: 'DELETE'
    }),

  clearStudents: (campus = '') => {
    const query = campus ? `?campus=${encodeURIComponent(campus)}` : '';
    return apiClient(`/api/admin/clear-students${query}`, {
      method: 'POST'
    });
  }
};
