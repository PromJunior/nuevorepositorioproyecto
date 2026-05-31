import React, { useRef, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, Loader2, Search, X } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { useCreateSupplier, useSearchRuc } from '../../suppliers/hooks/useSuppliers';
import { SupplierQuickCreateModal } from './SupplierQuickCreateModal';

/**
 * Selector de proveedor con búsqueda RUC (local first → ApiPeru).
 * Props:
 *  - value: supplier object | null
 *  - onChange(supplier | null)
 */
export const SupplierSelector = ({ value, onChange }) => {
    const [ruc, setRuc] = useState('');
    const [searchStatus, setSearchStatus] = useState(null); // null | 'found_local' | 'found_external' | 'error'
    const [searchError, setSearchError] = useState(null);
    const [externalData, setExternalData] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const rucCache = useRef(new Map());
    const searchRucMutation = useSearchRuc();
    const createMutation = useCreateSupplier();

    const handleRucChange = (val) => {
        const clean = val.replace(/\D/g, '').slice(0, 11);
        setRuc(clean);
        if (clean.length < 11) {
            setSearchStatus(null);
            setSearchError(null);
            setExternalData(null);
        }
    };

    const handleSearch = async () => {
        if (ruc.length !== 11) return;

        if (rucCache.current.has(ruc)) {
            const cached = rucCache.current.get(ruc);
            applyResult(cached);
            return;
        }

        try {
            setSearchStatus('searching');
            setSearchError(null);
            const result = await searchRucMutation.mutateAsync(ruc);
            rucCache.current.set(ruc, result);
            applyResult(result);
        } catch (err) {
            setSearchStatus('error');
            setSearchError(err.response?.data?.detail || err.message || 'Error al buscar RUC');
        }
    };

    const applyResult = (result) => {
        if (result.exists) {
            onChange(result.data);
            setSearchStatus('found_local');
            setExternalData(null);
        } else {
            setExternalData(result.data);
            setSearchStatus('found_external');
            onChange(null);
        }
    };

    const handleQuickCreate = async (formData) => {
        const supplier = await createMutation.mutateAsync(formData);
        onChange(supplier);
        setSearchStatus('found_local');
        rucCache.current.set(supplier.ruc, { source: 'local', data: supplier, exists: true });
        setModalOpen(false);
    };

    if (value) {
        return (
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                            <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Proveedor seleccionado
                            </p>
                            <p className="font-black text-slate-900">{value.company_name}</p>
                            <p className="text-xs font-mono text-slate-400">RUC: {value.ruc}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="text-slate-400" onClick={() => { onChange(null); setSearchStatus(null); setRuc(''); }}>
                        <X size={15} /> Cambiar
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Proveedor — Buscar por RUC
                </p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
                        <Input
                            className="pl-9 font-mono"
                            value={ruc}
                            maxLength={11}
                            inputMode="numeric"
                            placeholder="RUC de 11 dígitos"
                            onChange={(e) => handleRucChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={ruc.length !== 11 || searchRucMutation.isPending}
                    >
                        {searchRucMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Search size={14} />
                        )}
                        Buscar RUC
                    </Button>
                </div>

                {searchStatus === 'found_local' && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={14} /> Proveedor encontrado en el sistema
                    </div>
                )}

                {searchStatus === 'found_external' && externalData && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                        <p className="font-black">{externalData.company_name}</p>
                        {externalData.address && (
                            <p className="mt-0.5 text-[11px] text-amber-600">{externalData.address}</p>
                        )}
                        <div className="mt-2 flex gap-2">
                            <Button
                                variant="default"
                                className="h-7 px-3 text-[10px] uppercase tracking-wider bg-amber-600 hover:bg-amber-700"
                                onClick={() => setModalOpen(true)}
                            >
                                Registrar proveedor
                            </Button>
                        </div>
                    </div>
                )}

                {searchStatus === 'error' && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700">
                        <AlertCircle size={14} /> {searchError}
                    </div>
                )}
            </Card>

            <SupplierQuickCreateModal
                key={modalOpen ? `ruc-${ruc}` : 'closed'}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialData={{ ruc, company_name: externalData?.company_name || '' }}
                onSubmit={handleQuickCreate}
                isLoading={createMutation.isPending}
            />
        </>
    );
};
