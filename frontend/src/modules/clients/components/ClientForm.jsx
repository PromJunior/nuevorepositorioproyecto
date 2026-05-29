import React from 'react';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

export const ClientForm = ({ form, onChange, isEdit = false }) => (
    <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
                <Label>DNI</Label>
                <Input
                    value={form.dni}
                    maxLength={8}
                    inputMode="numeric"
                    disabled={isEdit}
                    onChange={(event) => onChange('dni', event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="12345678"
                />
            </div>
            <div className="space-y-1.5">
                <Label>Nombre completo</Label>
                <Input
                    value={form.full_name}
                    onChange={(event) => onChange('full_name', event.target.value)}
                    placeholder="Nombre del cliente"
                />
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => onChange('email', event.target.value)}
                    placeholder="cliente@empresa.com"
                />
            </div>
            <div className="space-y-1.5">
                <Label>Telefono</Label>
                <Input
                    value={form.phone}
                    onChange={(event) => onChange('phone', event.target.value)}
                    placeholder="999 999 999"
                />
            </div>
        </div>
        <div className="space-y-1.5">
            <Label>Direccion</Label>
            <Input
                value={form.address}
                onChange={(event) => onChange('address', event.target.value)}
                placeholder="Direccion fiscal o de entrega"
            />
        </div>
    </div>
);
