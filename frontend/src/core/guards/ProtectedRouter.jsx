import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuthStore } from '../../store/authStore';

const ProtectedRouter = ({ allowedRoles }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hydrateFromToken = useAuthStore((state) => state.hydrateFromToken);
    const hasRole = useAuthStore((state) => state.hasRole);

    const canAccess = isAuthenticated() || hydrateFromToken();

    if (!canAccess) {
        return <Navigate to={ROUTES.login} replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        return <Navigate to={ROUTES.unauthorized} replace />;
    }

    return <Outlet />;
};

export default ProtectedRouter;
