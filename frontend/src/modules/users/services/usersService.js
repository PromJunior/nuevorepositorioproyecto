/**
 * Users Service – nivel módulo.
 * Usa apiClient (Axios + JWT). NO usa fetch.
 */
import apiClient from '../../../services/api/client';

export const usersService = {
    /** Lista todos los usuarios con su rol */
    getUsers: async () => {
        const response = await apiClient.get('/users/');
        return response.data;
    },

    /**
     * Crea un nuevo usuario.
     * @param {{ username, fullname, role, password }} data
     */
    createUser: async (data) => {
        const response = await apiClient.post('/register/', data);
        return response.data;
    },

    /**
     * Actualiza fullname, rol, contraseña o is_active del usuario.
     * Solo enviar los campos que cambian.
     * @param {number} id
     * @param {{ fullname?, role?, password?, is_active? }} data
     */
    updateUser: async (id, data) => {
        const response = await apiClient.put(`/users/${id}`, data);
        return response.data;
    },

    /** Desactiva lógicamente al usuario (is_active = false) */
    deactivateUser: async (id) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    },

    /** Reactiva al usuario (is_active = true) */
    activateUser: async (id) => {
        const response = await apiClient.post(`/users/${id}/activate`);
        return response.data;
    },
};

export const rolesService = {
    /** Lista todos los roles disponibles */
    getRoles: async () => {
        const response = await apiClient.get('/roles/');
        return response.data;
    },

    /** Crea un rol nuevo (admin only) */
    createRole: async (name) => {
        const response = await apiClient.post('/roles/', { name });
        return response.data;
    },
};
