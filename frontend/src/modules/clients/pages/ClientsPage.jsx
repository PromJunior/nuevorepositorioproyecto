import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Plus, Trophy } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { Button } from '../../../shared/components/ui/button';
import { ExportButtons } from '../../../shared/components/ExportButtons';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { ROUTES } from '../../../constants/routes';
import { ClientForm } from '../components/ClientForm';
import { ClientSearchBar } from '../components/ClientSearchBar';
import { ClientStatsCards } from '../components/ClientStatsCards';
import { ClientTable } from '../components/ClientTable';
import { ClientCrmTable } from '../components/ClientCrmTable';
import { useClients, useClientsSummary, useCreateClient, useCrmClients, useCrmRanking, useDeactivateClient, useUpdateClient } from '../hooks/useClients';
import { emptyClientForm, toClientPayload, validateClientForm } from '../schemas/clientSchema';

const MySwal = withReactContent(Swal);
const PAGE_SIZE = 20;

const CLIENT_COLUMNS = [
    { key: 'dni', label: 'DNI' },
    { key: 'full_name', label: 'Cliente' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefono' },
    { key: 'is_active', label: 'Estado', value: (client) => client.is_active ? 'Activo' : 'Inactivo' },
];

const CRM_COLUMNS = [
    { key: 'full_name', label: 'Cliente' },
    { key: 'dni', label: 'DNI' },
    { key: 'segment', label: 'Segmento' },
    { key: 'recency_days', label: 'Recency' },
    { key: 'frequency', label: 'Frecuencia' },
    { key: 'monetary', label: 'Monetary' },
    { key: 'last_purchase', label: 'Ultima compra' },
];

const toForm = (client) => ({
    dni: client?.dni || '',
    full_name: client?.full_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
});

const ClientsPage = () => {
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.role);
    const canManage = role === 'admin';
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('active');
    const [segment, setSegment] = useState('');
    const [page, setPage] = useState(1);
    const [modalMode, setModalMode] = useState(null);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyClientForm);

    const includeInactive = status !== 'active';
    const { data: clients = [], isLoading, isError } = useClients({ limit: 500, include_inactive: includeInactive });
    const { data: crmSummary } = useClientsSummary();
    const { data: crmClients = [] } = useCrmClients({ segment: segment || undefined, limit: 500 });
    const { data: ranking = [] } = useCrmRanking({ metric: 'amount', limit: 10 });
    const createMutation = useCreateClient();
    const updateMutation = useUpdateClient();
    const deactivateMutation = useDeactivateClient();

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return clients.filter((client) => {
            const matchesStatus =
                status === 'all' ||
                (status === 'active' && client.is_active) ||
                (status === 'inactive' && !client.is_active);
            const haystack = `${client.dni} ${client.full_name} ${client.email} ${client.phone || ''}`.toLowerCase();
            return matchesStatus && (!q || haystack.includes(q));
        });
    }, [clients, query, status]);

    const summary = useMemo(() => ({
        total: crmSummary?.registered_clients ?? clients.length,
        active: crmSummary?.active_clients ?? clients.filter((client) => client.is_active).length,
        frequent: crmSummary?.frequent_clients ?? 0,
        newThisMonth: crmSummary?.new_clients_this_month ?? 0,
        vip: crmSummary?.vip_clients ?? 0,
        inactive: crmSummary?.inactive_clients ?? 0,
        newClients: crmSummary?.new_clients ?? 0,
    }), [clients, crmSummary]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const isBusy = createMutation.isPending || updateMutation.isPending;

    const handleFormChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const closeModal = () => {
        setModalMode(null);
        setEditId(null);
        setForm(emptyClientForm);
    };

    const openCreate = () => {
        setForm(emptyClientForm);
        setModalMode('create');
    };

    const openEdit = (client) => {
        setEditId(client.id);
        setForm(toForm(client));
        setModalMode('edit');
    };

    const submitForm = async (event) => {
        event.preventDefault();
        const isEdit = modalMode === 'edit';
        const validationError = validateClientForm(form, isEdit);
        if (validationError) {
            MySwal.fire({ icon: 'warning', title: 'Datos incompletos', text: validationError });
            return;
        }

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: editId, data: toClientPayload(form, true) });
                MySwal.fire({ icon: 'success', title: 'Cliente actualizado', timer: 1400, showConfirmButton: false });
            } else {
                await createMutation.mutateAsync(toClientPayload(form));
                MySwal.fire({ icon: 'success', title: 'Cliente registrado', timer: 1400, showConfirmButton: false });
            }
            closeModal();
        } catch (error) {
            MySwal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.detail || error.message });
        }
    };

    const handleDeactivate = async (client) => {
        const result = await MySwal.fire({
            icon: 'warning',
            title: 'Desactivar cliente',
            text: `El cliente ${client.full_name} quedara inactivo.`,
            showCancelButton: true,
            confirmButtonText: 'Desactivar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        try {
            await deactivateMutation.mutateAsync(client.id);
            MySwal.fire({ icon: 'success', title: 'Cliente desactivado', timer: 1400, showConfirmButton: false });
        } catch (error) {
            MySwal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.detail || error.message });
        }
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="CRM"
                title="Clientes"
                description="Gestion y consulta comercial de clientes registrados."
                actions={
                    <Button onClick={openCreate}>
                        <Plus size={15} /> Nuevo cliente
                    </Button>
                }
            />

            <ClientStatsCards summary={summary} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Segmentacion comercial</span>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={segment}
                                onChange={(event) => setSegment(event.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="">Todos los segmentos</option>
                                <option value="VIP">VIP</option>
                                <option value="Frecuente">Frecuente</option>
                                <option value="Ocasional">Ocasional</option>
                                <option value="Inactivo">Inactivo</option>
                                <option value="Nuevo">Nuevo</option>
                            </select>
                            <ExportButtons
                                data={crmClients}
                                columns={CRM_COLUMNS}
                                filters={{ segment }}
                                filename="crm"
                                module="crm"
                                title="CRM Clientes"
                                disabled={crmClients.length === 0}
                            />
                        </div>
                    </div>
                    <ClientCrmTable clients={crmClients} onView={(client) => navigate(`${ROUTES.clients}/${client.id}`)} />
                </div>
                <div className="rounded-lg bg-white p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-600" />
                        <h2 className="text-sm font-black text-slate-900">Top compradores</h2>
                    </div>
                    <div className="space-y-3">
                        {ranking.map((client, index) => (
                            <div key={client.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                                <div>
                                    <p className="text-xs font-black text-slate-400">#{index + 1}</p>
                                    <p className="font-bold text-slate-800">{client.full_name}</p>
                                    <p className="text-xs text-slate-400">{client.segment}</p>
                                </div>
                                <p className="font-mono text-sm font-black text-slate-900">S/ {Number(client.monetary || 0).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <ClientSearchBar
                query={query}
                status={status}
                onQueryChange={(value) => { setQuery(value); setPage(1); }}
                onStatusChange={(value) => { setStatus(value); setPage(1); }}
            />

            <DataState
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && filtered.length === 0}
                loadingLabel="Cargando clientes..."
                emptyTitle="Sin clientes"
                emptyDescription="Registra el primer cliente desde el boton superior."
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                            <ExportButtons
                                data={filtered}
                                columns={CLIENT_COLUMNS}
                                filters={{ query, status }}
                                filename="clients_delta"
                                module="clients"
                                title="Clientes"
                                disabled={filtered.length === 0}
                            />
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    </div>
                    <ClientTable
                        clients={paginated}
                        canManage={canManage}
                        onView={(client) => navigate(`${ROUTES.clients}/${client.id}`)}
                        onEdit={openEdit}
                        onDeactivate={handleDeactivate}
                    />
                </div>
            </DataState>

            <Modal
                isOpen={modalMode === 'create' || modalMode === 'edit'}
                onClose={closeModal}
                title={modalMode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal} disabled={isBusy}>Cancelar</Button>
                        <Button type="submit" form="client-form" disabled={isBusy}>
                            {isBusy ? 'Guardando...' : 'Guardar cliente'}
                        </Button>
                    </>
                }
            >
                <form id="client-form" onSubmit={submitForm}>
                    <ClientForm form={form} onChange={handleFormChange} isEdit={modalMode === 'edit'} />
                </form>
            </Modal>
        </div>
    );
};

export default ClientsPage;
