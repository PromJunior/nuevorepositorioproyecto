/**
 * Servicio de Proveedores – nivel módulo.
 * Usa apiClient (Axios con JWT). NO usa fetch.
 */
import apiClient from '../../../services/api/client';

export const supplierService = {
    /** Lista todos los proveedores registrados */
    getSuppliers: async (params = {}) => {
        const response = await apiClient.get('/suppliers/', { params });
        return response.data;
    },

    /** Obtiene un proveedor por ID */
    getSupplierById: async (id) => {
        const response = await apiClient.get(`/suppliers/${id}`);
        return response.data;
    },

    /**
     * Busca proveedor por RUC en la BD LOCAL.
     * NO llama a ApiPeru. Lanza 404 si no existe.
     */
    getSupplierByRuc: async (ruc) => {
        const response = await apiClient.get(`/suppliers/ruc-local/${ruc}`);
        return response.data;
    },

    /**
     * Consulta datos del RUC en ApiPeru.
     * Solo llamar cuando getSupplierByRuc() devuelve 404.
     */
    consultRuc: async (ruc) => {
        const response = await apiClient.get(`/suppliers/ruc/${ruc}`);
        return response.data;
    },

    /**
     * Registra un nuevo proveedor.
     * @param {{ ruc, company_name, phone?, email? }} data
     */
    createSupplier: async (data) => {
        const response = await apiClient.post('/suppliers/', data);
        return response.data;
    },

    /**
     * Actualiza datos de contacto del proveedor (no modifica RUC).
     * @param {number} id
     * @param {{ company_name?, phone?, email? }} data
     */
    updateSupplier: async (id, data) => {
        const response = await apiClient.put(`/suppliers/${id}`, data);
        return response.data;
    },
};
