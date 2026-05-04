import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';

const Footer = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer style={{
            background: '#F5F5F7',
            padding: '60px 0 30px',
            borderTop: '1px solid #E5E5E5',
            marginTop: 'auto',
            width: '100%'
        }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
                    {/* Brand */}
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>OpenGlow Beauty</h3>
                        <p className="text-secondary" style={{ fontSize: '13px' }}>
                            {t('hero_subtitle')}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', color: '#86868b' }}>{t('footer_navigation')}</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                            <li style={{ marginBottom: '8px' }}><a href="/" style={{ color: '#424245', textDecoration: 'none' }}>{t('home')}</a></li>
                            <li style={{ marginBottom: '8px' }}><a href="/recherche" style={{ color: '#424245', textDecoration: 'none' }}>{t('find_pro')}</a></li>
                            <li style={{ marginBottom: '8px' }}><a href="/login" style={{ color: '#424245', textDecoration: 'none' }}>{t('footer_pro_login')}</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', color: '#86868b' }}>{t('footer_legal')}</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                            <li style={{ marginBottom: '8px' }}>
                                <span onClick={() => navigate('/mentions-legales')} style={{ color: '#424245', cursor: 'pointer' }}>{t('legal_mentions')}</span>
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <span onClick={() => navigate('/cgp')} style={{ color: '#424245', cursor: 'pointer' }}>{t('cgp')}</span>
                            </li>
                            <li style={{ marginBottom: '8px' }}><span onClick={() => navigate('/politique-confidentialite')} style={{ color: '#424245', cursor: 'pointer' }}>{t('footer_privacy')}</span></li>
                            <li style={{ marginBottom: '8px' }}><span onClick={() => navigate('/cgu')} style={{ color: '#424245', cursor: 'pointer' }}>{t('footer_terms_short')}</span></li>
                        </ul>
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid #E5E5E5',
                    paddingTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#86868b'
                }}>
                    <div>
                        Copyright © {currentYear} OpenGlow Beauty Inc. {t('footer_rights')}
                    </div>
                    <div>
                        {t('country_france')}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
