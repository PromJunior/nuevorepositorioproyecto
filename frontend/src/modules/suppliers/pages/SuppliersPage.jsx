import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit2, Plus, Search } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
import { formatDateTime } from '../../../shared/utils/formatters';

const MySwal = withReactContent(Swal);
const PAGE_SIZE = 20;

const EMPTY_FORM = { ruc: '', company_name: '', phone: '', email: '' };

const SupplierFormFields = ({ form, onChange, isEdit }) => (
    <div className="space-y-3">
        <div className="space-y-1">
            <Label>RUC {!isEdit && '*'}</Label>
            <Input
                value={form.ruc}
                readOnly={isEdit}
                className={isEdit ? 'bg-slate-50 font-mono' : 'font-mono'}
                maxLength={11}
                inputMode="numeric"
                placeholder="11 dígitos"
                onChange={(e) => onChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                required={!isEdit}
            />
        </div>
        <div className="space-y-1">
            <Label>Razón social *</Label>
            <Input
                value={form.company_name}
                onChange={(e) => onChange('company_name', e.target.value)}
                required
                placeholder="Nombre o razón social"
            />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="Opcional" />
            </div>
        </div>
    </div>
);

const SuppliersPage = () => {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);

    const { data: suppliers = [], isLoading, isError } = useSuppliers();
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return suppliers.filter((s) =>
            s.company_name.toLowerCase().includes(q) || s.ruc.includes(q)
        );
    }, [suppliers, query]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleFormChange = (key, val) => setForm((p) => ({ ...p, [key]: val }));

    const openCreate = () => { setForm(EMPTY_FORM); setModalMode('create'); };
    const openEdit = (s) => {
        setEditId(s.id);
        setForm({ ruc: s.ruc, company_name: s.company_name, phone: s.phone || '', email: s.email || '' });
        setModalMode('edit');
    };
    const closeModal = () => { setModalMode(null); setEditId(null); setForm(EMPTY_FORM); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createMutation.mutateAsync({ ruc: form.ruc, company_name: form.company_name, phone: form.phone || undefined, email: form.email || undefined });
                MySwal.fire({ icon: 'success', title: 'Proveedor registrado', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            } else {
                await updateMutation.mutateAsync({ id: editId, data: { company_name: form.company_name, phone: form.phone || undefined, email: form.email || undefined } });
                MySwal.fire({ icon: 'success', title: 'Proveedor actualizado', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            }
            closeModal();
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || err.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    const isBusy = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Proveedores"
                title="Gestión de proveedores"
                description="Registro y administración de proveedores del negocio."
                actions={
                    <Button onClick={openCreate}>
                        <Plus size={15} /> Nuevo proveedor
                    </Button>
                }
            />

            {/* Buscador */}
            <Card className="p-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                    <Input
                        className="pl-9"
                        placeholder="Buscar por razón social o RUC..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    />
                </div>
            </Card>

            {/* Tabla */}
            <DataState
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && filtered.length === 0}
                loadingLabel="Cargando proveedores..."
                emptyTitle="Sin proveedores"
                emptyDescription="Agrega el primer proveedor usando el botón de arriba."
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                            {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>

                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <th className="p-3 pl-5">RUC</th>
                                        <th className="p-3">Razón social</th>
                                        <th className="p-3">Teléfono</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Registrado</th>
                                        <th className="p-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {paginated.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/60">
                                            <td className="p-3 pl-5 font-mono text-xs font-bold text-slate-500">{s.ruc}</td>
                                            <td className="p-3 font-semibold text-slate-800">{s.company_name}</td>
                                            <td className="p-3 text-xs text-slate-500">{s.phone || '—'}</td>
                                            <td className="p-3 text-xs text-slate-500">{s.email || '—'}</td>
                                            <td className="p-3 text-xs text-slate-400">{formatDateTime(s.created_at)}</td>
                                            <td className="p-3 pr-5">
                                                <Button variant="ghost" className="px-2 py-1.5 text-xs" onClick={() => openEdit(s)}>
                                                    <Edit2 size={13} /> Editar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </DataState>

            {/* Modal create/edit */}
            <Modal
                isOpen={Boolean(modalMode)}
                onClose={closeModal}
                title={modalMode === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'}
                description={modalMode === 'create' ? 'Completa los datos del proveedor.' : 'Modifica los datos del proveedor.'}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal} disabled={isBusy}>Cancelar</Button>
                        <Button type="submit" form="supplier-form" disabled={isBusy}>
                            {isBusy ? 'Guardando...' : modalMode === 'create' ? 'Registrar' : 'Guardar cambios'}
                        </Button>
                    </>
                }
            >
                <form id="supplier-form" onSubmit={handleSubmit}>
                    <SupplierFormFields form={form} onChange={handleFormChange} isEdit={modalMode === 'edit'} />
                </form>
            </Modal>
        </div>
    );
};

export default SuppliersPage;
