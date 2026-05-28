import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/authStore';

export const PrivateRoute = () => {
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hydrateFromToken = useAuthStore((state) => state.hydrateFromToken);

    const canAccess = isAuthenticated() || hydrateFromToken();

    if (!canAccess) {
        return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
    }

    return <Outlet />;
};
