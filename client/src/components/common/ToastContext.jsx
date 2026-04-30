import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const colors = {
        success: { bg: '#1c7a45', icon: '✓' },
        error:   { bg: '#c0392b', icon: '✕' },
        warning: { bg: '#b8620a', icon: '⚠' },
        info:    { bg: '#0071e3', icon: 'ℹ' },
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div style={{
                position: 'fixed',
                top: '90px',
                right: '20px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none',
            }}>
                {toasts.map(({ id, message, type }) => {
                    const { bg, icon } = colors[type] || colors.info;
                    return (
                        <div
                            key={id}
                            style={{
                                background: bg,
                                color: 'white',
                                padding: '14px 18px',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                minWidth: '280px',
                                maxWidth: '400px',
                                fontSize: '14px',
                                fontWeight: '500',
                                pointerEvents: 'all',
                                animation: 'slideIn 0.25s ease',
                            }}
                        >
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
                            <span style={{ flex: 1, lineHeight: '1.4' }}>{message}</span>
                            <button
                                onClick={() => dismiss(id)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '22px',
                                    height: '22px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
