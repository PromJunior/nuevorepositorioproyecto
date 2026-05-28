import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '../config/env';
import { getUserFromToken, isTokenExpired } from '../utils/jwt';

const syncLegacyToken = (token) => {
    if (token) {
        localStorage.setItem(env.legacyTokenKey, token);
        return;
    }

    localStorage.removeItem(env.legacyTokenKey);
};

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: localStorage.getItem(env.legacyTokenKey),
            refreshToken: null,
            user: null,
            role: null,
            status: 'idle',

            login: ({ token, refreshToken = null, user = null }) => {
                const tokenUser = getUserFromToken(token);
                const nextUser = user || tokenUser;
                const nextRole = nextUser?.role || tokenUser?.role || null;

                syncLegacyToken(token);

                set({
                    token,
                    refreshToken,
                    user: nextUser,
                    role: nextRole,
                    status: 'authenticated',
                });
            },

            logout: () => {
                syncLegacyToken(null);

                set({
                    token: null,
                    refreshToken: null,
                    user: null,
                    role: null,
                    status: 'anonymous',
                });
            },

            hydrateFromToken: () => {
                const stateToken = get().token;
                const legacyToken = localStorage.getItem(env.legacyTokenKey);
                const token = stateToken || legacyToken;

                if (!token || isTokenExpired(token)) {
                    get().logout();
                    return false;
                }

                const tokenUser = getUserFromToken(token);
                syncLegacyToken(token);

                set({
                    token,
                    user: get().user || tokenUser,
                    role: get().role || tokenUser?.role || null,
                    status: 'authenticated',
                });

                return true;
            },

            isAuthenticated: () => {
                const token = get().token || localStorage.getItem(env.legacyTokenKey);
                return Boolean(token && !isTokenExpired(token));
            },

            hasRole: (allowedRoles) => {
                const currentRole = get().role || getUserFromToken(get().token)?.role;
                if (!currentRole) return false;
                if (!allowedRoles) return true;

                const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
                return roles.map((role) => role.toLowerCase()).includes(currentRole.toLowerCase());
            },

            setAuth: (token, user = null) => get().login({ token, user }),
            clearAuth: () => get().logout(),
        }),
        {
            name: env.authStorageKey,
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
                user: state.user,
                role: state.role,
                status: state.status,
            }),
            onRehydrateStorage: () => (state) => {
                state?.hydrateFromToken();
            },
        },
    ),
);
