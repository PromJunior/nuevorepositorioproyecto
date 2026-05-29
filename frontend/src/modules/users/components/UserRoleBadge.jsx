import React from 'react';
import { Shield, ShoppingCart, Users } from 'lucide-react';

const ROLE_CONFIG = {
    admin: {
        label: 'Admin',
        className: 'border-blue-200 bg-blue-50 text-blue-700',
        icon: Shield,
    },
    vendedor: {
        label: 'Vendedor',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: ShoppingCart,
    },
};

const DEFAULT_CONFIG = {
    label: null,
    className: 'border-slate-200 bg-slate-50 text-slate-600',
    icon: Users,
};

/**
 * Pill del rol del usuario con ícono semántico.
 * @param {string} role - nombre del rol (ej: 'admin', 'vendedor')
 */
export const UserRoleBadge = ({ role }) => {
    const config = ROLE_CONFIG[role?.toLowerCase()] ?? DEFAULT_CONFIG;
    const IconComp = config.icon;
    const label = config.label ?? (role ? role.charAt(0).toUpperCase() + role.slice(1) : '—');

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
            <IconComp size={11} />
            {label}
        </span>
    );
};
