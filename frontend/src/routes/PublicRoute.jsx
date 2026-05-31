import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/authStore';

export const PublicRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hydrateFromToken = useAuthStore((state) => state.hydrateFromToken);

    if (isAuthenticated() || hydrateFromToken()) {
        return <Navigate to={ROUTES.app} replace />;
    }

    return <Outlet />;
};
