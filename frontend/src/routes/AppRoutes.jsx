import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/dashboard';
import Inventory from '../pages/Inventory';
import Sales from '../pages/sales';
import Orders from '../modules/orders/pages/OrdersPage';
import CashClosing from '../modules/cash-session/page/CashSessionPage';
import { SaaSGrid } from '../components/SaaSGrid';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { RoleRoute } from './RoleRoute';
import { APP_ROLES, PROTECTED_ROLES, ROUTES } from '../constants/routes';

const UnauthorizedPage = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-black text-slate-900">Acceso no autorizado</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Tu usuario no tiene permisos para ver esta seccion.</p>
        </div>
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
                        <Route index element={<Dashboard />} />
                        <Route path="ventas" element={<Sales />} />
                        <Route path="detalle" element={<Orders />} />
                        <Route path="cierre" element={<CashClosing />} />
                        <Route path="features" element={<SaaSGrid />} />
                        <Route path="inventario" element={<Inventory />} />
                    </Route>
                </Route>

                <Route element={<RoleRoute allowedRoles={[APP_ROLES.admin]} />}>
                    <Route path="admin" element={<Navigate to={ROUTES.app} replace />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
    );
};
