import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ArrowLeft, Building2, FileText, Loader2, Save } from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { SupplierSelector } from '../components/SupplierSelector';
import { ProductPurchaseSelector } from '../components/ProductPurchaseSelector';
import { PurchaseItemsTable } from '../components/PurchaseItemsTable';
import { PurchaseSummary } from '../components/PurchaseSummary';
import { useCreatePurchase, useReceivePurchase } from '../hooks/usePurchases';
import { useInventory } from '../../inventory/hooks/useInventory';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useGenericSupplier } from '../../suppliers/hooks/useSuppliers';

const MySwal = withReactContent(Swal);

const PurchaseFormPage = () => {
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState([]);

    const createMutation = useCreatePurchase();
    const receiveMutation = useReceivePurchase();
    const genericSupplierMutation = useGenericSupplier();
    const { products } = useInventory();

    const existingIds = useMemo(() => new Set(items.map((i) => i.product_id)), [items]);
    const total = items.reduce((s, it) => s + Number(it.sub_amount || 0), 0);

    const handleAddProduct = (product) => {
        setItems((prev) => [
            ...prev,
            {
                product_id: product.id,
                product_name: product.name_product,
                quantity: 1,
                unit_cost: Number(product.price) || 0,
                sub_amount: Number(product.price) || 0,
            },
        ]);
    };

    const handleUpdateItem = (idx, field, value) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            const qty = Number(updated[idx].quantity) || 0;
            const cost = Number(updated[idx].unit_cost) || 0;
            updated[idx].sub_amount = qty * cost;
            return updated;
        });
    };

    const handleRemoveItem = (idx) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const validate = () => {
        if (!supplier?.id) return 'Selecciona un proveedor.';
        if (items.length === 0) return 'Agrega al menos un producto.';
        if (items.some((it) => it.quantity <= 0)) return 'Todas las cantidades deben ser > 0.';
        if (items.some((it) => it.unit_cost <= 0)) return 'Todos los costos deben ser > 0.';
        return null;
    };

    const buildPayload = () => ({
        supplier_id: supplier.id,
        invoice_number: invoiceNumber || undefined,
        items: items.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_cost: it.unit_cost,
        })),
    });

    const handleUseGenericSupplier = async () => {
        try {
            const genericSupplier = await genericSupplierMutation.mutateAsync();
            setSupplier(genericSupplier);
        } catch (error) {
            MySwal.fire({
                icon: 'error',
                title: 'Error al seleccionar proveedor',
                text: error.response?.data?.detail || error.message,
                customClass: { popup: '!rounded-2xl' },
            });
        }
    };

    const handleSaveDraft = async () => {
        const err = validate();
        if (err) return MySwal.fire({ icon: 'warning', title: 'Validación', text: err, customClass: { popup: '!rounded-2xl' } });

        try {
            const purchase = await createMutation.mutateAsync(buildPayload());
            MySwal.fire({ icon: 'success', title: 'Borrador guardado', text: `Compra #${purchase.id} creada.`, timer: 2000, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            navigate(`/compras/${purchase.id}`);
        } catch (error) {
            MySwal.fire({ icon: 'error', title: 'Error al crear', text: error.response?.data?.detail || error.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    const handleSaveAndReceive = async () => {
        const err = validate();
        if (err) return MySwal.fire({ icon: 'warning', title: 'Validación', text: err, customClass: { popup: '!rounded-2xl' } });

        const confirm = await MySwal.fire({
            icon: 'question',
            title: 'Recibir compra',
            html: `<p class="text-sm">Esta acción <b>actualizará el stock</b> de los productos y registrará las entradas en el Kardex.</p><p class="mt-2 font-bold text-slate-900">Total: ${formatCurrency(total, 'PEN')}</p>`,
            showCancelButton: true,
            confirmButtonText: 'Sí, recibir',
            cancelButtonText: 'Cancelar',
            customClass: { popup: '!rounded-2xl' },
        });
        if (!confirm.isConfirmed) return;

        try {
            const purchase = await createMutation.mutateAsync(buildPayload());
            await receiveMutation.mutateAsync(purchase.id);
            MySwal.fire({ icon: 'success', title: 'Compra recibida', text: 'Stock e inventario actualizados.', timer: 2000, showConfirmButton: false, customClass: { popup: '!rounded-2xl' } });
            navigate(`/compras/${purchase.id}`);
        } catch (error) {
            MySwal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.detail || error.message, customClass: { popup: '!rounded-2xl' } });
        }
    };

    const isBusy = createMutation.isPending || receiveMutation.isPending || genericSupplierMutation.isPending;

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Compras"
                title="Nueva compra"
                description="Registra una compra a proveedor. Guarda como borrador o recibe para afectar inventario."
                actions={
                    <Button variant="secondary" onClick={() => navigate('/compras')}>
                        <ArrowLeft size={14} /> Volver
                    </Button>
                }
            />

            {/* Proveedor */}
            <SupplierSelector value={supplier} onChange={setSupplier} />

            <div className="flex justify-end">
                <Button
                    variant="secondary"
                    onClick={handleUseGenericSupplier}
                    disabled={isBusy}
                >
                    {genericSupplierMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Building2 size={14} />
                    )}
                    Usar proveedor genérico
                </Button>
            </div>

            {/* N° Factura */}
            <Card className="p-4">
                <div className="max-w-sm space-y-1.5">
                    <Label>N° de factura / comprobante (opcional)</Label>
                    <div className="relative">
                        <FileText className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                        <Input
                            className="pl-9"
                            placeholder="F001-0001"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Selector de productos */}
            <ProductPurchaseSelector
                products={products}
                onAdd={handleAddProduct}
                existingIds={existingIds}
            />

            {/* Tabla de ítems */}
            <PurchaseItemsTable
                items={items}
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
            />

            {/* Resumen */}
            {items.length > 0 && <PurchaseSummary items={items} />}

            {/* Acciones */}
            {items.length > 0 && (
                <Card className="flex flex-col items-end gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-bold text-slate-500">
                        {items.length} producto{items.length !== 1 ? 's' : ''} ·{' '}
                        <span className="text-base font-black text-slate-900">
                            {formatCurrency(total, 'PEN')}
                        </span>
                    </span>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleSaveDraft} disabled={isBusy}>
                            {createMutation.isPending && !receiveMutation.isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            Guardar borrador
                        </Button>
                        <Button onClick={handleSaveAndReceive} disabled={isBusy}>
                            {isBusy ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            Recibir compra
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PurchaseFormPage;
