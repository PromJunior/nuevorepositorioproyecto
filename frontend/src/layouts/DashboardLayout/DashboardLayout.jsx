import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Sparkles, Wallet } from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { APP_ROLES, ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
    { to: ROUTES.app, label: 'Dashboard', icon: LayoutDashboard, roles: [APP_ROLES.admin] },
    { to: ROUTES.inventory, label: 'Inventario', icon: Package, roles: [APP_ROLES.admin, APP_ROLES.seller] },
    { to: ROUTES.sales, label: 'Ventas', icon: ShoppingCart, roles: [APP_ROLES.admin, APP_ROLES.seller] },
    { to: ROUTES.orders, label: 'Ordenes', icon: ClipboardList, roles: [APP_ROLES.admin, APP_ROLES.seller] },
    { to: ROUTES.cashClosing, label: 'Cierre de caja', icon: Wallet, roles: [APP_ROLES.admin, APP_ROLES.seller] },
];

export const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.role);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

    const handleLogout = () => {
        logout();
        navigate(ROUTES.login, { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
                <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Sparkles size={17} />
                    </div>
                    <div>
                        <span className="block text-sm font-black tracking-tight">ERP SaaS</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{role || 'usuario'}</span>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-5">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition',
                                    isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                                )}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut size={18} />
                        Cerrar sesion
                    </Button>
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="px-2 lg:hidden" aria-label="Abrir menu">
                            <Menu size={20} />
                        </Button>
                        <div>
                            <span className="block text-sm font-black text-slate-900">Workspace empresarial</span>
                            <span className="block text-xs font-medium text-slate-400">Sesion protegida por JWT</span>
                        </div>
                    </div>

                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                        {user?.username || 'Usuario'}
                    </div>
                </header>

                <main className="mx-auto max-w-[1600px] p-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
