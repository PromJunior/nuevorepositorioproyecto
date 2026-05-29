import React, { useState } from 'react';
import { Filter, RefreshCw, Search, User } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { SessionStatusBadge } from './SessionStatusBadge';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';

/**
 * Tabla de historial de sesiones con filtros locales.
 * `sessions` → array de CashSessionWithUserResponse
 */
export const SessionHistoryTable = ({ sessions = [] }) => {
    const [filterUser, setFilterUser] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    const filtered = sessions.filter((s) => {
        const name = (s.fullname || s.username || '').toLowerCase();
        const matchUser = name.includes(filterUser.toLowerCase());
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchDate = !filterDate || (s.opening_time || '').startsWith(filterDate);
        return matchUser && matchStatus && matchDate;
    });

    const handleClear = () => {
        setFilterUser('');
        setFilterStatus('all');
        setFilterDate('');
    };

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <Card className="p-5">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Filter size={14} className="text-slate-400" />
                        Filtros
                    </span>
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
                    >
                        <RefreshCw size={11} /> Limpiar
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Buscar cajero */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Cajero
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Estado
                        </label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        >
                            <option value="all">Todos</option>
                            <option value="OPEN">Abierta</option>
                            <option value="CLOSED">Cerrada</option>
                        </select>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Fecha apertura
                        </label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        />
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="p-4 pl-5">#</th>
                                <th className="p-4">Cajero</th>
                                <th className="p-4">Apertura</th>
                                <th className="p-4">Cierre</th>
                                <th className="p-4 text-right">Fondo inicial</th>
                                <th className="p-4 text-right">Efectivo esperado</th>
                                <th className="p-4 text-right">Contado</th>
                                <th className="p-4 text-right">Diferencia</th>
                                <th className="p-4 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-sm italic text-slate-400">
                                        No hay sesiones que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const diff = s.difference != null ? Number(s.difference) : null;
                                    return (
                                        <tr key={s.id} className="transition-colors hover:bg-slate-50/60">
                                            <td className="p-4 pl-5 font-mono text-xs font-bold text-slate-400">
                                                #{s.id}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                                                        <User size={13} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">
                                                            {s.fullname || s.username || `Usuario #${s.user_id}`}
                                                        </span>
                                                        {s.username && s.fullname && (
                                                            <span className="text-[11px] text-slate-400">@{s.username}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-slate-600">
                                                {formatDateTime(s.opening_time)}
                                            </td>
                                            <td className="p-4 text-xs text-slate-600">
                                                {s.closing_time ? formatDateTime(s.closing_time) : '—'}
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-500">
                                                {formatCurrency(s.opening_amount, 'PEN')}
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-500">
                                                {s.expected_amount != null
                                                    ? formatCurrency(s.expected_amount, 'PEN')
                                                    : '—'}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-900">
                                                {s.closing_amount != null
                                                    ? formatCurrency(s.closing_amount, 'PEN')
                                                    : '—'}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold">
                                                {diff == null ? (
                                                    <span className="text-slate-400">—</span>
                                                ) : (
                                                    <span
                                                        className={
                                                            diff === 0
                                                                ? 'text-emerald-600'
                                                                : diff > 0
                                                                ? 'text-indigo-600'
                                                                : 'text-rose-600'
                                                        }
                                                    >
                                                        {diff >= 0 ? '+' : ''}
                                                        {formatCurrency(diff, 'PEN')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <SessionStatusBadge status={s.status} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
