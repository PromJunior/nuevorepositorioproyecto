import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService, rolesService } from '../services/usersService';

const USERS_KEY = ['users'];
const ROLES_KEY = ['roles'];

// ─── Usuarios ────────────────────────────────────────────────────────────────
export const useUsers = () =>
    useQuery({
        queryKey: USERS_KEY,
        queryFn: usersService.getUsers,
        staleTime: 1000 * 60,
    });

export const useCreateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersService.createUser,
        onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
    });
};

export const useUpdateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => usersService.updateUser(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
    });
};

export const useDeactivateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersService.deactivateUser,
        onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
    });
};

export const useActivateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersService.activateUser,
        onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
    });
};

// ─── Roles ───────────────────────────────────────────────────────────────────
export const useRoles = () =>
    useQuery({
        queryKey: ROLES_KEY,
        queryFn: rolesService.getRoles,
        staleTime: 1000 * 60 * 10,
    });

export const useCreateRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: rolesService.createRole,
        onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
    });
};
