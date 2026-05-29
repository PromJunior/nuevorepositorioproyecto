import React from 'react';
import { Building2, Calendar, Mail, Phone } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { formatDateTime } from '../../../shared/utils/formatters';

const DetailRow = ({ icon, label, value }) => {
    const IconComp = icon;
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <IconComp size={13} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

/**
 * Tarjeta de detalle de un proveedor.
 * Props:
 *  - supplier: { id, ruc, company_name, phone, email, created_at }
 */
export const SupplierDetail = ({ supplier }) => {
    if (!supplier) return null;

    return (
        <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Building2 size={20} className="text-blue-600" />
                </div>
                <div>
                    <p className="font-black text-slate-900">{supplier.company_name}</p>
                    <p className="font-mono text-xs text-slate-400">RUC: {supplier.ruc}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow icon={Phone} label="Teléfono" value={supplier.phone} />
                <DetailRow icon={Mail} label="Email" value={supplier.email} />
                <DetailRow icon={Calendar} label="Registrado" value={formatDateTime(supplier.created_at)} />
            </div>
        </Card>
    );
};
