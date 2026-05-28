import apiClient from './api/client';

export const orderService = {
    getOrders: async (params = {}) => {
        const response = await apiClient.get('/order/', { params });
        return response.data;
    },

    createOrder: async (orderData) => {
        const response = await apiClient.post('/create_order/', orderData);
        return response.data;
    },

    updateOrder: async (orderId, orderData) => {
        const response = await apiClient.put(`/update_order/${orderId}`, orderData);
        return response.data;
    },

    deleteOrder: async (orderId) => {
        const response = await apiClient.delete(`/delete_order/${orderId}`);
        return response.data;
    },
};
