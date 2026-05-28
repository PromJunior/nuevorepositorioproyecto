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
    Truck,
    UserCog,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { APP_ROLES, ROUTE_PERMISSIONS, ROUTES } from '../../constants/routes';
import { useDisclosure } from '../../hooks/useDisclosure';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const NAV_SECTIONS = [
    {
        label: 'Operacion',
        items: [
            { to: ROUTES.app, label: 'Dashboard', icon: LayoutDashboard, roles: ROUTE_PERMISSIONS[ROUTES.app], end: true },
            { to: ROUTES.sales, label: 'Ventas', icon: ShoppingCart, roles: ROUTE_PERMISSIONS[ROUTES.sales] },
            { to: ROUTES.clients, label: 'Clientes', icon: Users, roles: ROUTE_PERMISSIONS[ROUTES.clients] },
            { to: ROUTES.cashClosing, label: 'Caja', icon: Wallet, roles: ROUTE_PERMISSIONS[ROUTES.cashClosing] },
        ],
    },
    {
        label: 'Inventario',
        items: [
            { to: ROUTES.inventory, label: 'Inventario', icon: Package, roles: ROUTE_PERMISSIONS[ROUTES.inventory] },
            { to: ROUTES.kardex, label: 'Kardex', icon: Archive, roles: ROUTE_PERMISSIONS[ROUTES.kardex] },
            { to: ROUTES.purchases, label: 'Compras', icon: ShoppingBag, roles: ROUTE_PERMISSIONS[ROUTES.purchases] },
            { to: ROUTES.suppliers, label: 'Proveedores', icon: Truck, roles: ROUTE_PERMISSIONS[ROUTES.suppliers] },
        ],
    },
    {
        label: 'Gestion',
        items: [
            { to: ROUTES.orders, label: 'Ordenes', icon: ClipboardList, roles: ROUTE_PERMISSIONS[ROUTES.orders] },
            { to: ROUTES.reports, label: 'Reportes', icon: BarChart3, roles: ROUTE_PERMISSIONS[ROUTES.reports] },
            { to: ROUTES.users, label: 'Usuarios', icon: UserCog, roles: ROUTE_PERMISSIONS[ROUTES.users] },
        ],
    },
];

const pathLabels = {
    [ROUTES.app]: 'Dashboard',
    [ROUTES.sales]: 'Ventas',
    [ROUTES.inventory]: 'Inventario',
    [ROUTES.purchases]: 'Compras',
    [ROUTES.clients]: 'Clientes',
    [ROUTES.suppliers]: 'Proveedores',
    [ROUTES.cashClosing]: 'Caja',
    [ROUTES.kardex]: 'Kardex',
    [ROUTES.reports]: 'Reportes',
    [ROUTES.users]: 'Usuarios',
    [ROUTES.orders]: 'Ordenes',
    [ROUTES.features]: 'Features',
};

const canSeeItem = (role, roles = []) => role === APP_ROLES.admin || roles.includes(role);

const SidebarContent = ({ role, onNavigate }) => (
    <div className="flex h-full flex-col bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
                <BriefcaseBusiness size={19} />
            </div>
            <div>
                <span className="block text-sm font-black tracking-tight text-slate-900">ERP SaaS</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{role || 'usuario'}</span>
            </div>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5">
            {NAV_SECTIONS.map((section) => {
                const visibleItems = section.items.filter((item) => canSeeItem(role, item.roles));
                if (visibleItems.length === 0) return null;

                return (
                    <section key={section.label} className="space-y-1.5">
                        <h2 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{section.label}</h2>
                        {visibleItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={onNavigate}
                                    className={({ isActive }) => cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
                                        isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                                    )}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </section>
                );
            })}
        </nav>
    </div>
);

const Breadcrumbs = ({ pathname }) => {
    const currentLabel = pathLabels[pathname] || 'ERP';

    return (
        <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
            <span>ERP</span>
            <span>/</span>
            <span className="text-slate-700">{currentLabel}</span>
        </nav>
    );
};

const UserMenu = ({ user, role, onLogout }) => {
    const menu = useDisclosure(false);

    return (
        <div className="relative">
            <Button variant="secondary" className="h-10 gap-3 rounded-full px-2.5 pr-3" onClick={menu.toggle}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    {(user?.username || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-32 truncate text-xs sm:inline">{user?.username || 'Usuario'}</span>
                <ChevronDown size={15} />
            </Button>

            {menu.isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2">
                        <p className="truncate text-sm font-black text-slate-900">{user?.username || 'Usuario'}</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{role || 'rol'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                        <LogOut size={16} />
                        Cerrar sesion
                    </button>
                </div>
            )}
        </div>
    );
};

export const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const mobileSidebar = useDisclosure(false);
    const role = useAuthStore((state) => state.role);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const pageTitle = useMemo(() => pathLabels[location.pathname] || 'Workspace empresarial', [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
                <SidebarContent role={role} />
            </aside>

            {mobileSidebar.isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button type="button" aria-label="Cerrar menu" className="absolute inset-0 bg-slate-950/40" onClick={mobileSidebar.close} />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl">
                        <div className="absolute right-3 top-3 z-10">
                            <Button variant="ghost" className="px-2" onClick={mobileSidebar.close}>
                                <X size={18} />
                            </Button>
                        </div>
                        <SidebarContent role={role} onNavigate={mobileSidebar.close} />
                    </aside>
                </div>
            )}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <Button variant="ghost" className="shrink-0 px-2 lg:hidden" aria-label="Abrir menu" onClick={mobileSidebar.open}>
                            <Menu size={20} />
                        </Button>
                        <div className="min-w-0">
                            <Breadcrumbs pathname={location.pathname} />
                            <h1 className="truncate text-sm font-black text-slate-900 sm:text-base">{pageTitle}</h1>
                        </div>
                    </div>

                    <UserMenu user={user} role={role} onLogout={handleLogout} />
                </header>

                <main className="mx-auto max-w-[1600px]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
