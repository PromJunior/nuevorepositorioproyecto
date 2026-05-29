/**
 * Servicio de Compras – nivel módulo.
 * Usa apiClient (Axios con JWT). NO usa fetch.
 */
import apiClient from '../../../services/api/client';

export const purchaseService = {
    /** Lista paginada de compras */
    getPurchases: async (params = {}) => {
        const response = await apiClient.get('/purchases/', { params });
        return response.data;
    },

    /** Detalle completo: ítems con nombre, proveedor, usuario, estado */
    getPurchaseById: async (id) => {
        const response = await apiClient.get(`/purchases/${id}`);
        return response.data;
    },

    /**
     * Crea compra en estado BORRADOR.
     * @param {{ supplier_id, invoice_number?, items: [{product_id, quantity, unit_cost}] }} data
     */
    createPurchase: async (data) => {
        const response = await apiClient.post('/purchases/', data);
        return response.data;
    },

    /**
     * Recibe la compra: actualiza stock y genera InventoryTransaction ENTRADA.
     * Solo funciona si la compra está en BORRADOR.
     */
    receivePurchase: async (id) => {
        const response = await apiClient.post(`/purchases/${id}/receive`);
        return response.data;
    },

    /**
     * Cancela la compra (solo BORRADOR → CANCELADA).
     * No revierte stock porque aún no fue recibida.
     */
    cancelPurchase: async (id) => {
        const response = await apiClient.post(`/purchases/${id}/cancel`);
        return response.data;
    },
};
