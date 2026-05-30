import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useSalesCartStore } from '../store/useSalesCartStore';
import { ProductSearchPanel } from '../components/ProductSearchPanel';
import { SalesCartPanel } from '../components/SalesCartPanel';
import { ClientSelector } from '../components/ClientSelector';
import { QuickClientModal } from '../components/QuickClientModal';
import { useCreateClient, useCreateSale, usePaymentMethods, useSalesProducts, useSearchClient } from '../hooks/useSales';
import { formatCurrency } from '../../../shared/utils/formatters';

const MySwal = withReactContent(Swal);
const COUNTER_CLIENT = { id: 4, full_name: 'Venta Mostrador' };

const SalesPage = () => {
    const productsQuery = useSalesProducts();
    const paymentMethodsQuery = usePaymentMethods();
    const createSaleMutation = useCreateSale();
    const createClientMutation = useCreateClient();

    const items = useSalesCartStore((state) => state.items);
    const addItem = useSalesCartStore((state) => state.addItem);
    const removeItem = useSalesCartStore((state) => state.removeItem);
    const updateQuantity = useSalesCartStore((state) => state.updateQuantity);
    const clearCart = useSalesCartStore((state) => state.clearCart);
    const syncStock = useSalesCartStore((state) => state.syncStock);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [selectedClient, setSelectedClient] = useState(COUNTER_CLIENT);
    const [dniSearch, setDniSearch] = useState('');

    // Estados de búsqueda DNI
    const [searchStatus, setSearchStatus] = useState(null);
    const [searchError, setSearchError] = useState(null);
    const [externalClientData, setExternalClientData] = useState(null);

    // Estados para QuickClientModal
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
    const [quickModalDni, setQuickModalDni] = useState('');
    const [quickModalName, setQuickModalName] = useState('');

    const searchClientMutation = useSearchClient();
    const dniCache = useRef(new Map());

    const paymentMethods = useMemo(() => paymentMethodsQuery.data || [], [paymentMethodsQuery.data]);
    const products = useMemo(() => productsQuery.data || [], [productsQuery.data]);
    const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0), [items]);
    const effectivePaymentMethod = selectedPaymentMethod ?? paymentMethods[0]?.id ?? null;

    useEffect(() => {
        if (products.length > 0) syncStock(products);
    }, [products, syncStock]);

    const handleDniChange = (value) => {
        setDniSearch(value);
        if (value.length !== 8) {
            if (selectedClient.id !== COUNTER_CLIENT.id) setSelectedClient(COUNTER_CLIENT);
            setSearchStatus(null);
            setSearchError(null);
            setExternalClientData(null);
        }
    };

    const handleSearchDni = async () => {
        if (dniSearch.length !== 8) return;

        if (dniCache.current.has(dniSearch)) {
            const cached = dniCache.current.get(dniSearch);
            if (cached.exists) {
                setSelectedClient(cached.client);
                setSearchStatus('found_local');
            } else {
                setExternalClientData(cached.client);
                setSelectedClient(COUNTER_CLIENT);
                setSearchStatus('not_found');
            }
            setSearchError(null);
            return;
        }

        try {
            setSearchStatus('searching');
            setSearchError(null);
            setExternalClientData(null);

            const res = await searchClientMutation.mutateAsync(dniSearch);
            dniCache.current.set(dniSearch, res);

            if (res.exists) {
                setSelectedClient(res.client);
                setSearchStatus('found_local');
            } else {
                setExternalClientData(res.client);
                setSelectedClient(COUNTER_CLIENT);
                setSearchStatus('not_found');
            }
        } catch (err) {
            setSelectedClient(COUNTER_CLIENT);
            setSearchStatus('error');
            setSearchError(err.message || 'Error al buscar cliente');
        }
    };

    const handleCreateClient = (prefillData = null) => {
        if (prefillData) {
            setQuickModalDni(prefillData.dni || dniSearch);
            setQuickModalName(prefillData.full_name || '');
        } else {
            setQuickModalDni(dniSearch);
            setQuickModalName('');
        }
        setIsQuickModalOpen(true);
    };

    const handleQuickClientSubmit = async (clientData) => {
        try {
            const client = await createClientMutation.mutateAsync(clientData);
            setSelectedClient(client);
            setDniSearch(client.dni);
            setSearchStatus('found_local');
            setSearchError(null);
            setExternalClientData(null);
            setIsQuickModalOpen(false);
            MySwal.fire({ icon: 'success', title: 'Cliente registrado', text: client.full_name });
        } catch (error) {
            MySwal.fire({ icon: 'error', title: 'No se pudo registrar', text: error.response?.data?.detail || error.message });
        }
    };

    const handleConfirmSale = async () => {
        const stockIssue = items.find((item) => Number(item.quantity) > Number(item.stock || 0));
        if (stockIssue) {
            MySwal.fire({ icon: 'warning', title: 'Stock insuficiente', text: stockIssue.name_product });
            return;
        }

        const result = await MySwal.fire({
            icon: 'question',
            title: 'Confirmar venta',
            html: `<b>Cliente:</b> ${selectedClient.full_name}<br><b>Total:</b> ${formatCurrency(total)}`,
            showCancelButton: true,
            confirmButtonText: 'Vender',
            cancelButtonText: 'Cancelar',
        });

        if (!result.isConfirmed) return;

        try {
            await createSaleMutation.mutateAsync({
                client_id: selectedClient.id,
                payment_method_id: effectivePaymentMethod,
                items: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                })),
            });
            clearCart();
            setSelectedClient(COUNTER_CLIENT);
            setDniSearch('');
            MySwal.fire({ icon: 'success', title: 'Venta registrada', text: 'Stock y caja fueron sincronizados.' });
        } catch (error) {
            MySwal.fire({ icon: 'error', title: 'No se pudo completar', text: error.response?.data?.detail || error.message });
        }
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-50/40 p-6">
            <PageHeader
                eyebrow="Ventas"
                title="Punto de venta"
                description="Busqueda de productos, cliente, carrito persistente y validacion de stock."
            />

            <ClientSelector
                dni={dniSearch}
                selectedClient={selectedClient}
                isSearching={searchClientMutation.isPending}
                onDniChange={handleDniChange}
                onSearchDni={handleSearchDni}
                onUseCounterSale={() => {
                    setSelectedClient(COUNTER_CLIENT);
                    setDniSearch('');
                    setSearchStatus(null);
                    setSearchError(null);
                    setExternalClientData(null);
                }}
                onCreateClient={handleCreateClient}
                searchStatus={searchStatus}
                searchError={searchError}
                externalClientData={externalClientData}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <ProductSearchPanel
                        products={products}
                        isLoading={productsQuery.isLoading}
                        isError={productsQuery.isError}
                        onAddProduct={addItem}
                    />
                </div>
                <SalesCartPanel
                    items={items}
                    total={total}
                    paymentMethods={paymentMethods}
                    selectedPaymentMethod={effectivePaymentMethod}
                    onPaymentMethodChange={setSelectedPaymentMethod}
                    selectedClient={selectedClient}
                    onQuantityChange={updateQuantity}
                    onRemove={removeItem}
                    onConfirmSale={handleConfirmSale}
                    isSaving={createSaleMutation.isPending}
                />
            </div>

            <QuickClientModal
                key={isQuickModalOpen ? `open-${quickModalDni}-${quickModalName}` : 'closed'}
                isOpen={isQuickModalOpen}
                onClose={() => setIsQuickModalOpen(false)}
                onSubmit={handleQuickClientSubmit}
                initialDni={quickModalDni}
                initialFullName={quickModalName}
                isLoading={createClientMutation.isPending}
            />
        </div>
    );
};

export default SalesPage;
