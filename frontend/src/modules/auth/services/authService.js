import apiClient from '../../../services/api/client';

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
};
