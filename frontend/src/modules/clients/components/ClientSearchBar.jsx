import React from 'react';
import { Filter, Search } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';

export const ClientSearchBar = ({ query, status, onQueryChange, onStatusChange }) => (
    <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <Input
                    className="pl-10"
                    placeholder="Buscar por DNI, nombre, email o telefono..."
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                />
            </div>
            <div className="relative">
                <Filter className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={status}
                    onChange={(event) => onStatusChange(event.target.value)}
                >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </select>
            </div>
        </div>
    </Card>
);
