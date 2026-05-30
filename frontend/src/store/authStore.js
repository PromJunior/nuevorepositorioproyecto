import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_ROLES, ROUTE_PERMISSIONS, ROUTES } from '../constants/routes';
import { env } from '../config/env';
import { getUserFromToken, isTokenExpired } from '../utils/jwt';

const isValidTokenValue = (token) => {
    return Boolean(token && token !== 'null' && token !== 'undefined');
};

const getTokenFromPersistedAuth = () => {
    try {
        const persistedAuth = JSON.parse(localStorage.getItem(env.authStorageKey) || '{}');
        const state = persistedAuth.state || persistedAuth;

        return state.token || state.access_token || state.authToken || null;
    } catch {
        return null;
    }
};

export const getStoredAuthToken = () => {
    const legacyToken = localStorage.getItem(env.legacyTokenKey);
    const persistedToken = getTokenFromPersistedAuth();

    if (isValidTokenValue(legacyToken)) return legacyToken;
    if (isValidTokenValue(persistedToken)) return persistedToken;

    return null;
};

const syncLegacyToken = (token) => {
    if (isValidTokenValue(token)) {
        localStorage.setItem(env.legacyTokenKey, token);
        return;
    }

    localStorage.removeItem(env.legacyTokenKey);
};

const getPermissionsForRole = (role) => {
    if (!role) return [];
    if (role === APP_ROLES.admin) return Object.keys(ROUTE_PERMISSIONS);

    return Object.entries(ROUTE_PERMISSIONS)
        .filter(([, roles]) => roles.includes(role))
        .map(([route]) => route);
};

const getDefaultRouteForRole = (role) => {
    if (role === APP_ROLES.seller) return ROUTES.sales;
    return ROUTES.app;
};

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: getStoredAuthToken(),
            refreshToken: null,
            user: null,
            role: null,
            permissions: [],
            loading: false,
            status: 'idle',

            login: ({ token, refreshToken = null, user = null }) => {
                if (!isValidTokenValue(token)) {
                    throw new Error('No se recibio un token de acceso valido.');
                }

                const tokenUser = getUserFromToken(token);
                const nextUser = user || tokenUser;
                const nextRole = nextUser?.role || tokenUser?.role || null;

                syncLegacyToken(token);

                set({
                    token,
                    refreshToken,
                    user: nextUser,
                    role: nextRole,
                    permissions: getPermissionsForRole(nextRole),
                    loading: false,
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
                    permissions: [],
                    loading: false,
                    status: 'anonymous',
                });
            },

            setLoading: (loading) => set({ loading }),

            hydrateFromToken: () => {
                const stateToken = get().token;
                const token = isValidTokenValue(stateToken) ? stateToken : getStoredAuthToken();

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
                    permissions: getPermissionsForRole(get().role || tokenUser?.role || null),
                    loading: false,
                    status: 'authenticated',
                });

                return true;
            },

            isAuthenticated: () => {
                const stateToken = get().token;
                const token = isValidTokenValue(stateToken) ? stateToken : getStoredAuthToken();
                return Boolean(token && !isTokenExpired(token));
            },

            hasRole: (allowedRoles) => {
                const currentRole = get().role || getUserFromToken(get().token)?.role;
                if (!currentRole) return false;
                if (!allowedRoles) return true;

                const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
                return roles.map((role) => role.toLowerCase()).includes(currentRole.toLowerCase());
            },

            isAdmin: () => get().role === APP_ROLES.admin,

            can: (permissionOrRoles) => {
                if (!permissionOrRoles) return true;

                const role = get().role;
                if (role === APP_ROLES.admin) return true;

                if (Array.isArray(permissionOrRoles)) {
                    return get().hasRole(permissionOrRoles);
                }

                if (ROUTE_PERMISSIONS[permissionOrRoles]) {
                    return get().permissions.includes(permissionOrRoles);
                }

                return get().hasRole(permissionOrRoles);
            },

            getDefaultRoute: () => getDefaultRouteForRole(get().role),

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
                permissions: state.permissions,
                status: state.status,
            }),
            onRehydrateStorage: () => (state) => {
                state?.hydrateFromToken();
            },
        },
    ),
);
