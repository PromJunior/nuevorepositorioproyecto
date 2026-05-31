import React from 'react';
import { GripVertical } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Field, TextInput, Toggle } from './SettingsControls';

export const PaymentMethodsEditor = ({ methods = [], canEdit, onChange, onSave, isSaving }) => (
    <div className="space-y-3">
        {methods.map((method, index) => (
            <div key={method.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[auto_1fr_120px_120px_auto] md:items-end">
                <div className="hidden text-slate-300 md:block">
                    <GripVertical size={18} />
                </div>
                <Field label="Nombre">
                    <TextInput
                        readOnly={!canEdit}
                        value={method.name_payment_method}
                        onChange={(event) => onChange(index, { name_payment_method: event.target.value })}
                    />
                </Field>
                <Field label="Orden">
                    <TextInput
                        readOnly={!canEdit}
                        type="number"
                        min="0"
                        value={method.display_order ?? 0}
                        onChange={(event) => onChange(index, { display_order: Number(event.target.value) })}
                    />
                </Field>
                <div className="space-y-1.5">
                    <span className="block text-xs font-black uppercase tracking-wider text-slate-500">Activo</span>
                    <Toggle
                        checked={Boolean(method.is_active)}
                        disabled={!canEdit}
                        onChange={(value) => onChange(index, { is_active: value })}
                    />
                </div>
                <Button
                    variant="secondary"
                    disabled={!canEdit || isSaving}
                    onClick={() => onSave(method)}
                >
                    Guardar
                </Button>
            </div>
        ))}
    </div>
);
