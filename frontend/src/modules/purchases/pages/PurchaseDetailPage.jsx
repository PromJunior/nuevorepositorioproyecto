import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ArrowLeft, Archive, Building2, CheckCircle2, FileText, Loader2, User, XCircle } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { PurchaseStatusBadge } from '../components/PurchaseStatusBadge';
import { PurchaseItemsTable } from '../components/PurchaseItemsTable';
import { usePurchase, useReceivePurchase, useCancelPurchase } from '../hooks/usePurchases';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';

const MySwal = withReactContent(Swal);

const InfoRow = ({ icon, label, value }) => {
    const IconComp = icon;
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <IconComp size={13} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className="font-semibold text-slate-800">{value || '—'}</p>
            </div>
        </div>
    );
};

const PurchaseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const purchaseQuery = usePurchase(id);
    const receiveMutation = useReceivePurchase();
    const cancelMutation = useCancelPurchase();

    const purchase = purchaseQuery.data;
    const statusName = purchase?.status?.name_status;

    const handleReceive = async () => {
        const confirm = await MySwal.fire({
            icon: 'question',
            title: '¿Recibir compra?',
            html: `<p class="text-sm">Esta acción actualizará el stock y registrará entradas en el <b>Kardex</b>.</p><p class="mt-2 font-bold">${formatCurrency(purchase?.total_amount, 'PEN')}</p>`,
            showCancelButton: true,
            confirmButtonText: 'Sí, recibir',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' },
        });
        if (!confirm.isConfirmed) return;
        try {
            await receiveMutation.mutateAsync(id);
            MySwal.fire({ icon: 'success', title: 'Compra recibida', text: 'Stock e inventario actualizados.', timer: 2000, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || err.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    const handleCancel = async () => {
        const confirm = await MySwal.fire({
            icon: 'warning',
            title: '¿Cancelar compra?',
            text: 'Esta acción es irreversible. No se afectará el stock porque aún no fue recibida.',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonText: 'No',
            customClass: { popup: '!rounded-2xl' },
        });
        if (!confirm.isConfirmed) return;
        try {
            await cancelMutation.mutateAsync(id);
            MySwal.fire({ icon: 'success', title: 'Compra cancelada', timer: 1500, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || err.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    const isBusy = receiveMutation.isPending || cancelMutation.isPending;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Compras"
                title={purchase ? `Compra #${purchase.id}` : 'Detalle de compra'}
                description={purchase?.supplier?.company_name}
                actions={
                    <div className="flex items-center gap-2">
                        {purchase && <PurchaseStatusBadge status={statusName} />}
                        <Button variant="secondary" onClick={() => navigate('/compras')}>
                            <ArrowLeft size={14} /> Volver
                        </Button>
                    </div>
                }
            />

            <DataState
                isLoading={purchaseQuery.isLoading}
                isError={purchaseQuery.isError}
                loadingLabel="Cargando compra..."
                errorTitle="No se pudo cargar la compra"
            >
                {purchase && (
                    <>
                        {/* Info general */}
                        <Card className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoRow icon={Building2} label="Proveedor" value={purchase.supplier?.company_name} />
                            <InfoRow icon={FileText} label="N° Factura" value={purchase.invoice_number} />
                            <InfoRow icon={User} label="Registrado por" value={purchase.username} />
                            <InfoRow icon={Archive} label="Fecha" value={formatDateTime(purchase.purchase_date)} />
                        </Card>

                        {/* Tabla de ítems (solo lectura) */}
                        <PurchaseItemsTable items={purchase.items} readOnly />

                        {/* Acciones según estado */}
                        {statusName === 'BORRADOR' && (
                            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-semibold text-amber-600">
                                    Esta compra aún no ha afectado el inventario. Recíbela para actualizar stock.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="danger" onClick={handleCancel} disabled={isBusy}>
                                        {cancelMutation.isPending ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <XCircle size={14} />
                                        )}
                                        Cancelar compra
                                    </Button>
                                    <Button onClick={handleReceive} disabled={isBusy}>
                                        {receiveMutation.isPending ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={14} />
                                        )}
                                        Recibir compra
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {statusName === 'RECIBIDA' && (
                            <Card className="flex items-center gap-3 p-4">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span className="text-sm font-semibold text-emerald-700">
                                    Compra recibida. Stock e inventario actualizados correctamente.
                                </span>
                                <Button
                                    variant="secondary"
                                    className="ml-auto"
                                    onClick={() => navigate('/kardex')}
                                >
                                    <Archive size={14} /> Ver en Kardex
                                </Button>
                            </Card>
                        )}
                    </>
                )}
            </DataState>
        </div>
    );
};

export default PurchaseDetailPage;
