import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { formatDateTime } from '../../../shared/utils/formatters';

const STATUS = ['PENDIENTE', 'CONTACTADO', 'CERRADO'];

export const ClientFollowUpPanel = ({ followUps = [], onCreate, onUpdate, isSaving = false }) => {
    const [form, setForm] = useState({ next_contact_at: '', status: 'PENDIENTE', comment: '' });

    const submit = async (event) => {
        event.preventDefault();
        if (!form.next_contact_at) return;
        await onCreate({
            ...form,
            next_contact_at: new Date(form.next_contact_at).toISOString(),
            comment: form.comment || null,
        });
        setForm({ next_contact_at: '', status: 'PENDIENTE', comment: '' });
    };

    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
                <CalendarPlus size={16} className="text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Seguimiento comercial</h3>
            </div>
            <form onSubmit={submit} className="mb-4 grid gap-2 md:grid-cols-[180px_150px_minmax(0,1fr)_auto]">
                <input
                    type="datetime-local"
                    value={form.next_contact_at}
                    onChange={(event) => setForm((prev) => ({ ...prev, next_contact_at: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                />
                <select
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                >
                    {STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <input
                    value={form.comment}
                    onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
                    className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Comentario"
                />
                <Button type="submit" disabled={isSaving}>Guardar</Button>
            </form>
            <div className="space-y-3">
                {followUps.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-400">Sin seguimientos registrados.</p>
                ) : followUps.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-800">{formatDateTime(item.next_contact_at)}</p>
                            <p className="text-xs font-semibold text-slate-500">{item.comment || 'Sin comentario'}</p>
                            <p className="text-xs font-bold text-slate-400">{item.username || 'Usuario'}</p>
                        </div>
                        <select
                            value={item.status}
                            onChange={(event) => onUpdate({ id: item.id, data: { status: event.target.value } })}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                        >
                            {STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        </Card>
    );
};
