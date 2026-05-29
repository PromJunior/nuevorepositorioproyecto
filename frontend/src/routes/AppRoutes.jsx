import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { EmptyState } from '../shared/components/EmptyState';
import { Loader } from '../shared/components/Loader';
import { ModulePlaceholder } from '../shared/components/ModulePlaceholder';
import { PROTECTED_ROLES, ROUTE_PERMISSIONS, ROUTES } from '../constants/routes';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { RoleRoute } from './RoleRoute';
import { AdminRoute } from './AdminRoute';

const Dashboard = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const Sales = lazy(() => import('../modules/sales/pages/SalesPage'));
const Inventory = lazy(() => import('../modules/inventory/pages/InventoryPage'));
const Orders = lazy(() => import('../modules/orders/pages/OrdersPage'));
const CashClosing = lazy(() => import('../modules/cash-session/page/CashSessionPage'));
const KardexPage = lazy(() => import('../modules/kardex/pages/KardexPage'));
const ProductKardexPage = lazy(() => import('../modules/kardex/pages/ProductKardexPage'));
const SaaSGridModule = lazy(() => import('../components/SaaSGrid').then((module) => ({ default: module.SaaSGrid })));

const LazyPage = ({ children }) => (
    <Suspense fallback={<Loader label="Cargando modulo..." className="min-h-[60vh]" />}>
        {children}
    </Suspense>
);

const UnauthorizedPage = () => (
    <div className="p-6">
        <EmptyState
            title="Acceso no autorizado"
            description="Tu usuario no tiene permisos para ver esta seccion del ERP."
        />
    </div>
);

export const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                    <Route path={ROUTES.login} element={<LoginPage />} />
                </Route>
            </Route>

            <Route element={<PrivateRoute />}>
                <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />

                <Route element={<RoleRoute allowedRoles={PROTECTED_ROLES} />}>
                    <Route element={<DashboardLayout />}>
                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.app]} />}>
                            <Route index element={<LazyPage><Dashboard /></LazyPage>} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.sales]} />}>
                            <Route path="ventas" element={<LazyPage><Sales /></LazyPage>} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.inventory]} />}>
                            <Route path="inventario" element={<LazyPage><Inventory /></LazyPage>} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.purchases]} />}>
                            <Route path="compras" element={<ModulePlaceholder title="Compras" description="Base de navegacion preparada para compras." />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.clients]} />}>
                            <Route path="clientes" element={<ModulePlaceholder title="Clientes" description="Base de navegacion preparada para clientes." />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.suppliers]} />}>
                            <Route path="proveedores" element={<ModulePlaceholder title="Proveedores" description="Base de navegacion preparada para proveedores." />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.cashClosing]} />}>
                            <Route path="cierre" element={<LazyPage><CashClosing /></LazyPage>} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.kardex]} />}>
                            <Route path="kardex" element={<LazyPage><KardexPage /></LazyPage>} />
                            <Route path="kardex/producto/:productId" element={<LazyPage><ProductKardexPage /></LazyPage>} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.reports]} />}>
                            <Route path="reportes" element={<ModulePlaceholder title="Reportes" description="Base de navegacion preparada para reporteria ERP." />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.users]} />}>
                            <Route path="usuarios" element={<ModulePlaceholder title="Usuarios" description="Base de navegacion preparada para administracion de usuarios." />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.orders]} />}>
                            <Route path="detalle" element={<LazyPage><Orders /></LazyPage>} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={ROUTE_PERMISSIONS[ROUTES.features]} />}>
                            <Route path="features" element={<LazyPage><SaaSGridModule /></LazyPage>} />
                        </Route>
                    </Route>
                </Route>

                <Route element={<AdminRoute />}>
                    <Route path="admin" element={<Navigate to={ROUTES.app} replace />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
    );
};
