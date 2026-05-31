import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { useSearchRuc } from '../hooks/useSuppliers';

/**
 * Componente standalone de búsqueda de RUC.
 *
 * Flujo:
 *  1. Usuario ingresa RUC (11 dígitos) y pulsa "Buscar RUC".
 *  2. Busca primero en BD local (sin ApiPeru).
 *  3. Si no existe, consulta ApiPeru.
 *  4. Llama a onFound({ source, data, exists }) o onError(msg).
 *
 * Props:
 *  - onFound({ source: 'local'|'external', data, exists: boolean })
 *  - onError(message: string)
 *  - disabled?: boolean
 */
export const SupplierRucSearch = ({ onFound, onError, disabled = false }) => {
    const [ruc, setRuc] = useState('');
    const [status, setStatus] = useState(null); // null | 'found_local' | 'found_external' | 'error'
    const [errorMsg, setErrorMsg] = useState('');
    const cache = useRef(new Map());
    const searchMutation = useSearchRuc();

    const handleChange = (val) => {
        const clean = val.replace(/\D/g, '').slice(0, 11);
        setRuc(clean);
        if (clean.length < 11) { setStatus(null); setErrorMsg(''); }
    };

    const handleSearch = async () => {
        if (ruc.length !== 11 || disabled) return;

        if (cache.current.has(ruc)) {
            const cached = cache.current.get(ruc);
            setStatus(cached.exists ? 'found_local' : 'found_external');
            onFound(cached);
            return;
        }

        try {
            setStatus(null);
            const result = await searchMutation.mutateAsync(ruc);
            cache.current.set(ruc, result);
            setStatus(result.exists ? 'found_local' : 'found_external');
            onFound(result);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Error al buscar RUC';
            setStatus('error');
            setErrorMsg(msg);
            onError?.(msg);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={14} />
                    <Input
                        className="pl-9 font-mono"
                        value={ruc}
                        maxLength={11}
                        inputMode="numeric"
                        placeholder="RUC de 11 dígitos"
                        disabled={disabled}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={ruc.length !== 11 || searchMutation.isPending || disabled}
                >
                    {searchMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Search size={14} />
                    )}
                    Buscar RUC
                </Button>
            </div>

            {status === 'found_local' && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={13} /> Proveedor encontrado en el sistema
                </div>
            )}
            {status === 'found_external' && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                    <CheckCircle2 size={13} /> RUC verificado en ApiPeru — no está registrado aún
                </div>
            )}
            {status === 'error' && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    <AlertCircle size={13} /> {errorMsg}
                </div>
            )}
        </div>
    );
};
