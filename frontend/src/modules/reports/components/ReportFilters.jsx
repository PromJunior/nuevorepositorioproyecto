import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Button } from '../../../shared/components/ui/button';

/**
 * Panel de filtros reutilizable para todos los reportes.
 *
 * Props:
 *  - filters: { date_from, date_to, [status], [transaction_type] }
 *  - onFilterChange(key, value)
 *  - onReset()
 *  - extraSlot?: React node — filtros adicionales por reporte
 */
export const ReportFilters = ({ filters, onFilterChange, onReset, extraSlot }) => (
    <Card className="p-4">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Filtros del reporte
            </p>
            <Button variant="ghost" className="px-2 py-1 text-xs text-slate-400" onClick={onReset}>
                <RefreshCw size={12} /> Limpiar
            </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
                <Label>Fecha desde</Label>
                <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => onFilterChange('date_from', e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <Label>Fecha hasta</Label>
                <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => onFilterChange('date_to', e.target.value)}
                />
            </div>
            {extraSlot}
        </div>
    </Card>
);
