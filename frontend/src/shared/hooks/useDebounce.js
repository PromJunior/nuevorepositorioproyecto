import { useEffect, useState } from 'react';

/**
 * Devuelve una copia de `value` que sólo se actualiza después de
 * `delay` ms de inactividad. Delay por defecto: 300 ms.
 *
 * Uso:
 *   const debouncedQuery = useDebounce(searchInput, 300);
 *   // Usa debouncedQuery en useMemo / useEffect / fetch
 */
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};
