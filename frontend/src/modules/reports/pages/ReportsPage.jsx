import React, { useCallback, useState } from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Pagination } from '../../../shared/components/Pagination';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { formatCurrency, formatDateTime, formatNumber } from '../../../shared/utils/formatters';
import { MovementTypeBadge } from '../../kardex/components/MovementTypeBadge';
import { PurchaseStatusBadge } from '../../purchases/components/PurchaseStatusBadge';
import { SessionStatusBadge } from '../../cash-session/components/SessionStatusBadge';
import { ReportFilters } from '../components/ReportFilters';
import { ExportButtons } from '../components/ExportButtons';
import { PaymentMethodFilter } from '../../../shared/components/PaymentMethodFilter';
import { UserFilter } from '../../../shared/components/UserFilter';
import { ClientSegmentBadge } from '../../clients/components/ClientSegmentBadge';
import {
    useSalesReport, usePurchasesReport,
    useKardexReport, useCashReport, useCrmReport, useAuditLogs,
} from '../hooks/useReports';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

const EMPTY_FILTERS = { date_from: '', date_to: '' };

const useTabFilters = () => {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const onChange = useCallback((k, v) => setFilters((p) => ({ ...p, [k]: v })), []);
    const onReset = useCallback(() => setFilters(EMPTY_FILTERS), []);
    return { filters, onChange, onReset };
};

const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
    >
        {children}
    </button>
);

const TableWrapper = ({ children }) => (
    <Card className="overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
        </div>
    </Card>
);

const TH = ({ children, right }) => (
    <th className={`p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 ${right ? 'text-right' : ''}`}>
        {children}
    </th>
);

const TD = ({ children, mono, right, dim }) => (
    <td className={`p-3 font-medium ${mono ? 'font-mono' : ''} ${right ? 'text-right' : ''} ${dim ? 'text-slate-400 text-xs' : 'text-slate-700'}`}>
        {children}
    </td>
);

