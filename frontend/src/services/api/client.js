import axios from 'axios';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/authStore';

export const apiClient = axios.create({
    baseURL: env.apiBaseUrl,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token || localStorage.getItem(env.legacyTokenKey);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const originalRequest = error.config;

        if (status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;

            // Refresh token hook point. Backend support can be wired here later.
            useAuthStore.getState().logout();

            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
