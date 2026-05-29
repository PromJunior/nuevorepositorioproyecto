import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

/**
 * Modal de registro rápido de proveedor.
 * Props:
 *  - isOpen, onClose
 *  - initialData: { ruc, company_name, phone?, email? }
 *  - onSubmit(data) – async, debe devolver el proveedor creado
 *  - isLoading
 */
export const SupplierQuickCreateModal = ({ isOpen, onClose, initialData = {}, onSubmit, isLoading }) => {
    const [form, setForm] = useState({
        ruc: initialData.ruc || '',
        company_name: initialData.company_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
    });

    React.useEffect(() => {
        setForm({
            ruc: initialData.ruc || '',
            company_name: initialData.company_name || '',
            phone: initialData.phone || '',
            email: initialData.email || '',
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData.ruc, initialData.company_name]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ruc: form.ruc,
            company_name: form.company_name,
            phone: form.phone || undefined,
            email: form.email || undefined,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar proveedor"
            description="Completa los datos del proveedor antes de registrarlo."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button type="submit" form="supplier-quick-form" disabled={isLoading}>
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Registrar
                    </Button>
                </>
            }
        >
            <form id="supplier-quick-form" onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                    <Label>RUC</Label>
                    <Input value={form.ruc} readOnly className="bg-slate-50 font-mono" />
                </div>
                <div className="space-y-1">
                    <Label>Razón social *</Label>
                    <Input
                        value={form.company_name}
                        onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                        required
                        placeholder="Nombre o razón social"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label>Teléfono</Label>
                        <Input
                            value={form.phone}
                            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="Opcional"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="Opcional"
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};