// ─── TAB: VENTAS ──────────────────────────────────────────────────────────────
const SalesTab = () => {
    const { filters, onChange, onReset } = useTabFilters();
    const [page, setPage] = useState(1);
    const { data = [], isLoading, isError } = useSalesReport({
        ...filters,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
    });
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <ReportFilters
                    filters={filters}
                    onFilterChange={onChange}
                    onReset={onReset}
                    extraSlot={
                        <>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Usuario / Vendedor</label>
                                <UserFilter
                                    value={filters.user_id || ''}
                                    onChange={(value) => onChange('user_id', value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Metodo de pago</label>
                                <PaymentMethodFilter
                                    value={filters.payment_method_id || ''}
                                    onChange={(value) => onChange('payment_method_id', value)}
                                />
                            </div>
                        </>
                    }
                />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{data.length} registros</span>
                <div className="flex items-center gap-3">
                    <ExportButtons reportType="sales" filters={filters} disabled={data.length === 0} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
            <DataState isLoading={isLoading} isError={isError} isEmpty={!isLoading && data.length === 0}
                loadingLabel="Cargando ventas..." emptyTitle="Sin ventas" emptyDescription="Ajusta los filtros de fecha.">
                <TableWrapper>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70">
                        <TH>#</TH><TH>Fecha</TH><TH>Cliente</TH><TH>Vendedor</TH>
                        <TH>Ítems</TH><TH>Método</TH><TH right>Total</TH>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60">
                                <TD mono dim>#{r.id}</TD>
                                <TD dim>{formatDateTime(r.order_date)}</TD>
                                <TD>{r.client_name}</TD>
                                <TD dim>{r.seller_name}</TD>
                                <TD mono>{r.items_count}</TD>
                                <TD dim>{r.payment_method || '—'}</TD>
                                <TD mono right><span className="font-black text-slate-900">{formatCurrency(r.total_amount, 'PEN')}</span></TD>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </DataState>
        </div>
    );
};

// ─── TAB: COMPRAS ─────────────────────────────────────────────────────────────
const PurchasesTab = () => {
    const { filters, onChange, onReset } = useTabFilters();
    const [page, setPage] = useState(1);
    const { data = [], isLoading, isError } = usePurchasesReport({
        ...filters, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
    });
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page;

    return (
        <div className="space-y-4">
            <ReportFilters filters={filters} onFilterChange={onChange} onReset={onReset}
                extraSlot={
                    <div className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Estado</label>
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                            value={filters.status || ''}
                            onChange={(e) => onChange('status', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="BORRADOR">Borrador</option>
                            <option value="RECIBIDA">Recibida</option>
                            <option value="CANCELADA">Cancelada</option>
                        </select>
                    </div>
                }
            />
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{data.length} registros</span>
                <div className="flex items-center gap-3">
                    <ExportButtons reportType="purchases" filters={filters} disabled={data.length === 0} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
            <DataState isLoading={isLoading} isError={isError} isEmpty={!isLoading && data.length === 0}
                loadingLabel="Cargando compras..." emptyTitle="Sin compras">
                <TableWrapper>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70">
                        <TH>#</TH><TH>Fecha</TH><TH>Proveedor</TH><TH>Usuario</TH>
                        <TH>Factura</TH><TH>Estado</TH><TH right>Total</TH>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60">
                                <TD mono dim>#{r.id}</TD>
                                <TD dim>{formatDateTime(r.purchase_date)}</TD>
                                <TD>{r.supplier_name}</TD>
                                <TD dim>{r.user_name}</TD>
                                <TD mono dim>{r.invoice_number || '—'}</TD>
                                <TD><PurchaseStatusBadge status={r.status_name} /></TD>
                                <TD mono right><span className="font-black text-slate-900">{formatCurrency(r.total_amount, 'PEN')}</span></TD>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </DataState>
        </div>
    );
};

// ─── TAB: KARDEX ──────────────────────────────────────────────────────────────
const KardexTab = () => {
    const { filters, onChange, onReset } = useTabFilters();
    const [page, setPage] = useState(1);
    const { data = [], isLoading, isError } = useKardexReport({
        ...filters, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
    });
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page;

    return (
        <div className="space-y-4">
            <ReportFilters filters={filters} onFilterChange={onChange} onReset={onReset}
                extraSlot={
                    <div className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Tipo movimiento</label>
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                            value={filters.transaction_type || ''}
                            onChange={(e) => onChange('transaction_type', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="ENTRADA">Entrada</option>
                            <option value="SALIDA">Salida</option>
                            <option value="AJUSTE">Ajuste</option>
                        </select>
                    </div>
                }
            />
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{data.length} registros</span>
                <div className="flex items-center gap-3">
                    <ExportButtons reportType="kardex" filters={filters} disabled={data.length === 0} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
            <DataState isLoading={isLoading} isError={isError} isEmpty={!isLoading && data.length === 0}
                loadingLabel="Cargando Kardex..." emptyTitle="Sin movimientos">
                <TableWrapper>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70">
                        <TH>#</TH><TH>Fecha</TH><TH>Producto</TH><TH>Tipo</TH>
                        <TH>Concepto</TH><TH right>Cant.</TH><TH right>Saldo</TH><TH right>Valor</TH><TH>Usuario</TH>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60">
                                <TD mono dim>#{r.id}</TD>
                                <TD dim>{formatDateTime(r.created_at)}</TD>
                                <TD><span className="font-semibold text-slate-800">{r.product_name}</span>
                                    {r.category_name && <span className="block text-[11px] text-slate-400">{r.category_name}</span>}</TD>
                                <TD><MovementTypeBadge type={r.transaction_type} /></TD>
                                <TD dim>{r.concept}</TD>
                                <TD mono right>{formatNumber(r.quantity)}</TD>
                                <TD mono right>{formatNumber(r.balance_stock)}</TD>
                                <TD mono right><span className="font-bold">{formatCurrency(r.balance_value, 'PEN')}</span></TD>
                                <TD dim>{r.username}</TD>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </DataState>
        </div>
    );
};

// ─── TAB: CAJA ────────────────────────────────────────────────────────────────
const CashTab = () => {
    const { filters, onChange, onReset } = useTabFilters();
    const [page, setPage] = useState(1);
    const { data = [], isLoading, isError } = useCashReport({
        ...filters, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
    });
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page;

    return (
        <div className="space-y-4">
            <ReportFilters
                filters={filters}
                onFilterChange={onChange}
                onReset={onReset}
                extraSlot={
                    <>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Usuario / Vendedor</label>
                            <UserFilter
                                value={filters.user_id || ''}
                                onChange={(value) => onChange('user_id', value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Metodo de pago</label>
                            <PaymentMethodFilter
                                value={filters.payment_method_id || ''}
                                onChange={(value) => onChange('payment_method_id', value)}
                            />
                        </div>
                    </>
                }
            />
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{data.length} registros</span>
                <div className="flex items-center gap-3">
                    <ExportButtons reportType="cash" filters={filters} disabled={data.length === 0} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
            <DataState isLoading={isLoading} isError={isError} isEmpty={!isLoading && data.length === 0}
                loadingLabel="Cargando caja..." emptyTitle="Sin sesiones">
                <TableWrapper>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70">
                        <TH>#</TH><TH>Usuario</TH><TH>Apertura</TH><TH>Cierre</TH>
                        <TH right>Fondo inicial</TH><TH right>Esperado</TH><TH right>Contado</TH><TH right>Diferencia</TH><TH>Estado</TH>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((r) => {
                            const diff = r.difference != null ? Number(r.difference) : null;
                            return (
                                <tr key={r.id} className="hover:bg-slate-50/60">
                                    <TD mono dim>#{r.id}</TD>
                                    <TD>{r.username}</TD>
                                    <TD dim>{formatDateTime(r.opening_time)}</TD>
                                    <TD dim>{r.closing_time ? formatDateTime(r.closing_time) : '—'}</TD>
                                    <TD mono right>{formatCurrency(r.opening_amount, 'PEN')}</TD>
                                    <TD mono right>{r.expected_amount != null ? formatCurrency(r.expected_amount, 'PEN') : '—'}</TD>
                                    <TD mono right>{r.closing_amount != null ? formatCurrency(r.closing_amount, 'PEN') : '—'}</TD>
                                    <TD mono right>
                                        {diff == null ? '—' : <span className={diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-indigo-600' : 'text-rose-600'}>{diff >= 0 ? '+' : ''}{formatCurrency(diff, 'PEN')}</span>}
                                    </TD>
                                    <TD><SessionStatusBadge status={r.status} /></TD>
                                </tr>
                            );
                        })}
                    </tbody>
                </TableWrapper>
            </DataState>
        </div>
    );
};

// ─── TAB: AUDITORÍA (admin) ───────────────────────────────────────────────────
const AuditTab = () => {
    const { filters, onChange, onReset } = useTabFilters();
    const [page, setPage] = useState(1);
    const { data = [], isLoading, isError } = useAuditLogs({
        ...filters, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE,
    });
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page;

    const ACTION_COLOR = {
        LOGIN: 'text-blue-600 bg-blue-50',
        CREATE: 'text-emerald-700 bg-emerald-50',
        RECEIVE: 'text-indigo-700 bg-indigo-50',
        CLOSE: 'text-amber-700 bg-amber-50',
        CANCEL: 'text-rose-700 bg-rose-50',
        UPDATE: 'text-purple-700 bg-purple-50',
    };

    return (
        <div className="space-y-4">
            <ReportFilters
                filters={filters}
                onFilterChange={onChange}
                onReset={onReset}
                extraSlot={
                    <div className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Usuario</label>
                        <UserFilter
                            value={filters.user_id || ''}
                            onChange={(value) => onChange('user_id', value)}
                        />
                    </div>
                }
            />
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{data.length} registros</span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
            <DataState isLoading={isLoading} isError={isError} isEmpty={!isLoading && data.length === 0}
                loadingLabel="Cargando auditoría..." emptyTitle="Sin registros" emptyDescription="Aún no hay acciones auditadas.">
                <TableWrapper>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70">
                        <TH>#</TH><TH>Fecha</TH><TH>Usuario</TH><TH>Módulo</TH>
                        <TH>Acción</TH><TH>Entidad</TH><TH>ID</TH><TH>Descripción</TH>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60">
                                <TD mono dim>#{r.id}</TD>
                                <TD dim>{formatDateTime(r.created_at)}</TD>
                                <TD>{r.username || '—'}</TD>
                                <TD><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{r.module}</span></TD>
                                <TD>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ACTION_COLOR[r.action] || 'text-slate-600 bg-slate-100'}`}>
                                        {r.action}
                                    </span>
                                </TD>
                                <TD dim>{r.entity || '—'}</TD>
                                <TD mono dim>{r.entity_id || '—'}</TD>
                                <TD dim>{r.description || '—'}</TD>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </DataState>
        </div>
    );
};

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
const CrmTab = () => {
    const { filters, onChange, onReset } = useTabFilters();
    const [page, setPage] = useState(1);
    const { data = [], isLoading, isError } = useCrmReport({
        ...filters,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
    });
    const totalPages = data.length === PAGE_SIZE ? page + 1 : page;

    return (
        <div className="space-y-4">
            <ReportFilters
                filters={filters}
                onFilterChange={onChange}
                onReset={onReset}
                extraSlot={
                    <>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Segmento</label>
                            <select
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                                value={filters.segment || ''}
                                onChange={(e) => onChange('segment', e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="VIP">VIP</option>
                                <option value="Frecuente">Frecuente</option>
                                <option value="Ocasional">Ocasional</option>
                                <option value="Inactivo">Inactivo</option>
                                <option value="Nuevo">Nuevo</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Usuario / Vendedor</label>
                            <UserFilter value={filters.user_id || ''} onChange={(value) => onChange('user_id', value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Metodo de pago</label>
                            <PaymentMethodFilter value={filters.payment_method_id || ''} onChange={(value) => onChange('payment_method_id', value)} />
                        </div>
                    </>
                }
            />
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{data.length} registros</span>
                <div className="flex items-center gap-3">
                    <ExportButtons reportType="crm" filters={filters} disabled={data.length === 0} />
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>
            <DataState isLoading={isLoading} isError={isError} isEmpty={!isLoading && data.length === 0}
                loadingLabel="Cargando CRM..." emptyTitle="Sin clientes">
                <TableWrapper>
                    <thead><tr className="border-b border-slate-100 bg-slate-50/70">
                        <TH>Cliente</TH><TH>Segmento</TH><TH>Recency</TH><TH>Frecuencia</TH><TH right>Monetary</TH><TH>Ultima compra</TH>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60">
                                <TD><span className="font-black text-slate-900">{r.full_name}</span><span className="block text-xs text-slate-400">{r.dni}</span></TD>
                                <TD><ClientSegmentBadge segment={r.segment} /></TD>
                                <TD mono>{r.recency_days == null ? '—' : `${r.recency_days} d`}</TD>
                                <TD mono>{formatNumber(r.frequency)}</TD>
                                <TD mono right><span className="font-black text-slate-900">{formatCurrency(r.monetary, 'PEN')}</span></TD>
                                <TD dim>{formatDateTime(r.last_purchase)}</TD>
                            </tr>
                        ))}
                    </tbody>
                </TableWrapper>
            </DataState>
        </div>
    );
};

const TABS = [
    { id: 'sales',     label: 'Ventas',     Component: SalesTab },
    { id: 'purchases', label: 'Compras',    Component: PurchasesTab },
    { id: 'kardex',    label: 'Kardex',     Component: KardexTab },
    { id: 'cash',      label: 'Caja',       Component: CashTab },
    { id: 'crm',       label: 'CRM',        Component: CrmTab },
    { id: 'audit',     label: 'Auditoría',  Component: AuditTab, adminOnly: true },
];

const ReportsPage = () => {
    const role = useAuthStore((s) => s.role);
    const [activeTab, setActiveTab] = useState('sales');

    const visibleTabs = TABS.filter((t) => !t.adminOnly || role === 'admin');
    const current = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0];
    const { Component } = current;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Reportes"
                title="Reportes y exportaciones"
                description="Filtra, analiza y exporta datos del ERP a CSV, Excel o PDF."
            />

            {/* Tabs */}
            <Card className="flex flex-wrap gap-1 p-2">
                {visibleTabs.map((t) => (
                    <TabButton
                        key={t.id}
                        active={activeTab === t.id}
                        onClick={() => setActiveTab(t.id)}
                    >
                        {t.label}
                    </TabButton>
                ))}
            </Card>

            {/* Contenido del tab activo */}
            <Component />
        </div>
    );
};

export default ReportsPage;
