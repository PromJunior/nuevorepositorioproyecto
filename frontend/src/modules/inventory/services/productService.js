import api from '../../../api/axios';

const normalizeProductPayload = (productData) => ({
    name_product: productData.name_product,
    price: Number(productData.price),
    stock: Number(productData.stock),
    description: productData.description || '',
    stockProduct: Boolean(productData.stockProduct),
    category_id: Number(productData.category_id),
});

export const productService = {
    getProducts: async () => {
        const response = await api.get('/products/');
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/categories/');
        return response.data;
    },

    createProduct: async (productData) => {
        const response = await api.post('/create_products/', normalizeProductPayload(productData));
        return response.data;
    },

    updateProduct: async (productId, productData) => {
        const response = await api.put(`/update_products/${productId}/`, normalizeProductPayload(productData));
        return response.data;
    },

    deleteProduct: async (productId) => {
        const response = await api.delete(`/delete_product/${productId}`);
        return response.data;
    },
};
