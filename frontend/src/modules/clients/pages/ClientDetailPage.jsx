import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone, User } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { ROUTES } from '../../../constants/routes';
import { formatDateTime } from '../../../shared/utils/formatters';
import { ClientPurchaseHistory } from '../components/ClientPurchaseHistory';
import { ClientStatsCards } from '../components/ClientStatsCards';
import { ClientNotesPanel } from '../components/ClientNotesPanel';
import { ClientFollowUpPanel } from '../components/ClientFollowUpPanel';
import {
    useClient,
    useClientFollowUps,
    useClientNotes,
    useClientPurchaseHistory,
    useClientStats,
    useCreateClientFollowUp,
    useCreateClientNote,
    useUpdateClientFollowUp,
} from '../hooks/useClients';
import { PaymentMethodFilter } from '../../../shared/components/PaymentMethodFilter';

const PAGE_SIZE = 10;

const InfoRow = ({ icon, label, value }) => {
    const IconComponent = icon;

    return (
        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                <IconComponent size={16} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-0.5 break-words text-sm font-bold text-slate-800">{value || '-'}</p>
            </div>
        </div>
    );
};

const ClientDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [page, setPage] = useState(1);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const historyParams = {
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        payment_method_id: paymentMethodId || undefined,
    };
    const clientQuery = useClient(id);
    const statsQuery = useClientStats(id);
    const historyQuery = useClientPurchaseHistory(id, historyParams);
    const notesQuery = useClientNotes(id);
    const followUpsQuery = useClientFollowUps(id);
    const createNote = useCreateClientNote(id);
    const createFollowUp = useCreateClientFollowUp(id);
    const updateFollowUp = useUpdateClientFollowUp(id);

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Clientes"
                title={clientQuery.data?.full_name || 'Detalle de cliente'}
                description="Historial comercial y datos de contacto del cliente."
                actions={
                    <Button variant="secondary" onClick={() => navigate(ROUTES.clients)}>
                        <ArrowLeft size={15} /> Volver
                    </Button>
                }
            />

            <DataState
                isLoading={clientQuery.isLoading}
                isError={clientQuery.isError}
                loadingLabel="Cargando cliente..."
                errorTitle="No se pudo cargar el cliente"
                errorDescription={clientQuery.error?.response?.data?.detail || clientQuery.error?.message}
            >
                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <Card className="p-5">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <User size={22} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-black text-slate-900">{clientQuery.data?.full_name}</h2>
                                <p className="font-mono text-sm font-bold text-slate-400">{clientQuery.data?.dni}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                            <InfoRow icon={Mail} label="Email" value={clientQuery.data?.email} />
                            <InfoRow icon={Phone} label="Telefono" value={clientQuery.data?.phone} />
                            <InfoRow icon={MapPin} label="Direccion" value={clientQuery.data?.address} />
                            <InfoRow icon={User} label="Registrado" value={formatDateTime(clientQuery.data?.create_at)} />
                        </div>
                        <Link to={ROUTES.sales}>
                            <Button className="mt-4 w-full">Usar en venta</Button>
                        </Link>
                    </Card>

                    <div className="space-y-6">
                        <DataState
                            isLoading={statsQuery.isLoading}
                            isError={statsQuery.isError}
                            loadingLabel="Cargando estadisticas..."
                        >
                            <ClientStatsCards stats={statsQuery.data} />
                        </DataState>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <ClientNotesPanel
                                notes={notesQuery.data || []}
                                onCreate={(data) => createNote.mutateAsync(data)}
                                isSaving={createNote.isPending}
                            />
                            <ClientFollowUpPanel
                                followUps={followUpsQuery.data || []}
                                onCreate={(data) => createFollowUp.mutateAsync(data)}
                                onUpdate={(payload) => updateFollowUp.mutateAsync(payload)}
                                isSaving={createFollowUp.isPending || updateFollowUp.isPending}
                            />
                        </div>

                        <Card className="p-5">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ventas realizadas</p>
                                <h3 className="text-sm font-black text-slate-900">Historial de compras</h3>
                                </div>
                                <div className="w-full max-w-xs space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metodo de pago</p>
                                    <PaymentMethodFilter
                                        value={paymentMethodId}
                                        onChange={(value) => {
                                            setPaymentMethodId(value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                            <ClientPurchaseHistory
                                history={historyQuery.data}
                                isLoading={historyQuery.isLoading}
                                isError={historyQuery.isError}
                                page={page}
                                pageSize={PAGE_SIZE}
                                onPageChange={setPage}
                            />
                        </Card>
                    </div>
                </div>
            </DataState>
        </div>
    );
};

export default ClientDetailPage;
