/**
 * Sistema centralizado de permisos del ERP.
 *
 * Uso desde componentes:
 *   const canCreate = usePermission(PERMISSIONS.USERS_CREATE);
 *
 * Uso fuera de componentes (callbacks, guards):
 *   import { can } from '../core/permissions';
 *   can('admin', PERMISSIONS.USERS_CREATE);
 */
import { useAuthStore } from '../store/authStore';

// ─── Constantes de permiso ────────────────────────────────────────────────────
export const PERMISSIONS = {
    // Usuarios
    USERS_VIEW:     'USERS_VIEW',
    USERS_CREATE:   'USERS_CREATE',
    USERS_UPDATE:   'USERS_UPDATE',
    USERS_DISABLE:  'USERS_DISABLE',

    // Productos / Inventario
    PRODUCTS_VIEW:   'PRODUCTS_VIEW',
    PRODUCTS_CREATE: 'PRODUCTS_CREATE',
    PRODUCTS_UPDATE: 'PRODUCTS_UPDATE',
    PRODUCTS_DELETE: 'PRODUCTS_DELETE',

    // Ventas
    SALES_VIEW:   'SALES_VIEW',
    SALES_CREATE: 'SALES_CREATE',

    // Compras
    PURCHASES_VIEW:    'PURCHASES_VIEW',
    PURCHASES_CREATE:  'PURCHASES_CREATE',
    PURCHASES_RECEIVE: 'PURCHASES_RECEIVE',
    PURCHASES_CANCEL:  'PURCHASES_CANCEL',

    // Kardex
    KARDEX_VIEW: 'KARDEX_VIEW',

    // Reportes
    REPORTS_VIEW:   'REPORTS_VIEW',
    REPORTS_EXPORT: 'REPORTS_EXPORT',

    // Caja
    CASH_OPEN:  'CASH_OPEN',
    CASH_CLOSE: 'CASH_CLOSE',
    CASH_VIEW:  'CASH_VIEW',

    // Proveedores
    SUPPLIERS_VIEW:   'SUPPLIERS_VIEW',
    SUPPLIERS_CREATE: 'SUPPLIERS_CREATE',
    SUPPLIERS_UPDATE: 'SUPPLIERS_UPDATE',

    // Clientes
    CLIENTS_VIEW:   'CLIENTS_VIEW',
    CLIENTS_CREATE: 'CLIENTS_CREATE',

    // Dashboard
    DASHBOARD_VIEW: 'DASHBOARD_VIEW',
};

// ─── Mapa rol → permisos ──────────────────────────────────────────────────────
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
    admin: ALL_PERMISSIONS,

    vendedor: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.SALES_CREATE,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.CLIENTS_VIEW,
        PERMISSIONS.CLIENTS_CREATE,
        PERMISSIONS.CASH_OPEN,
        PERMISSIONS.CASH_CLOSE,
        PERMISSIONS.CASH_VIEW,
        PERMISSIONS.KARDEX_VIEW,
    ],
};

// ─── Verificación sin hook (para callbacks, guards) ───────────────────────────
/**
 * @param {string} role - nombre del rol (ej: 'admin', 'vendedor')
 * @param {string} permission - constante de PERMISSIONS
 * @returns {boolean}
 */
export const can = (role, permission) => {
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role] ?? [];
    return perms.includes(permission);
};

// ─── Hook React para componentes ──────────────────────────────────────────────
/**
 * @param {string|string[]} permission - uno o varios PERMISSIONS.*
 * @returns {boolean}
 */
export const usePermission = (permission) => {
    const role = useAuthStore((s) => s.role);
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role] ?? [];
    if (Array.isArray(permission)) return permission.every((p) => perms.includes(p));
    return perms.includes(permission);
};

/**
 * Devuelve true si el usuario tiene AL MENOS uno de los permisos.
 * @param {string[]} permissions
 */
export const useAnyPermission = (permissions = []) => {
    const role = useAuthStore((s) => s.role);
    if (!role) return false;
    const perms = ROLE_PERMISSIONS[role] ?? [];
    return permissions.some((p) => perms.includes(p));
};
