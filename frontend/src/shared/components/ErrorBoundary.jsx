import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from './EmptyState';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('UI boundary error', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6">
                    <EmptyState
                        icon={AlertTriangle}
                        title="Algo salio mal"
                        description="El modulo no pudo renderizarse correctamente."
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
