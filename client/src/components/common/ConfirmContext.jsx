import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);
    const resolveRef = useRef(null);

    const showConfirm = useCallback(({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false }) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({ title, message, confirmLabel, cancelLabel, danger });
        });
    }, []);

    const handleConfirm = () => {
        setState(null);
        resolveRef.current?.(true);
    };

    const handleCancel = () => {
        setState(null);
        resolveRef.current?.(false);
    };

    return (
        <ConfirmContext.Provider value={showConfirm}>
            {children}
            {state && (
                <div
                    onClick={handleCancel}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 99998,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '28px 28px 24px',
                            maxWidth: '420px',
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            animation: 'popIn 0.2s ease',
                        }}
                    >
                        {state.title && (
                            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '700', color: '#1d1d1f' }}>
                                {state.title}
                            </h3>
                        )}
                        <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#424245', lineHeight: '1.5' }}>
                            {state.message}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: '1px solid #d1d1d6',
                                    background: 'transparent', color: '#1d1d1f', fontWeight: '600',
                                    fontSize: '14px', cursor: 'pointer',
                                }}
                            >
                                {state.cancelLabel}
                            </button>
                            <button
                                onClick={handleConfirm}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: state.danger ? '#FF3B30' : 'var(--primary, #0071e3)',
                                    color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                                }}
                            >
                                {state.confirmLabel}
                            </button>
                        </div>
                    </div>
                    <style>{`
                        @keyframes popIn {
                            from { opacity: 0; transform: scale(0.92); }
                            to   { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    return useContext(ConfirmContext);
}
