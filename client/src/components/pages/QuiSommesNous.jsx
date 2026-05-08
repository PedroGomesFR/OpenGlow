import React from 'react';
import { useTranslation } from 'react-i18next';
import '../css/AppleDesign.css';

const QuiSommesNous = () => {
    const { t } = useTranslation();

    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '60px 20px' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card">
                    <h1 style={{ marginBottom: '10px', borderBottom: '1px solid #E5E5E5', paddingBottom: '20px' }}>
                        {t('about_title')}
                    </h1>
                    <p className="text-secondary" style={{ marginBottom: '30px', fontSize: '13px' }}>
                        {t('about_intro')}
                    </p>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>{t('about_mission_title')}</h2>
                        <p className="text-secondary">
                            {t('about_mission_text')}
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>{t('about_build_title')}</h2>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>{t('about_build_item_1')}</li>
                            <li>{t('about_build_item_2')}</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>{t('about_values_title')}</h2>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li><strong>{t('about_values_simple_label')}</strong> {t('about_values_simple_text')}</li>
                            <li><strong>{t('about_values_trust_label')}</strong> {t('about_values_trust_text')}</li>
                            <li><strong>{t('about_values_respect_label')}</strong> {t('about_values_respect_text')}</li>
                            <li><strong>{t('about_values_exigence_label')}</strong> {t('about_values_exigence_text')}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>{t('about_contact_title')}</h2>
                        <p className="text-secondary">
                            {t('about_contact_line_1')}
                            <br />
                            {t('about_contact_line_2')}
                            <br />
                            {t('about_contact_line_3')}{' '}
                            <a href="mailto:Pedrogomescamara.pro@gmail.com">Pedrogomescamara.pro@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default QuiSommesNous;
