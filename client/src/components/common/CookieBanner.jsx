import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const COOKIE_KEY = 'openglow_cookie_consent';

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                {t('cookie_banner_text')} <strong>{t('cookie_recaptcha')}</strong> {t('cookie_banner_recaptcha_suffix')}
                {' '}
                <span
                    onClick={() => navigate('/politique-confidentialite')}
                    style={{ color: '#0071e3', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {t('cookie_learn_more')}
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
                    {t('action_decline')}
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
                    {t('action_accept')}
                </button>
            </div>
        </div>
    );
};

export default CookieBanner;
