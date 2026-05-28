import apiClient from './api/client';

export const authService = {
    login: async ({ username, password }) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await apiClient.post('/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data;
    },

    getCurrentUserProfile: async () => {
        const response = await apiClient.get('/users/me');
        return response.data;
    },

    getUsers: async () => {
        const response = await apiClient.get('/users/');
        return response.data;
    },

    updateUser: async (userId, userData) => {
        const response = await apiClient.put(`/users/${userId}`, userData);
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await apiClient.delete(`/users/${userId}`);
        return response.data;
    },
};
