import { apiClient } from './client';

export const voterApi = {
  getClubs: (campus = '') => {
    const query = campus ? `?campus=${encodeURIComponent(campus)}` : '';
    return apiClient(`/api/voter/clubs${query}`);
  },

  googleLogin: (idToken) =>
    apiClient('/api/voter/google-login', {
      method: 'POST',
      body: {
        id_token: idToken,
        auto_register: true
      }
    }),

  checkEligibility: (identifier) =>
    apiClient('/api/voter/check-eligibility', {
      method: 'POST',
      body: {
        email: identifier.includes('@') ? identifier : undefined,
        student_id: !identifier.includes('@') ? identifier : undefined,
      }
    }),

  getCampusBallot: (identifier) =>
    apiClient(`/api/voter/campus-ballot?identifier=${encodeURIComponent(identifier)}`),

  castMultiVote: (data) =>
    apiClient('/api/voter/cast-multi-vote', {
      method: 'POST',
      body: data
    }),

  castVote: (data) =>
    apiClient('/api/voter/cast-vote', {
      method: 'POST',
      body: data
    })
};
