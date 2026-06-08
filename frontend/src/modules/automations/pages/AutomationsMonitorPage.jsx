import React from 'react';
import Swal from 'sweetalert2';
import { RefreshCw, RotateCcw, Workflow } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../shared/components/Table';
import { ExportButtons } from '../../../shared/components/ExportButtons';
import { useAuthStore } from '../../../store/authStore';
import {
    useAutomationEvents,
    useExportTracking,
    useResetExportTracking,
    useRetryAutomationEvent,
} from '../hooks/useAutomations';

const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
};

const ResultBadge = ({ success }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
        {success ? 'OK' : 'ERROR'}
    </span>
);

const StatusBadge = ({ status }) => {
    const normalized = (status || 'PENDING').toUpperCase();
    const styles = {
        OK: 'bg-emerald-50 text-emerald-700',
        SUCCESS: 'bg-emerald-50 text-emerald-700',
        EMPTY: 'bg-amber-50 text-amber-700',
        SKIPPED: 'bg-amber-50 text-amber-700',
        RESET: 'bg-blue-50 text-blue-700',
        ERROR: 'bg-rose-50 text-rose-700',
        FAILED: 'bg-rose-50 text-rose-700',
        PENDING: 'bg-slate-100 text-slate-600',
    };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles[normalized] || styles.PENDING}`}>
            {normalized}
        </span>
    );
};

const AUTOMATION_COLUMNS = [
    { key: 'timestamp', label: 'Fecha', value: (event) => formatDate(event.timestamp) },
    { key: 'event', label: 'Evento' },
    { key: 'success', label: 'Resultado', value: (event) => event.success ? 'OK' : 'ERROR' },
    { key: 'duration_ms', label: 'Duracion' },
    { key: 'status_code', label: 'HTTP' },
    { key: 'message', label: 'Detalle' },
];

const AutomationsMonitorPage = () => {
    const role = useAuthStore((state) => state.role);
    const canRetry = role === 'admin';
    const canReset = role === 'admin';
    const eventsQuery = useAutomationEvents();
    const retryEvent = useRetryAutomationEvent();
    const trackingQuery = useExportTracking();
    const resetTracking = useResetExportTracking();
    const events = eventsQuery.data || [];
    const trackingItems = trackingQuery.data || [];

    const handleRetry = async (eventId) => {
        try {
            await retryEvent.mutateAsync(eventId);
            Swal.fire({ icon: 'success', title: 'Evento reenviado', timer: 1300, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo reenviar', text: error.response?.data?.detail || error.message });
        }
    };

    const handleResetTracking = async (module) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: `Reiniciar ${module}`,
            text: 'La proxima exportacion incremental volvera a enviar el modulo desde cero.',
            showCancelButton: true,
            confirmButtonText: 'Reiniciar',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        try {
            await resetTracking.mutateAsync(module);
            Swal.fire({ icon: 'success', title: 'Tracking reiniciado', timer: 1300, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo reiniciar', text: error.response?.data?.detail || error.message });
        }
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="n8n"
                title="Automations Monitor"
                description="Ultimos eventos enviados por el ERP."
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <ExportButtons
                            data={events}
                            columns={AUTOMATION_COLUMNS}
                            filename="automation_logs"
                            module="automations"
                            title="Automations Monitor"
                            disabled={events.length === 0}
                        />
                        <Button variant="secondary" onClick={() => eventsQuery.refetch()} disabled={eventsQuery.isFetching}>
                            <RefreshCw size={15} className={eventsQuery.isFetching ? 'animate-spin' : ''} />
                            Actualizar
                        </Button>
                    </div>
                )}
            />

            <DataState
                isLoading={eventsQuery.isLoading}
                isError={eventsQuery.isError}
                isEmpty={!eventsQuery.isLoading && events.length === 0}
                loadingLabel="Cargando eventos..."
                errorTitle="No se pudieron cargar eventos"
                errorDescription={eventsQuery.error?.response?.data?.detail || eventsQuery.error?.message}
                emptyTitle="Sin eventos enviados"
                emptyDescription="Cuando el ERP emita eventos reales apareceran aqui."
            >
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell as="th">Fecha</TableCell>
                            <TableCell as="th">Evento</TableCell>
                            <TableCell as="th">Resultado</TableCell>
                            <TableCell as="th">Duracion</TableCell>
                            <TableCell as="th">HTTP</TableCell>
                            <TableCell as="th">Detalle</TableCell>
                            {canRetry && <TableCell as="th" className="text-right">Accion</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-semibold text-slate-700">{formatDate(event.timestamp)}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center gap-2 font-black text-slate-900">
                                        <Workflow size={15} className="text-blue-600" />
                                        {event.event}
                                    </span>
                                </TableCell>
                                <TableCell><ResultBadge success={event.success} /></TableCell>
                                <TableCell className="font-semibold">{event.duration_ms ?? 0} ms</TableCell>
                                <TableCell className="font-semibold">{event.status_code || '-'}</TableCell>
                                <TableCell className="max-w-md truncate text-slate-500">{event.message || '-'}</TableCell>
                                {canRetry && (
                                    <TableCell className="text-right">
                                        <Button
                                            variant="secondary"
                                            className="gap-1.5 text-xs"
                                            onClick={() => handleRetry(event.id)}
                                            disabled={retryEvent.isPending}
                                            title="Reenviar evento"
                                        >
                                            <RotateCcw size={14} />
                                            Reintentar
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DataState>

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-black text-slate-900">Exportacion incremental</h2>
                        <p className="text-sm text-slate-500">Estado del backup CSV para Google Drive.</p>
                    </div>
                    <Button variant="secondary" onClick={() => trackingQuery.refetch()} disabled={trackingQuery.isFetching}>
                        <RefreshCw size={15} className={trackingQuery.isFetching ? 'animate-spin' : ''} />
                        Actualizar
                    </Button>
                </div>

                <DataState
                    isLoading={trackingQuery.isLoading}
                    isError={trackingQuery.isError}
                    isEmpty={!trackingQuery.isLoading && trackingItems.length === 0}
                    loadingLabel="Cargando tracking..."
                    errorTitle="No se pudo cargar el tracking"
                    errorDescription={trackingQuery.error?.response?.data?.detail || trackingQuery.error?.message}
                    emptyTitle="Sin modulos incrementales"
                    emptyDescription="Cuando se habilite el tracking aparecera aqui."
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell as="th">Modulo</TableCell>
                                <TableCell as="th">Ultimo ID</TableCell>
                                <TableCell as="th">Ultima fecha</TableCell>
                                <TableCell as="th">Ultimo archivo</TableCell>
                                <TableCell as="th">Filas</TableCell>
                                <TableCell as="th">Estado</TableCell>
                                {canReset && <TableCell as="th" className="text-right">Accion</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {trackingItems.map((item) => (
                                <TableRow key={item.module}>
                                    <TableCell className="font-black text-slate-900">{item.module}</TableCell>
                                    <TableCell className="font-semibold">{item.last_exported_id ?? 0}</TableCell>
                                    <TableCell className="font-semibold text-slate-700">{formatDate(item.last_exported_at)}</TableCell>
                                    <TableCell className="max-w-xs truncate text-slate-500">{item.last_filename || '-'}</TableCell>
                                    <TableCell className="font-semibold">{item.last_rows_count ?? 0}</TableCell>
                                    <TableCell><StatusBadge status={item.status} /></TableCell>
                                    {canReset && (
                                        <TableCell className="text-right">
                                            <Button
                                                variant="secondary"
                                                className="gap-1.5 text-xs"
                                                onClick={() => handleResetTracking(item.module)}
                                                disabled={resetTracking.isPending}
                                                title="Reiniciar tracking"
                                            >
                                                <RotateCcw size={14} />
                                                Reset
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DataState>
            </section>
        </div>
    );
};

export default AutomationsMonitorPage;
