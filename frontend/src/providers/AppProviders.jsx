import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './QueryProvider';

export const AppProviders = ({ children }) => {
    return (
        <BrowserRouter>
            <QueryProvider>
                {children}
            </QueryProvider>
        </BrowserRouter>
    );
};
