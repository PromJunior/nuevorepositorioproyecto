import apiClient from './api/client';

export const supplierService = {
    getSuppliers: async (params = {}) => {
        const response = await apiClient.get('/suppliers/', { params });
        return response.data;
    },

    createSupplier: async (supplierData) => {
        const response = await apiClient.post('/suppliers/', supplierData);
        return response.data;
    },

    consultRuc: async (ruc) => {
        const response = await apiClient.get(`/suppliers/ruc/${ruc}`);
        return response.data;
    },
};
