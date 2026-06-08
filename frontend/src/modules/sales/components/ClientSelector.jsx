import React from 'react';
import { Search, UserPlus, X, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';

export const ClientSelector = ({
    dni,
    selectedClient,
    isCounterSale,
    isSearching,
    onDniChange,
    onSearchDni,
    onSearchClient,
    onUseCounterSale,
    onCreateClient,
    searchStatus = null,
    searchError = null,
    externalClientData = null,
}) => (
    <Card className="p-4">
        {isCounterSale ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cliente</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{selectedClient?.full_name || 'Venta Mostrador'}</p>
                </div>
                <Button variant="secondary" onClick={onSearchClient}>
                    <Search size={16} /> Buscar cliente
                </Button>
            </div>
        ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="flex-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cliente por DNI</label>
                    <div className="relative mt-2">
                        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <Input
                            className="pl-11"
                            value={dni}
                            maxLength={8}
                            inputMode="numeric"
                            placeholder="Digita DNI de 8 numeros"
                            onChange={(event) => onDniChange(event.target.value.replace(/\D/g, '').slice(0, 8))}
                            onKeyDown={(e) => e.key === 'Enter' && onSearchDni()}
                        />
                    </div>
                </div>
                <Button
                    variant="default"
                    onClick={onSearchDni}
                    disabled={dni.length !== 8 || isSearching}
                >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Buscar DNI
                </Button>
                <Button variant="secondary" onClick={() => onCreateClient(null)}>
                    <UserPlus size={16} /> Registrar
                </Button>
                <Button variant="ghost" onClick={onUseCounterSale}>
                    <X size={16} /> Mostrador
                </Button>
            </div>
        )}

        {searchStatus === 'searching' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700 animate-pulse">
                <Loader2 className="animate-spin text-blue-500 shrink-0" size={16} />
                <span>Buscando cliente por DNI...</span>
            </div>
        )}

        {searchStatus === 'found_local' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 animate-fade-in">
                <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                <span>Cliente encontrado registrado en el sistema</span>
            </div>
        )}

        {searchStatus === 'not_found' && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 animate-fade-in">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                    <span>Cliente no registrado en el sistema. Nombre: {externalClientData?.full_name}</span>
                </div>
                <Button 
                    variant="default" 
                    className="h-8 px-3 py-1 text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-black tracking-wider uppercase shrink-0" 
                    onClick={() => onCreateClient(externalClientData)}
                >
                    <UserPlus size={12} /> Registrar rápido
                </Button>
            </div>
        )}

        {searchStatus === 'error' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 animate-fade-in">
                <AlertCircle className="text-red-500 shrink-0" size={16} />
                <span>{searchError || 'Error al buscar cliente por DNI'}</span>
            </div>
        )}

        {!isCounterSale && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cliente seleccionado</p>
            <p className="mt-1 text-sm font-black text-slate-900">
                {isSearching ? 'Buscando...' : selectedClient?.full_name || 'Venta Mostrador'}
            </p>
        </div>}
    </Card>
);

