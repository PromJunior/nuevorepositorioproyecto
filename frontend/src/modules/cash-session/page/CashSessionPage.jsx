import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { AlertCircle, Clock, Loader2, User } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/ui/card';
import { Loader } from '../../../shared/components/Loader';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import {
    useActiveSession,
    useCloseSession,
    useOpenSession,
    useSessionHistory,
    useSessionSummary,
} from '../hooks/useCashSession';
import { OpenSessionForm } from '../components/OpenSessionForm';
import { CloseSessionForm } from '../components/CloseSessionForm';
import { SessionSummaryCards } from '../components/SessionSummaryCards';
import { SessionHistoryTable } from '../components/SessionHistoryTable';
import { SessionStatusBadge } from '../components/SessionStatusBadge';
import { PaymentMethodFilter } from '../../../shared/components/PaymentMethodFilter';
import { UserFilter } from '../../../shared/components/UserFilter';
import { useRuntimeSettings } from '../../settings/hooks/useSettings';

const MySwal = withReactContent(Swal);

const CashSessionPage = () => {
    const user = useAuthStore((s) => s.user);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [userId, setUserId] = useState('');

    // ─── Queries ────────────────────────────────────────────────────────────
    const activeSessionQuery = useActiveSession();
    const runtimeQuery = useRuntimeSettings();
    const activeSession = activeSessionQuery.data;
    const hasSession = Boolean(activeSession);

    const summaryQuery = useSessionSummary(hasSession, { payment_method_id: paymentMethodId });
    const historyQuery = useSessionHistory({ payment_method_id: paymentMethodId, user_id: userId });

    // ─── Mutations ──────────────────────────────────────────────────────────
    const openMutation = useOpenSession();
    const closeMutation = useCloseSession();

    // ─── Abrir caja ─────────────────────────────────────────────────────────
    const handleOpen = async (amount) => {
        try {
            await openMutation.mutateAsync(amount);
            MySwal.fire({
                icon: 'success',
                title: 'Caja abierta',
                text: `Fondo inicial: ${formatCurrency(amount, 'PEN')}`,
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: '!rounded-2xl' },
            });
        } catch (error) {
            MySwal.fire({
                icon: 'error',
                title: 'No se pudo abrir la caja',
                text: error.response?.data?.detail || error.message,
                customClass: { popup: '!rounded-2xl' },
            });
        }
    };

    // ─── Cerrar caja ────────────────────────────────────────────────────────
    const handleClose = async (closingAmount, observations) => {
        const expectedAmount = Number(summaryQuery.data?.expected_amount ?? activeSession?.opening_amount ?? 0);
        const diff = closingAmount - expectedAmount;

        const confirm = await MySwal.fire({
            icon: 'question',
            title: '¿Cerrar caja?',
            html: `
                <div class="text-sm space-y-1 text-left rounded-xl bg-slate-50 p-3">
                    <p><b>Efectivo esperado:</b> ${formatCurrency(expectedAmount, 'PEN')}</p>
                    <p><b>Efectivo contado:</b> ${formatCurrency(closingAmount, 'PEN')}</p>
                    <p><b>Diferencia:</b> <span class="font-bold ${diff === 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-indigo-600'}">${diff >= 0 ? '+' : ''}${formatCurrency(diff, 'PEN')}</span></p>
                    ${observations ? `<p class="text-slate-400 text-xs mt-2 italic">${observations}</p>` : ''}
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' },
        });

        if (!confirm.isConfirmed) return;

        try {
            await closeMutation.mutateAsync(closingAmount);
            MySwal.fire({
                icon: 'success',
                title: 'Caja cerrada',
                text: 'La sesión ha sido registrada exitosamente.',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: '!rounded-2xl' },
            });
        } catch (error) {
            MySwal.fire({
                icon: 'error',
                title: 'No se pudo cerrar la caja',
                text: error.response?.data?.detail || error.message,
                customClass: { popup: '!rounded-2xl' },
            });
        }
    };

    // ─── Estado de carga inicial ─────────────────────────────────────────────
    if (activeSessionQuery.isLoading) {
        return <Loader label="Verificando caja..." className="min-h-[60vh]" />;
    }

    if (activeSessionQuery.isError) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6">
                <Card className="flex max-w-sm flex-col items-center gap-3 p-8 text-center">
                    <AlertCircle size={32} className="text-rose-500" />
                    <p className="font-bold text-slate-700">Error al cargar la sesión de caja</p>
                    <p className="text-sm text-slate-400">
                        {activeSessionQuery.error?.response?.data?.detail ||
                            activeSessionQuery.error?.message}
                    </p>
                    <button
                        onClick={() => activeSessionQuery.refetch()}
                        className="mt-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Caja diaria"
                title="Gestión de caja"
                description="Abre, gestiona y cierra la sesión de caja de tu jornada."
                actions={
                    hasSession && (
                        <SessionStatusBadge status={activeSession.status} />
                    )
                }
            />

            <Card className="flex flex-col gap-3 p-4 sm:flex-row">
                <div className="w-full max-w-xs space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Metodo de pago
                    </p>
                    <PaymentMethodFilter value={paymentMethodId} onChange={setPaymentMethodId} />
                </div>
                <div className="w-full max-w-xs space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Usuario / Vendedor
                    </p>
                    <UserFilter value={userId} onChange={setUserId} />
                </div>
            </Card>

            {/* ─── Caja actual ─────────────────────────────────────────── */}
            {hasSession && (
                <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <User size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Sesión activa
                            </p>
                            <p className="font-black text-slate-900">
                                {user?.fullname || user?.username || `Usuario #${activeSession.user_id}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Fondo inicial
                            </p>
                            <p className="font-black text-slate-900">
                                {formatCurrency(activeSession.opening_amount, 'PEN')}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Apertura
                            </p>
                            <p className="flex items-center gap-1 font-bold text-slate-600">
                                <Clock size={12} />
                                {formatDateTime(activeSession.opening_time)}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* ─── Resumen del día ──────────────────────────────────────── */}
            {hasSession && summaryQuery.isLoading && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Loader2 size={13} className="animate-spin" /> Cargando resumen...
                </div>
            )}
            {hasSession && summaryQuery.data && (
                <SessionSummaryCards summary={summaryQuery.data} />
            )}

            {/* ─── Formulario apertura / cierre ────────────────────────── */}
            {!hasSession ? (
                <OpenSessionForm
                    key={runtimeQuery.data?.cash?.suggested_opening_amount || 'no-suggestion'}
                    onOpen={handleOpen}
                    isLoading={openMutation.isPending}
                    minimumAmount={Number(runtimeQuery.data?.cash?.minimum_opening_amount || 0)}
                    suggestedAmount={Number(runtimeQuery.data?.cash?.suggested_opening_amount || 0)}
                />
            ) : (
                <CloseSessionForm
                    expectedAmount={
                        summaryQuery.data?.expected_amount ??
                        activeSession.opening_amount ??
                        0
                    }
                    onClose={handleClose}
                    isLoading={closeMutation.isPending}
                />
            )}

            {/* ─── Historial ───────────────────────────────────────────── */}
            <div>
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Historial de sesiones
                </h2>
                {historyQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <Loader2 size={13} className="animate-spin" /> Cargando historial...
                    </div>
                ) : (
                    <SessionHistoryTable sessions={historyQuery.data || []} />
                )}
            </div>
        </div>
    );
};

export default CashSessionPage;
