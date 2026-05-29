import React from 'react';
import { Edit2, PowerOff, Zap } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { UserStatusBadge } from './UserStatusBadge';
import { UserRoleBadge } from './UserRoleBadge';
import { formatDateTime } from '../../../shared/utils/formatters';

/**
 * Tabla de usuarios.
 *
 * Props:
 *  - users: UserResponse[]
 *  - currentUserId: id del usuario autenticado (protege auto-desactivación)
 *  - onEdit(user)
 *  - onToggleStatus(user)
 */
export const UserTable = ({ users = [], currentUserId, onEdit, onToggleStatus }) => (
    <Card className="overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="p-3 pl-5">Usuario</th>
                        <th className="p-3">Nombre completo</th>
                        <th className="p-3">Rol</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Creado</th>
                        <th className="p-3 pr-5 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-sm italic text-slate-400">
                                No hay usuarios que mostrar.
                            </td>
                        </tr>
                    ) : (
                        users.map((u) => {
                            const isSelf = u.id === currentUserId;
                            return (
                                <tr key={u.id} className="transition-colors hover:bg-slate-50/60">
                                    <td className="p-3 pl-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-mono text-xs font-bold text-slate-600">
                                                @{u.username}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800">
                                        {u.fullname}
                                        {isSelf && (
                                            <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                                Tú
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <UserRoleBadge role={u.role} />
                                    </td>
                                    <td className="p-3">
                                        <UserStatusBadge isActive={u.is_active} />
                                    </td>
                                    <td className="p-3 text-xs text-slate-400">
                                        {formatDateTime(u.create_at)}
                                    </td>
                                    <td className="p-3 pr-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                className="px-2 py-1.5 text-xs"
                                                onClick={() => onEdit(u)}
                                            >
                                                <Edit2 size={13} /> Editar
                                            </Button>
                                            {!isSelf && (
                                                <Button
                                                    variant="ghost"
                                                    className={`px-2 py-1.5 text-xs ${
                                                        u.is_active
                                                            ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
                                                            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                    }`}
                                                    onClick={() => onToggleStatus(u)}
                                                    title={u.is_active ? 'Desactivar' : 'Activar'}
                                                >
                                                    {u.is_active ? (
                                                        <><PowerOff size={13} /> Desactivar</>
                                                    ) : (
                                                        <><Zap size={13} /> Activar</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    </Card>
);
