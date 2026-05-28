import api from '../../../api/axios';

export const productService = {
    /**
     * Obtiene la lista completa de productos
     * @returns {Promise<any[]>}
     */
    getProducts: async () => {
        const response = await api.get('/products/');
        return response.data;
    },

    /**
     * Obtiene la lista de categorías registradas
     * @returns {Promise<any[]>}
     */
    getCategories: async () => {
        const response = await api.get('/categories/');
        return response.data;
    },

    /**
     * Crea un nuevo producto en el catálogo
     * @param {object} productData Ficha técnica del producto
     * @returns {Promise<any>}
     */
    createProduct: async (productData) => {
        const response = await api.post('/create_products/', productData);
        return response.data;
    },

    /**
     * Actualiza la ficha técnica o stock de un producto
     * @param {number} productId Identificador único
     * @param {object} productData Nuevos atributos del producto
     * @returns {Promise<any>}
     */
    updateProduct: async (productId, productData) => {
        const response = await api.put(`/update_products/${productId}/`, productData);
        return response.data;
    },

    /**
     * Elimina lógicamente un producto del inventario activo
     * @param {number} productId Identificador único
     * @returns {Promise<any>}
     */
    deleteProduct: async (productId) => {
        const response = await api.delete(`/delete_product/${productId}`);
        return response.data;
    }
};
