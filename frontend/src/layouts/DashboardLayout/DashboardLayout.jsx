import React, { useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Archive,
    BarChart3,
    BriefcaseBusiness,
    ChevronDown,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    ShoppingBag,
    ShoppingCart,
    Settings,
    Truck,
    UserCog,
    Users,
    Wallet,
    Workflow,
    X,
} from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { APP_ROLES, ROUTE_PERMISSIONS, ROUTES } from '../../constants/routes';
import { useDisclosure } from '../../hooks/useDisclosure';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const NAV_SECTIONS = [
    {
        label: 'Operación',
        items: [
            { to: ROUTES.app,          label: 'Dashboard',        icon: LayoutDashboard, roles: ROUTE_PERMISSIONS[ROUTES.app],          end: true },
            { to: ROUTES.sales,        label: 'Ventas',           icon: ShoppingCart,    roles: ROUTE_PERMISSIONS[ROUTES.sales] },
            { to: ROUTES.clients,      label: 'Clientes',         icon: Users,           roles: ROUTE_PERMISSIONS[ROUTES.clients] },
            { to: ROUTES.cashClosing,  label: 'Caja',             icon: Wallet,          roles: ROUTE_PERMISSIONS[ROUTES.cashClosing] },
        ],
    },
    {
        label: 'Inventario',
        items: [
            { to: ROUTES.inventory,    label: 'Inventario',       icon: Package,         roles: ROUTE_PERMISSIONS[ROUTES.inventory] },
            { to: ROUTES.kardex,       label: 'Kardex',           icon: Archive,         roles: ROUTE_PERMISSIONS[ROUTES.kardex] },
            { to: ROUTES.purchases,    label: 'Compras',          icon: ShoppingBag,     roles: ROUTE_PERMISSIONS[ROUTES.purchases] },
            { to: ROUTES.suppliers,    label: 'Proveedores',      icon: Truck,           roles: ROUTE_PERMISSIONS[ROUTES.suppliers] },
        ],
    },
    {
        label: 'Gestión',
        items: [
            { to: ROUTES.orders,       label: 'Órdenes',          icon: ClipboardList,   roles: ROUTE_PERMISSIONS[ROUTES.orders] },
            { to: ROUTES.reports,      label: 'Reportes',         icon: BarChart3,       roles: ROUTE_PERMISSIONS[ROUTES.reports] },
            { to: ROUTES.automations,  label: 'Automatizaciones', icon: Workflow,        roles: ROUTE_PERMISSIONS[ROUTES.automations] },
            { to: ROUTES.users,        label: 'Usuarios',         icon: UserCog,         roles: ROUTE_PERMISSIONS[ROUTES.users] },
            { to: ROUTES.settings,     label: 'Configuración',    icon: Settings,        roles: ROUTE_PERMISSIONS[ROUTES.settings] },
        ],
    },
];

const pathLabels = {
    [ROUTES.app]:         'Dashboard',
    [ROUTES.sales]:       'Ventas',
    [ROUTES.inventory]:   'Inventario',
    [ROUTES.purchases]:   'Compras',
    [ROUTES.clients]:     'Clientes',
    [ROUTES.suppliers]:   'Proveedores',
    [ROUTES.cashClosing]: 'Caja',
    [ROUTES.kardex]:      'Kardex',
    [ROUTES.reports]:     'Reportes',
    [ROUTES.automations]: 'Automatizaciones',
    [ROUTES.users]:       'Usuarios',
    [ROUTES.settings]:    'Configuración',
    [ROUTES.orders]:      'Órdenes',
    [ROUTES.features]:    'Features',
};

const canSeeItem = (role, roles = []) => role === APP_ROLES.admin || roles.includes(role);

/* ---- Sidebar ---- */
const SidebarContent = ({ role, onNavigate }) => (
    <div className="flex h-full flex-col bg-white">
        {/* Logo / Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <BriefcaseBusiness size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
                <span className="block truncate text-[13px] font-black tracking-tight text-slate-900">ERP SaaS</span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {role || 'usuario'}
                </span>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section) => {
                const visibleItems = section.items.filter((item) => canSeeItem(role, item.roles));
                if (visibleItems.length === 0) return null;

                return (
                    <div key={section.label}>
                        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {section.label}
                        </p>
                        <div className="space-y-0.5">
                            {visibleItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={item.end}
                                        onClick={onNavigate}
                                        className={({ isActive }) => cn(
                                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all duration-150',
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                                        )}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Icon
                                                    size={16}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}
                                                />
                                                <span>{item.label}</span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </nav>

        {/* Bottom divider */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
            <p className="text-[10px] font-medium text-slate-400 text-center">
                © 2025 ERP SaaS
            </p>
        </div>
    </div>
);

/* ---- Breadcrumbs ---- */
const Breadcrumbs = ({ pathname }) => {
    const currentLabel = pathLabels[pathname] || 'ERP';
    return (
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:flex">
            <span className="text-slate-400">ERP</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-600">{currentLabel}</span>
        </nav>
    );
};

/* ---- User Menu ---- */
const UserMenu = ({ user, role, onLogout }) => {
    const menu = useDisclosure(false);
    const initial = (user?.username || 'U').slice(0, 1).toUpperCase();

    return (
        <div className="relative">
            <button
                type="button"
                onClick={menu.toggle}
                className="flex h-9 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                    {initial}
                </span>
                <span className="hidden max-w-28 truncate text-xs sm:block">{user?.username || 'Usuario'}</span>
                <ChevronDown size={14} className="shrink-0 text-slate-400" />
            </button>

            {menu.isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="fixed inset-0 z-10"
                        onClick={menu.close}
                    />
                    <div className="absolute right-0 z-20 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                        <div className="border-b border-slate-100 px-4 py-2.5">
                            <p className="truncate text-sm font-bold text-slate-900">{user?.username || 'Usuario'}</p>
                            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                {role || 'rol'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                            <LogOut size={14} />
                            Cerrar sesión
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

/* ---- Main Layout ---- */
export const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const mobileSidebar = useDisclosure(false);
    const role   = useAuthStore((state) => state.role);
    const user   = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const pageTitle = useMemo(
        () => pathLabels[location.pathname] || 'Workspace',
        [location.pathname],
    );

    const handleLogout = () => {
        logout();
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
                <SidebarContent role={role} />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebar.isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={mobileSidebar.close}
                    />
                    <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl">
                        <div className="absolute right-3 top-3 z-10">
                            <Button variant="ghost" size="icon" onClick={mobileSidebar.close} aria-label="Cerrar">
                                <X size={18} />
                            </Button>
                        </div>
                        <SidebarContent role={role} onNavigate={mobileSidebar.close} />
                    </aside>
                </div>
            )}

            {/* Main area */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 lg:hidden"
                            aria-label="Abrir menú"
                            onClick={mobileSidebar.open}
                        >
                            <Menu size={20} />
                        </Button>
                        <div className="min-w-0">
                            <Breadcrumbs pathname={location.pathname} />
                            <h1 className="truncate text-[15px] font-bold text-slate-900">{pageTitle}</h1>
                        </div>
                    </div>

                    <UserMenu user={user} role={role} onLogout={handleLogout} />
                </header>

                {/* Page Content */}
                <main className="mx-auto max-w-[1600px]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
