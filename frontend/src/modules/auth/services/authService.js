import api from '../../../api/axios';

export const authService = {
    /**
     * Realiza la autenticación del usuario mediante credenciales en formato urlencoded
     * @param {string} username Nombre del usuario
     * @param {string} password Contraseña
     * @returns {Promise<{ access_token: string, token_type: string }>}
     */
    login: async (username, password) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await api.post('/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        return response.data;
    },

    /**
     * Obtiene el perfil completo del usuario autenticado actual
     * @returns {Promise<any>}
     */
    getCurrentUserProfile: async () => {
        const response = await api.get('/users/me');
        return response.data;
    }
};
