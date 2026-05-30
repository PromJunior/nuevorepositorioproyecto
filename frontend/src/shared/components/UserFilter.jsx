import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../../modules/users/services/usersService';
import { useAuthStore } from '../store/useAuthStore';

const useUserOptions = (enabled) =>
    useQuery({
        queryKey: ['user-filter-options'],
        queryFn: usersService.getUsers,
        enabled,
        staleTime: 1000 * 60 * 5,
    });

export const UserFilter = ({ value = '', onChange, className = '' }) => {
    const role = useAuthStore((state) => state.role);
    const isAdmin = role === 'admin';
    const { data: users = [], isLoading } = useUserOptions(isAdmin);

    if (!isAdmin) return null;

    return (
        <select
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 ${className}`}
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            disabled={isLoading}
        >
            <option value="">Todos</option>
            {users.map((user) => (
                <option key={user.id} value={user.id}>
                    {user.fullname || user.username}
                </option>
            ))}
        </select>
    );
};
