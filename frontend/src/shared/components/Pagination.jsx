import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

export const Pagination = ({ page, totalPages, onPageChange }) => {
    if (!totalPages || totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-end gap-2">
            <Button
                variant="secondary"
                className="px-3"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-bold text-slate-500">
                {page} / {totalPages}
            </span>
            <Button
                variant="secondary"
                className="px-3"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                <ChevronRight size={16} />
            </Button>
        </div>
    );
};
