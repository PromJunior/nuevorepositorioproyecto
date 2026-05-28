export const env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000',
    appName: import.meta.env.VITE_APP_NAME || 'ERP SaaS',
    authStorageKey: 'erp-auth-storage',
    legacyTokenKey: 'token',
};
