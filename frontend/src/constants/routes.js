export const ROUTES = {
    login: '/login',
    unauthorized: '/unauthorized',
    app: '/',
    sales: '/ventas',
    inventory: '/inventario',
    purchases: '/compras',
    clients: '/clientes',
    suppliers: '/proveedores',
    orders: '/detalle',
    cashClosing: '/cierre',
    kardex: '/kardex',
    reports: '/reportes',
    users: '/usuarios',
    settings: '/configuracion',
    features: '/features',
};

export const APP_ROLES = {
    admin: 'admin',
    seller: 'vendedor',
    supervisor: 'supervisor',
};

export const PROTECTED_ROLES = [APP_ROLES.admin, APP_ROLES.seller, APP_ROLES.supervisor];

export const ROUTE_PERMISSIONS = {
    [ROUTES.app]: [APP_ROLES.admin],
    [ROUTES.sales]: [APP_ROLES.admin, APP_ROLES.seller],
    [ROUTES.inventory]: [APP_ROLES.admin],
    [ROUTES.purchases]: [APP_ROLES.admin],
    [ROUTES.clients]: [APP_ROLES.admin, APP_ROLES.seller],
    [ROUTES.suppliers]: [APP_ROLES.admin],
    [ROUTES.cashClosing]: [APP_ROLES.admin, APP_ROLES.seller],
    [ROUTES.kardex]: [APP_ROLES.admin],
    [ROUTES.reports]: [APP_ROLES.admin],
    [ROUTES.users]: [APP_ROLES.admin],
    [ROUTES.settings]: [APP_ROLES.admin, APP_ROLES.supervisor],
    [ROUTES.orders]: [APP_ROLES.admin, APP_ROLES.seller],
    [ROUTES.features]: [APP_ROLES.admin],
};
