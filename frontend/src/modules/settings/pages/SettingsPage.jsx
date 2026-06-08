import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
    Building2,
    Calculator,
    CalendarClock,
    ChartNoAxesCombined,
    CreditCard,
    FileDown,
    Package,
    ReceiptText,
    Play,
    Save,
    ShoppingBag,
    ShoppingCart,
    Send,
    Wallet,
    Workflow,
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { useAuthStore } from '../../../store/authStore';
import {
    useSettings,
    useTestWebhook,
    useUpdateCompanySettings,
    useUpdateWebhookSettings,
    useUpdatePaymentMethodSettings,
    useUpdateSettings,
} from '../hooks/useSettings';
import { Field, FieldGrid, Section, SelectInput, TextInput, Toggle } from '../components/SettingsControls';
import { PaymentMethodsEditor } from '../components/PaymentMethodsEditor';
import { useBackupStatus, useRunDailyBackupNow } from '../../automations/hooks/useAutomations';

const TABS = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'fiscal', label: 'Fiscal', icon: Calculator },
    { id: 'series', label: 'Series', icon: ReceiptText },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras', icon: ShoppingBag },
    { id: 'cash', label: 'Caja', icon: Wallet },
    { id: 'dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
    { id: 'reports', label: 'Reportes', icon: FileDown },
    { id: 'automations', label: 'n8n', icon: Workflow },
];

const emptyCompany = {
    legal_name: '',
    trade_name: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    primary_currency: 'PEN',
    secondary_currency: '',
};

const emptyAutomations = {
    webhook_enabled: false,
    webhook_url: '',
    webhook_secret: '',
};

const toInputValue = (value) => value ?? '';
const cleanNullable = (value) => (value === '' ? null : value);

const formatDate = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value));
};

