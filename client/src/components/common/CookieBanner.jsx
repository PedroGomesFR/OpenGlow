import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const COOKIE_KEY = 'openglow_cookie_consent';

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_KEY);
        if (!consent) setVisible(true);
    }, []);

    const accept = () => {
        localStorage.setItem(COOKIE_KEY, 'accepted');
        setVisible(false);
    };

    const refuse = () => {
        localStorage.setItem(COOKIE_KEY, 'refused');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'rgba(29, 29, 31, 0.97)',
            color: 'white',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)'
        }}>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', flex: 1, minWidth: '200px' }}>
                Ce site utilise des cookies techniques nécessaires à son fonctionnement ainsi que <strong>Google reCAPTCHA</strong> (données envoyées à Google pour la sécurité).
                {' '}
                <span
                    onClick={() => navigate('/politique-confidentialite')}
                    style={{ color: '#0071e3', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    En savoir plus
                </span>
            </p>
            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                    onClick={refuse}
                    style={{
                        background: 'transparent',
                        color: '#aeaeb2',
                        border: '1px solid #48484a',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Refuser
                </button>
                <button
                    onClick={accept}
                    style={{
                        background: '#0071e3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 18px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Accepter
                </button>
            </div>
        </div>
    );
};

export default CookieBanner;
