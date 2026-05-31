import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierDetail } from '../components/SupplierDetail';

const MySwal = withReactContent(Swal);
const PAGE_SIZE = 20;
const EMPTY_FORM = { ruc: '', company_name: '', phone: '', email: '' };

const SuppliersPage = () => {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit' | 'detail'
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [detailSupplier, setDetailSupplier] = useState(null);

    const { data: suppliers = [], isLoading, isError } = useSuppliers();
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return suppliers.filter(
            (s) => s.company_name.toLowerCase().includes(q) || s.ruc.includes(q)
        );
    }, [suppliers, query]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const handleFormChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

    const openCreate = () => { setForm(EMPTY_FORM); setModalMode('create'); };

    const openEdit = (s) => {
        setEditId(s.id);
        setForm({ ruc: s.ruc, company_name: s.company_name, phone: s.phone || '', email: s.email || '' });
        setModalMode('edit');
    };

    const openDetail = (s) => { setDetailSupplier(s); setModalMode('detail'); };

    const closeModal = () => { setModalMode(null); setEditId(null); setForm(EMPTY_FORM); setDetailSupplier(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createMutation.mutateAsync({
                    ruc: form.ruc,
                    company_name: form.company_name,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                });
                MySwal.fire({ icon: 'success', title: 'Proveedor registrado', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            } else {
                await updateMutation.mutateAsync({
                    id: editId,
                    data: { company_name: form.company_name, phone: form.phone || undefined, email: form.email || undefined },
                });
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

                    <SupplierTable
                        suppliers={paginated}
                        onEdit={openEdit}
                        onViewDetail={openDetail}
                    />
                </div>
            </DataState>

            {/* Modal detalle */}
            <Modal
                isOpen={modalMode === 'detail'}
                onClose={closeModal}
                title="Detalle del proveedor"
            >
                <SupplierDetail supplier={detailSupplier} />
            </Modal>

            {/* Modal crear / editar */}
            <Modal
                isOpen={modalMode === 'create' || modalMode === 'edit'}
                onClose={closeModal}
                title={modalMode === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'}
                description={
                    modalMode === 'create'
                        ? 'Completa los datos del proveedor.'
                        : 'Modifica los datos de contacto del proveedor.'
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal} disabled={isBusy}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="supplier-modal-form" disabled={isBusy}>
                            {isBusy
                                ? 'Guardando...'
                                : modalMode === 'create'
                                ? 'Registrar proveedor'
                                : 'Guardar cambios'}
                        </Button>
                    </>
                }
            >
                <form id="supplier-modal-form" onSubmit={handleSubmit}>
                    <SupplierForm
                        form={form}
                        onChange={handleFormChange}
                        isEdit={modalMode === 'edit'}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default SuppliersPage;
