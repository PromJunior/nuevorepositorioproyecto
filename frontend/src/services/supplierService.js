import apiClient from './api/client';

export const supplierService = {
    getSuppliers: async (params = {}) => {
        const response = await apiClient.get('/suppliers/', { params });
        return response.data;
    },

    getSupplierById: async (id) => {
        const response = await apiClient.get(`/suppliers/${id}`);
        return response.data;
    },

    /** Busca proveedor por RUC en BD local – NO llama ApiPeru */
    getSupplierByRucLocal: async (ruc) => {
        const response = await apiClient.get(`/suppliers/ruc-local/${ruc}`);
        return response.data;
    },

    /** Consulta RUC en ApiPeru – solo cuando no está en BD local */
    consultRuc: async (ruc) => {
        const response = await apiClient.get(`/suppliers/ruc/${ruc}`);
        return response.data;
    },

    createSupplier: async (supplierData) => {
        const response = await apiClient.post('/suppliers/', supplierData);
        return response.data;
    },

    updateSupplier: async (id, data) => {
        const response = await apiClient.put(`/suppliers/${id}`, data);
        return response.data;
    },
};
