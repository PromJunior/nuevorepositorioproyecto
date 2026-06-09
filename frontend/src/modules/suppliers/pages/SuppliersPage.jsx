import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit2, Plus, Search, X } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable } from '../../../shared/components/DataTable';
import { FilterPanel } from '../../../shared/components/FilterPanel';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { ExportButtons } from '../../../shared/components/ExportButtons';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierDetail } from '../components/SupplierDetail';
import { formatDateTime } from '../../../shared/utils/formatters';

const MySwal = withReactContent(Swal);
const PAGE_SIZE = 20;
const EMPTY_FORM = { ruc: '', company_name: '', phone: '', email: '' };

const EXPORT_COLUMNS = [
    { key: 'ruc', label: 'RUC' },
    { key: 'company_name', label: 'Proveedor' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Email' },
];

const SuppliersPage = () => {
    /* ── State ───────────────────────────────────────────────────────────────── */
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit' | 'detail'
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [detailSupplier, setDetailSupplier] = useState(null);

    const debouncedQuery = useDebounce(searchInput, 300);

    /* ── Queries / mutations ─────────────────────────────────────────────────── */
    const { data: suppliers = [], isLoading, isError, refetch } = useSuppliers();
    const createMutation = useCreateSupplier();
    const updateMutation = useUpdateSupplier();

    /* ── Filtrado local ──────────────────────────────────────────────────────── */
    const filtered = useMemo(() => {
        const q = debouncedQuery.toLowerCase();
        if (!q) return suppliers;
        return suppliers.filter(
            (s) =>
                s.company_name.toLowerCase().includes(q) ||
                s.ruc.includes(q),
        );
    }, [suppliers, debouncedQuery]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    /* ── Helpers modales ─────────────────────────────────────────────────────── */
    const handleFormChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

    const openCreate = () => { setForm(EMPTY_FORM); setModalMode('create'); };
    const openEdit = (s) => {
        setEditId(s.id);
        setForm({ ruc: s.ruc, company_name: s.company_name, phone: s.phone || '', email: s.email || '' });
        setModalMode('edit');
    };
    const openDetail = (s) => { setDetailSupplier(s); setModalMode('detail'); };
    const closeModal = () => {
        setModalMode(null);
        setEditId(null);
        setForm(EMPTY_FORM);
        setDetailSupplier(null);
    };

    /* ── Submit ──────────────────────────────────────────────────────────────── */
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
                MySwal.fire({
                    icon: 'success', title: 'Proveedor registrado',
                    timer: 1500, showConfirmButton: false,
                    customClass: { popup: '!rounded-2xl' },
                });
            } else {
                await updateMutation.mutateAsync({
                    id: editId,
                    data: {
                        company_name: form.company_name,
                        phone: form.phone || undefined,
                        email: form.email || undefined,
                    },
                });
                MySwal.fire({
                    icon: 'success', title: 'Proveedor actualizado',
                    timer: 1500, showConfirmButton: false,
                    customClass: { popup: '!rounded-2xl' },
                });
            }
            closeModal();
        } catch (err) {
            MySwal.fire({
                icon: 'error', title: 'Error',
                text: err.response?.data?.detail || err.message,
                customClass: { popup: '!rounded-2xl' },
            });
        }
    };

    const isBusy = createMutation.isPending || updateMutation.isPending;
    const activeFilterCount = debouncedQuery ? 1 : 0;

    /* ── Columnas de DataTable ───────────────────────────────────────────────── */
    const tableColumns = [
        {
            key: 'ruc',
            label: 'RUC',
            width: 'w-36',
            render: (v) => (
                <span className="font-mono text-xs font-bold text-slate-500">{v}</span>
            ),
        },
        {
            key: 'company_name',
            label: 'Razón social',
            sortable: true,
            render: (v) => (
                <span className="font-semibold text-slate-800">{v}</span>
            ),
        },
        {
            key: 'phone',
            label: 'Teléfono',
            render: (v) => (
                <span className="text-xs text-slate-500">{v || '—'}</span>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (v) => (
                <span className="text-xs text-slate-500">{v || '—'}</span>
            ),
        },
        {
            key: 'created_at',
            label: 'Registrado',
            render: (v) => (
                <span className="text-xs text-slate-400">{formatDateTime(v)}</span>
            ),
        },
        {
            key: '_actions',
            label: '',
            align: 'right',
            cellClassName: 'pr-5',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-700"
                        onClick={() => openDetail(row)}
                    >
                        Ver
                    </Button>
                    <Button
                        variant="ghost"
                        className="px-2 py-1.5 text-xs"
                        onClick={() => openEdit(row)}
                    >
                        <Edit2 size={13} /> Editar
                    </Button>
                </div>
            ),
        },
    ];

    /* ── Render ──────────────────────────────────────────────────────────────── */
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

            {/* ── Filtros ───────────────────────────────────────────────────── */}
            <FilterPanel
                label="Búsqueda"
                activeCount={activeFilterCount}
                onClear={() => { setSearchInput(''); setPage(1); }}
                defaultOpen
            >
                <div className="relative max-w-sm">
                    <Search
                        className="pointer-events-none absolute left-3.5 top-2.5 text-slate-400"
                        size={14}
                    />
                    <Input
                        className="pl-9 pr-9"
                        placeholder="Buscar por razón social o RUC..."
                        value={searchInput}
                        onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                        aria-label="Buscar proveedor"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => { setSearchInput(''); setPage(1); }}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </FilterPanel>

            {/* ── Toolbar: conteo + exportar + paginación ───────────────────── */}
            {!isLoading && !isError && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400">
                        {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                        <ExportButtons
                            data={filtered}
                            columns={EXPORT_COLUMNS}
                            filters={{ query: debouncedQuery }}
                            filename="suppliers_snapshot"
                            module="suppliers"
                            title="Gestión de proveedores"
                            disabled={filtered.length === 0}
                        />
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={filtered.length}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            )}

            {/* ── Tabla de datos ────────────────────────────────────────────── */}
            <DataTable
                columns={tableColumns}
                data={paginated}
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && !isError && filtered.length === 0}
                onRetry={refetch}
                loadingRows={8}
                emptyTitle={debouncedQuery ? 'Sin resultados' : 'Sin proveedores'}
                emptyDescription={
                    debouncedQuery
                        ? `No se encontraron proveedores para "${debouncedQuery}". Prueba con otro término.`
                        : 'Agrega el primer proveedor usando el botón de arriba.'
                }
            />

            {/* ── Modal detalle ─────────────────────────────────────────────── */}
            <Modal
                isOpen={modalMode === 'detail'}
                onClose={closeModal}
                title="Detalle del proveedor"
            >
                <SupplierDetail supplier={detailSupplier} />
            </Modal>

            {/* ── Modal crear / editar ──────────────────────────────────────── */}
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
