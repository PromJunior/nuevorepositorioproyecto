import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/authStore';

export const RoleRoute = ({ allowedRoles }) => {
    const hasRole = useAuthStore((state) => state.hasRole);

    if (!hasRole(allowedRoles)) {
        return <Navigate to={ROUTES.unauthorized} replace />;
    }

    return <Outlet />;
};
