import apiClient from './api/client';

export const clientService = {
    getClients: async (params = {}) => {
        const response = await apiClient.get('/clients/', { params });
        return response.data;
    },

    getClientByDni: async (dni) => {
        const response = await apiClient.get(`/clients/${dni}`);
        return response.data;
    },

    consultDni: async (dni) => {
        const response = await apiClient.get(`/clients/dni/${dni}`);
        return response.data;
    },

    createClient: async (clientData) => {
        const response = await apiClient.post('/clients/', clientData);
        return response.data;
    },
};
