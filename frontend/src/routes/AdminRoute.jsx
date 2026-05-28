import React from 'react';
import { APP_ROLES } from '../constants/routes';
import { RoleRoute } from './RoleRoute';

export const AdminRoute = () => {
    return <RoleRoute allowedRoles={[APP_ROLES.admin]} />;
};
