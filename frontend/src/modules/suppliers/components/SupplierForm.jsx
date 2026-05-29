import React from 'react';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

/**
 * Campos reutilizables del formulario de proveedor.
 * Usado tanto en creación como en edición.
 *
 * Props:
 *  - form: { ruc, company_name, phone, email }
 *  - onChange(key, value)
 *  - isEdit?: boolean  — si true, el RUC es solo lectura
 */
export const SupplierForm = ({ form, onChange, isEdit = false }) => (
    <div className="space-y-3">
        <div className="space-y-1">
            <Label>RUC {!isEdit && <span className="text-red-500">*</span>}</Label>
            <Input
                value={form.ruc}
                readOnly={isEdit}
                className={isEdit ? 'bg-slate-50 font-mono cursor-not-allowed' : 'font-mono'}
                maxLength={11}
                inputMode="numeric"
                placeholder="11 dígitos (ej: 20123456789)"
                onChange={(e) => onChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                required={!isEdit}
            />
        </div>

        <div className="space-y-1">
            <Label>Razón social <span className="text-red-500">*</span></Label>
            <Input
                value={form.company_name}
                placeholder="Nombre o razón social del proveedor"
                onChange={(e) => onChange('company_name', e.target.value)}
                required
            />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
                <Label>Teléfono <span className="text-slate-400 font-normal normal-case">(opcional)</span></Label>
                <Input
                    value={form.phone}
                    placeholder="ej: 987654321"
                    onChange={(e) => onChange('phone', e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <Label>Email <span className="text-slate-400 font-normal normal-case">(opcional)</span></Label>
                <Input
                    type="email"
                    value={form.email}
                    placeholder="contacto@proveedor.com"
                    onChange={(e) => onChange('email', e.target.value)}
                />
            </div>
        </div>
    </div>
);
