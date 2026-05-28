import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            role: null,

            // Sincroniza las credenciales e inyecta el rol decodificado
            setAuth: (token, user = null) => {
                try {
                    const decoded = jwtDecode(token);
                    const role = decoded.role || null;
                    
                    // También lo guardamos en localStorage para compatibilidad con código viejo
                    localStorage.setItem('token', token);

                    set({
                        token,
                        user: user || { username: decoded.sub },
                        role
                    });
                } catch (error) {
                    console.error("Error al decodificar token JWT:", error);
                    get().clearAuth();
                }
            },

            // Limpia todo rastro de autenticación en caché y localstorage
            clearAuth: () => {
                localStorage.removeItem('token');
                set({
                    token: null,
                    user: null,
                    role: null
                });
            },

            // Helper de rol para verificaciones directas en UI (RBAC)
            hasRole: (allowedRoles) => {
                const currentRole = get().role;
                if (!currentRole) return false;
                if (Array.isArray(allowedRoles)) {
                    return allowedRoles.map(r => r.toLowerCase()).includes(currentRole.toLowerCase());
                }
                return currentRole.toLowerCase() === allowedRoles.toLowerCase();
            },

            // Verifica si el usuario actual está debidamente autenticado y vigente
            isAuthenticated: () => {
                const token = get().token;
                if (!token) return false;

                try {
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;
                    return decoded.exp > currentTime;
                } catch {
                    return false;
                }
            }
        }),
        {
            name: 'erp-auth-storage', // Clave única de persistencia en LocalStorage
            partialize: (state) => ({ token: state.token, user: state.user, role: state.role }), // Elementos a persistir
        }
    )
);
