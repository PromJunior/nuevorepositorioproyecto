import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { formatDateTime } from '../../../shared/utils/formatters';

export const ClientNotesPanel = ({ notes = [], onCreate, isSaving = false }) => {
    const [note, setNote] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        const value = note.trim();
        if (!value) return;
        await onCreate({ note: value });
        setNote('');
    };

    return (
        <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Notas comerciales</h3>
            </div>
            <form onSubmit={submit} className="mb-4 flex gap-2">
                <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Registrar nota"
                />
                <Button type="submit" disabled={isSaving}>
                    <Plus size={14} /> Agregar
                </Button>
            </form>
            <div className="space-y-3">
                {notes.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-400">Sin notas registradas.</p>
                ) : notes.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-700">{item.note}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                            {item.username || 'Usuario'} · {formatDateTime(item.created_at)}
                        </p>
                    </div>
                ))}
            </div>
        </Card>
    );
};
