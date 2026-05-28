export const ROUTES = {
    login: '/login',
    unauthorized: '/unauthorized',
    app: '/',
    sales: '/ventas',
    inventory: '/inventario',
    orders: '/detalle',
    cashClosing: '/cierre',
    features: '/features',
};

export const APP_ROLES = {
    admin: 'admin',
    seller: 'vendedor',
};

export const PROTECTED_ROLES = [APP_ROLES.admin, APP_ROLES.seller];