const BackupStatusBadge = ({ status }) => {
    const normalized = (status || 'PENDING').toUpperCase();
    const styles = {
        SUCCESS: 'bg-emerald-50 text-emerald-700',
        SKIPPED: 'bg-amber-50 text-amber-700',
        FAILED: 'bg-rose-50 text-rose-700',
        PENDING: 'bg-slate-100 text-slate-600',
    };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${styles[normalized] || styles.PENDING}`}>
            {normalized}
        </span>
    );
};

const normalizeCompany = (company = emptyCompany) => ({
    ...emptyCompany,
    ...company,
    website: toInputValue(company.website),
    logo_url: toInputValue(company.logo_url),
    secondary_currency: toInputValue(company.secondary_currency),
});

const normalizeCompanyPayload = (company) => ({
    ...company,
    trade_name: cleanNullable(company.trade_name),
    ruc: cleanNullable(company.ruc),
    address: cleanNullable(company.address),
    phone: cleanNullable(company.phone),
    email: cleanNullable(company.email),
    website: cleanNullable(company.website),
    logo_url: cleanNullable(company.logo_url),
    secondary_currency: cleanNullable(company.secondary_currency),
});

const parseList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (value = []) => value.join(', ');

const SaveBar = ({ canEdit, isSaving, onSave }) => (
    <div className="flex justify-end">
        <Button onClick={onSave} disabled={!canEdit || isSaving}>
            <Save size={15} /> Guardar cambios
        </Button>
    </div>
);

const TabButton = ({ active, tab, onClick }) => {
    const Icon = tab.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition ${
                active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <Icon size={15} />
            {tab.label}
        </button>
    );
};

const SettingsPage = () => {
    const role = useAuthStore((state) => state.role);
    const canEdit = role === 'admin';
    const [activeTab, setActiveTab] = useState('company');
    const [company, setCompany] = useState(emptyCompany);
    const [system, setSystem] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const settingsQuery = useSettings();
    const updateCompany = useUpdateCompanySettings();
    const updateSettings = useUpdateSettings();
    const updateWebhookSettings = useUpdateWebhookSettings();
    const testWebhook = useTestWebhook();
    const updatePaymentMethod = useUpdatePaymentMethodSettings();
    const backupStatusQuery = useBackupStatus();
    const runBackupNow = useRunDailyBackupNow();

    useEffect(() => {
        if (!settingsQuery.data) return;
        const { company: companyData, payment_methods: methods, ...systemData } = settingsQuery.data;
        queueMicrotask(() => {
            setCompany(normalizeCompany(companyData));
            setSystem({
                ...systemData,
                automations: {
                    ...emptyAutomations,
                    ...(systemData.automations || {}),
                    webhook_url: toInputValue(systemData.automations?.webhook_url),
                    webhook_secret: toInputValue(systemData.automations?.webhook_secret),
                },
            });
            setPaymentMethods([...(methods || [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)));
        });
    }, [settingsQuery.data]);

    const isSaving = updateCompany.isPending || updateSettings.isPending || updateWebhookSettings.isPending || updatePaymentMethod.isPending;
    const currentTab = useMemo(() => TABS.find((tab) => tab.id === activeTab), [activeTab]);

    const saveCompany = async () => {
        try {
            await updateCompany.mutateAsync(normalizeCompanyPayload(company));
            Swal.fire({ icon: 'success', title: 'Empresa actualizada', timer: 1400, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: error.response?.data?.detail || error.message });
        }
    };

    const saveSystem = async () => {
        try {
            await updateSettings.mutateAsync(system);
            Swal.fire({ icon: 'success', title: 'Configuracion actualizada', timer: 1400, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: error.response?.data?.detail || error.message });
        }
    };

    const saveWebhook = async () => {
        try {
            await updateWebhookSettings.mutateAsync({
                webhook_enabled: Boolean(system.automations.webhook_enabled),
                webhook_url: cleanNullable(system.automations.webhook_url),
                webhook_secret: cleanNullable(system.automations.webhook_secret),
            });
            Swal.fire({ icon: 'success', title: 'Configuracion n8n actualizada', timer: 1400, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: error.response?.data?.detail || error.message });
        }
    };

    const testWebhookConnection = async () => {
        try {
            await testWebhook.mutateAsync();
            Swal.fire({ icon: 'success', title: 'Webhook enviado correctamente', text: 'n8n recibio el payload de prueba.' });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo probar la conexion', text: error.response?.data?.detail || error.message });
        }
    };

    const runBackupManually = async () => {
        try {
            const result = await runBackupNow.mutateAsync();
            const rows = result.rows_exported ?? 0;
            Swal.fire({
                icon: result.success ? 'success' : 'error',
                title: result.status === 'SKIPPED' ? 'Sin cambios nuevos' : result.success ? 'Backup ejecutado' : 'Backup fallido',
                text: result.message || `Filas exportadas: ${rows}`,
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo ejecutar', text: error.response?.data?.detail || error.message });
        }
    };

    const savePaymentMethod = async (method) => {
        try {
            await updatePaymentMethod.mutateAsync({
                id: method.id,
                payload: {
                    name_payment_method: method.name_payment_method,
                    is_active: Boolean(method.is_active),
                    display_order: Number(method.display_order || 0),
                },
            });
            Swal.fire({ icon: 'success', title: 'Metodo actualizado', timer: 1200, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: error.response?.data?.detail || error.message });
        }
    };

    const updateCompanyField = (key, value) => setCompany((prev) => ({ ...prev, [key]: value }));
    const updateSection = (section, key, value) => setSystem((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    const updateNested = (section, group, key, value) => setSystem((prev) => ({
        ...prev,
        [section]: {
            ...prev[section],
            [group]: { ...prev[section][group], [key]: value },
        },
    }));
    const updatePaymentMethodRow = (index, patch) => {
        setPaymentMethods((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
    };

    const renderTab = () => {
        if (!system) return null;

        if (activeTab === 'company') {
            return (
                <Section title="Datos de empresa" description="Informacion usada por dashboard, reportes y documentos exportados.">
                    <FieldGrid>
                        <Field label="Razon social"><TextInput readOnly={!canEdit} value={company.legal_name} onChange={(e) => updateCompanyField('legal_name', e.target.value)} /></Field>
                        <Field label="Nombre comercial"><TextInput readOnly={!canEdit} value={company.trade_name} onChange={(e) => updateCompanyField('trade_name', e.target.value)} /></Field>
                        <Field label="RUC"><TextInput readOnly={!canEdit} value={company.ruc} onChange={(e) => updateCompanyField('ruc', e.target.value)} /></Field>
                        <Field label="Direccion"><TextInput readOnly={!canEdit} value={company.address} onChange={(e) => updateCompanyField('address', e.target.value)} /></Field>
                        <Field label="Telefono"><TextInput readOnly={!canEdit} value={company.phone} onChange={(e) => updateCompanyField('phone', e.target.value)} /></Field>
                        <Field label="Email"><TextInput readOnly={!canEdit} value={company.email || ''} onChange={(e) => updateCompanyField('email', e.target.value)} /></Field>
                        <Field label="Sitio web"><TextInput readOnly={!canEdit} value={company.website} onChange={(e) => updateCompanyField('website', e.target.value)} /></Field>
                        <Field label="Logo empresa"><TextInput readOnly={!canEdit} value={company.logo_url} onChange={(e) => updateCompanyField('logo_url', e.target.value)} /></Field>
                        <Field label="Moneda principal"><TextInput readOnly={!canEdit} value={company.primary_currency} onChange={(e) => updateCompanyField('primary_currency', e.target.value.toUpperCase())} /></Field>
                        <Field label="Moneda secundaria"><TextInput readOnly={!canEdit} value={company.secondary_currency} onChange={(e) => updateCompanyField('secondary_currency', e.target.value.toUpperCase())} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveCompany} /></div>
                </Section>
            );
        }

        if (activeTab === 'fiscal') {
            return (
                <Section title="Configuracion fiscal">
                    <FieldGrid>
                        <Field label="IGV %"><TextInput readOnly={!canEdit} type="number" value={system.fiscal.igv_percent} onChange={(e) => updateSection('fiscal', 'igv_percent', Number(e.target.value))} /></Field>
                        <Field label="Moneda"><TextInput readOnly={!canEdit} value={system.fiscal.currency} onChange={(e) => updateSection('fiscal', 'currency', e.target.value.toUpperCase())} /></Field>
                        <Field label="Simbolo moneda"><TextInput readOnly={!canEdit} value={system.fiscal.currency_symbol} onChange={(e) => updateSection('fiscal', 'currency_symbol', e.target.value)} /></Field>
                        <Field label="Tipo cambio manual"><TextInput readOnly={!canEdit} type="number" step="0.01" value={system.fiscal.manual_exchange_rate} onChange={(e) => updateSection('fiscal', 'manual_exchange_rate', Number(e.target.value))} /></Field>
                        <Field label="Formato moneda"><TextInput readOnly={!canEdit} value={system.fiscal.currency_format} onChange={(e) => updateSection('fiscal', 'currency_format', e.target.value)} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'series') {
            const groups = [
                ['sales_receipt', 'Boleta'],
                ['invoice', 'Factura'],
                ['purchase', 'Compra'],
                ['note', 'Nota'],
            ];
            return (
                <Section title="Series y correlativos">
                    <div className="grid gap-4 md:grid-cols-2">
                        {groups.map(([key, label]) => (
                            <div key={key} className="rounded-lg border border-slate-200 p-4">
                                <h3 className="mb-3 text-sm font-black text-slate-900">{label}</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Serie"><TextInput readOnly={!canEdit} value={system.series[key].serie} onChange={(e) => updateNested('series', key, 'serie', e.target.value.toUpperCase())} /></Field>
                                    <Field label="Correlativo"><TextInput readOnly={!canEdit} type="number" min="0" value={system.series[key].correlativo} onChange={(e) => updateNested('series', key, 'correlativo', Number(e.target.value))} /></Field>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'payments') {
            return (
                <Section title="Metodos de pago" description="Desactivar mantiene intactos los registros historicos.">
                    <PaymentMethodsEditor
                        methods={paymentMethods}
                        canEdit={canEdit}
                        onChange={updatePaymentMethodRow}
                        onSave={savePaymentMethod}
                        isSaving={isSaving}
                    />
                </Section>
            );
        }

        if (activeTab === 'inventory') {
            return (
                <Section title="Inventario">
                    <FieldGrid>
                        <Field label="Stock minimo global"><TextInput readOnly={!canEdit} type="number" value={system.inventory.global_min_stock} onChange={(e) => updateSection('inventory', 'global_min_stock', Number(e.target.value))} /></Field>
                        <Field label="Dias alerta stock"><TextInput readOnly={!canEdit} type="number" value={system.inventory.stock_alert_days} onChange={(e) => updateSection('inventory', 'stock_alert_days', Number(e.target.value))} /></Field>
                        <Field label="Permitir stock negativo"><Toggle disabled={!canEdit} checked={system.inventory.allow_negative_stock} onChange={(v) => updateSection('inventory', 'allow_negative_stock', v)} /></Field>
                        <Field label="Aprobar ajustes"><Toggle disabled={!canEdit} checked={system.inventory.requires_inventory_adjustment_approval} onChange={(v) => updateSection('inventory', 'requires_inventory_adjustment_approval', v)} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'sales') {
            return (
                <Section title="Ventas">
                    <FieldGrid>
                        <Field label="Cliente mostrador ID"><TextInput readOnly={!canEdit} type="number" value={system.sales.default_counter_client_id || ''} onChange={(e) => updateSection('sales', 'default_counter_client_id', e.target.value ? Number(e.target.value) : null)} /></Field>
                        <Field label="Metodo pago por defecto"><SelectInput readOnly={!canEdit} value={system.sales.default_payment_method_id || ''} onChange={(e) => updateSection('sales', 'default_payment_method_id', e.target.value ? Number(e.target.value) : null)}><option value="">Automatico</option>{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name_payment_method}</option>)}</SelectInput></Field>
                        <Field label="Descuento maximo %"><TextInput readOnly={!canEdit} type="number" value={system.sales.max_discount_percent} onChange={(e) => updateSection('sales', 'max_discount_percent', Number(e.target.value))} /></Field>
                        <Field label="Permitir descuento manual"><Toggle disabled={!canEdit} checked={system.sales.allow_manual_discount} onChange={(v) => updateSection('sales', 'allow_manual_discount', v)} /></Field>
                        <Field label="Autorizar descuento"><Toggle disabled={!canEdit} checked={system.sales.requires_discount_authorization} onChange={(v) => updateSection('sales', 'requires_discount_authorization', v)} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'purchases') {
            return (
                <Section title="Compras">
                    <FieldGrid>
                        <Field label="Proveedor generico ID"><TextInput readOnly={!canEdit} type="number" value={system.purchases.default_generic_supplier_id || ''} onChange={(e) => updateSection('purchases', 'default_generic_supplier_id', e.target.value ? Number(e.target.value) : null)} /></Field>
                        <Field label="Compras sin proveedor"><Toggle disabled={!canEdit} checked={system.purchases.allow_purchases_without_supplier} onChange={(v) => updateSection('purchases', 'allow_purchases_without_supplier', v)} /></Field>
                        <Field label="Aprobar compras"><Toggle disabled={!canEdit} checked={system.purchases.requires_purchase_approval} onChange={(v) => updateSection('purchases', 'requires_purchase_approval', v)} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'cash') {
            return (
                <Section title="Caja">
                    <FieldGrid>
                        <Field label="Apertura minima"><TextInput readOnly={!canEdit} type="number" value={system.cash.minimum_opening_amount} onChange={(e) => updateSection('cash', 'minimum_opening_amount', Number(e.target.value))} /></Field>
                        <Field label="Apertura sugerida"><TextInput readOnly={!canEdit} type="number" value={system.cash.suggested_opening_amount} onChange={(e) => updateSection('cash', 'suggested_opening_amount', Number(e.target.value))} /></Field>
                        <Field label="Cierre obligatorio"><Toggle disabled={!canEdit} checked={system.cash.requires_mandatory_closing} onChange={(v) => updateSection('cash', 'requires_mandatory_closing', v)} /></Field>
                        <Field label="Multiples cajas"><Toggle disabled={!canEdit} checked={system.cash.allow_multiple_open_cash_sessions} onChange={(v) => updateSection('cash', 'allow_multiple_open_cash_sessions', v)} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'dashboard') {
            return (
                <Section title="Dashboard">
                    <FieldGrid>
                        <Field label="KPIs visibles"><TextInput readOnly={!canEdit} value={joinList(system.dashboard.visible_kpis)} onChange={(e) => updateSection('dashboard', 'visible_kpis', parseList(e.target.value))} /></Field>
                        <Field label="Graficos visibles"><TextInput readOnly={!canEdit} value={joinList(system.dashboard.visible_charts)} onChange={(e) => updateSection('dashboard', 'visible_charts', parseList(e.target.value))} /></Field>
                        <Field label="Cantidad registros"><TextInput readOnly={!canEdit} type="number" value={system.dashboard.records_limit} onChange={(e) => updateSection('dashboard', 'records_limit', Number(e.target.value))} /></Field>
                    </FieldGrid>
                    <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
                </Section>
            );
        }

        if (activeTab === 'automations') {
            const backupStatus = backupStatusQuery.data || {};
            return (
                <div className="space-y-4">
                    <Section title="Backup diario" description="Estado del respaldo incremental hacia Google Drive.">
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 p-4">
                                <p className="text-xs font-black uppercase text-slate-400">Ultimo respaldo</p>
                                <p className="mt-1 text-sm font-black text-slate-900">{formatDate(backupStatus.last_backup)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                                <p className="text-xs font-black uppercase text-slate-400">Proximo respaldo</p>
                                <p className="mt-1 text-sm font-black text-slate-900">{formatDate(backupStatus.next_backup)}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                                <p className="text-xs font-black uppercase text-slate-400">Estado</p>
                                <div className="mt-1"><BackupStatusBadge status={backupStatus.status} /></div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                                <CalendarClock size={16} />
                                <span>Programado diariamente a las 22:30</span>
                            </div>
                            <Button onClick={runBackupManually} disabled={!canEdit || runBackupNow.isPending || backupStatusQuery.isLoading}>
                                <Play size={15} /> Ejecutar ahora
                            </Button>
                        </div>
                    </Section>

                    <Section title="Configuracion n8n" description="Conexion inicial ERP a Webhook para pruebas controladas.">
                        <FieldGrid>
                            <Field label="Activar Webhook">
                                <Toggle
                                    disabled={!canEdit}
                                    checked={Boolean(system.automations.webhook_enabled)}
                                    onChange={(v) => updateSection('automations', 'webhook_enabled', v)}
                                />
                            </Field>
                            <Field label="URL Webhook">
                                <TextInput
                                    readOnly={!canEdit}
                                    placeholder="http://localhost:5678/webhook-test/..."
                                    value={system.automations.webhook_url || ''}
                                    onChange={(e) => updateSection('automations', 'webhook_url', e.target.value)}
                                />
                            </Field>
                            <Field label="Secret opcional">
                                <TextInput
                                    readOnly={!canEdit}
                                    type="password"
                                    value={system.automations.webhook_secret || ''}
                                    onChange={(e) => updateSection('automations', 'webhook_secret', e.target.value)}
                                />
                            </Field>
                        </FieldGrid>
                        <div className="mt-5 flex flex-wrap justify-end gap-2">
                            <Button onClick={saveWebhook} disabled={!canEdit || isSaving}>
                                <Save size={15} /> Guardar
                            </Button>
                            <Button onClick={testWebhookConnection} disabled={!canEdit || testWebhook.isPending}>
                                <Send size={15} /> Probar Conexion
                            </Button>
                        </div>
                    </Section>
                </div>
            );
        }

        return (
            <Section title="Reportes">
                <FieldGrid>
                    <Field label="PDF por defecto"><Toggle disabled={!canEdit} checked={system.reports.default_pdf} onChange={(v) => updateSection('reports', 'default_pdf', v)} /></Field>
                    <Field label="Excel por defecto"><Toggle disabled={!canEdit} checked={system.reports.default_excel} onChange={(v) => updateSection('reports', 'default_excel', v)} /></Field>
                    <Field label="CSV por defecto"><Toggle disabled={!canEdit} checked={system.reports.default_csv} onChange={(v) => updateSection('reports', 'default_csv', v)} /></Field>
                </FieldGrid>
                <div className="mt-5"><SaveBar canEdit={canEdit} isSaving={isSaving} onSave={saveSystem} /></div>
            </Section>
        );
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Sistema"
                title="Configuracion general"
                description={canEdit ? 'Parametros globales del ERP.' : 'Vista de solo lectura para supervision.'}
            />

            <Card className="flex flex-wrap gap-1 p-2">
                {TABS.map((tab) => (
                    <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                ))}
            </Card>

            <DataState
                isLoading={settingsQuery.isLoading}
                isError={settingsQuery.isError}
                loadingLabel="Cargando configuracion..."
                errorTitle="No se pudo cargar configuracion"
                errorDescription={settingsQuery.error?.response?.data?.detail || settingsQuery.error?.message}
            >
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    {currentTab ? React.createElement(currentTab.icon, { size: 16 }) : null}
                    <span>{currentTab?.label}</span>
                </div>
                {renderTab()}
            </DataState>
        </div>
    );
};

export default SettingsPage;
