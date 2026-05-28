import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Package, Receipt, ShoppingCart, Wallet, Zap } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataState } from '../../../shared/components/DataState';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../../shared/components/Table';
import { ROUTES } from '../../../constants/routes';
import { formatCurrency, formatDateTime } from '../../../shared/utils/formatters';
import { useDashboard } from '../hooks/useDashboard';

const MetricCard = ({ title, value, detail, icon: Icon, tone = 'blue' }) => {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-100 text-slate-600',
    };

    return (
        <Card className="flex items-center justify-between p-5">
            <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{detail}</p>
            </div>
            <div className={`rounded-xl p-3 ${tones[tone]}`}>
                <Icon size={22} />
            </div>
        </Card>
    );
};

const DashboardPage = () => {
    const dashboardQuery = useDashboard();
    const data = dashboardQuery.data;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Operacion"
                title="Dashboard ERP"
                description="Resumen operativo de ventas, caja e inventario."
                actions={(
                    <>
                        <Button as={Link} className="hidden" />
                        <Link to={ROUTES.sales}>
                            <Button><ShoppingCart size={16} /> Nueva venta</Button>
                        </Link>
                    </>
                )}
            />

            <DataState
                isLoading={dashboardQuery.isLoading}
                isError={dashboardQuery.isError}
                errorDescription={dashboardQuery.error?.response?.data?.detail || dashboardQuery.error?.message}
            >
                {data && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard title="Ventas del dia" value={formatCurrency(data.metrics.salesToday)} detail={`${data.metrics.ordersToday} ordenes registradas`} icon={Receipt} tone="emerald" />
                            <MetricCard title="Ingresos totales" value={formatCurrency(data.metrics.incomeTotal)} detail="Historico visible actual" icon={Wallet} />
                            <MetricCard title="Bajo stock" value={data.metrics.lowStockCount} detail="Productos en alerta" icon={AlertTriangle} tone={data.metrics.lowStockCount ? 'amber' : 'slate'} />
                            <MetricCard title="Catalogo" value={data.products.length} detail="SKUs cargados" icon={Package} tone="slate" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <Card className="p-5 xl:col-span-2">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-base font-black text-slate-900">Ultimas ventas</h2>
                                    <Link to={ROUTES.orders} className="text-xs font-black text-blue-600">Ver detalle</Link>
                                </div>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell as="th">Orden</TableCell>
                                            <TableCell as="th">Cliente</TableCell>
                                            <TableCell as="th">Fecha</TableCell>
                                            <TableCell as="th" className="text-right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.latestOrders.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-slate-400">Sin ventas recientes.</TableCell></TableRow>
                                        ) : data.latestOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs font-bold text-slate-400">#{order.id}</TableCell>
                                                <TableCell className="font-semibold">{order.client?.full_name || 'Venta Mostrador'}</TableCell>
                                                <TableCell>{formatDateTime(order.order_date)}</TableCell>
                                                <TableCell className="text-right font-black">{formatCurrency(order.total_amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>

                            <div className="space-y-6">
                                <Card className="p-5">
                                    <h2 className="text-base font-black text-slate-900">Estado de caja</h2>
                                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sesion actual</p>
                                        <p className="mt-2 text-xl font-black text-slate-900">{data.cashSession?.status || 'No disponible'}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                            Esperado: {formatCurrency(data.cashSession?.expected_amount || data.cashSession?.expectedAmount || 0)}
                                        </p>
                                    </div>
                                </Card>

                                <Card className="p-5">
                                    <h2 className="text-base font-black text-slate-900">Accesos rapidos</h2>
                                    <div className="mt-4 grid gap-2">
                                        <Link to={ROUTES.sales}><Button className="w-full justify-start"><Zap size={16} /> Registrar venta</Button></Link>
                                        <Link to={ROUTES.inventory}><Button variant="secondary" className="w-full justify-start"><Package size={16} /> Ver inventario</Button></Link>
                                        <Link to={ROUTES.cashClosing}><Button variant="secondary" className="w-full justify-start"><Wallet size={16} /> Gestionar caja</Button></Link>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </>
                )}
            </DataState>
        </div>
    );
};

export default DashboardPage;
