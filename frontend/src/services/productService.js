import apiClient from './api/client';

export const normalizeProductPayload = (productData) => ({
    name_product: productData.name_product,
    price: Number(productData.price),
    stock: Number(productData.stock),
    description: productData.description || '',
    stockProduct: Boolean(productData.stockProduct),
    category_id: Number(productData.category_id),
});

export const productService = {
    getProducts: async (params = {}) => {
        const response = await apiClient.get('/products/', { params });
        return response.data;
    },

    getCategories: async () => {
        const response = await apiClient.get('/categories/');
        return response.data;
    },

    createProduct: async (productData) => {
        const response = await apiClient.post('/create_products/', normalizeProductPayload(productData));
        return response.data;
    },

    updateProduct: async (productId, productData) => {
        const response = await apiClient.put(`/update_products/${productId}/`, normalizeProductPayload(productData));
        return response.data;
    },

    deleteProduct: async (productId) => {
        const response = await apiClient.delete(`/delete_product/${productId}`);
        return response.data;
    },
};
