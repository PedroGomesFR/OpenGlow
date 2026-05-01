import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoSearch, IoCut, IoCalendar, IoCard, IoSettings, IoChatbubbles, IoChevronForward } from 'react-icons/io5';
import '../css/AppleDesign.css';
import { useTranslation } from 'react-i18next';

function HelpPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const helpTopics = [
        {
            icon: <IoSettings size={24} color="var(--primary)" />,
            title: t('help_topic_profile_title'),
            desc: t('help_topic_profile_desc'),
        },
        {
            icon: <IoCut size={24} color="var(--primary)" />,
            title: t('help_topic_services_title'),
            desc: t('help_topic_services_desc'),
        },
        {
            icon: <IoCalendar size={24} color="var(--primary)" />,
            title: t('help_topic_planning_title'),
            desc: t('help_topic_planning_desc'),
        },
        {
            icon: <IoCard size={24} color="var(--primary)" />,
            title: t('help_topic_subscription_title'),
            desc: t('help_topic_subscription_desc'),
        }
    ];

    const faqs = [
        {
            q: t('help_faq_1_q'),
            a: t('help_faq_1_a')
        },
        {
            q: t('help_faq_2_q'),
            a: t('help_faq_2_a')
        },
        {
            q: t('help_faq_3_q'),
            a: t('help_faq_3_a')
        }
    ];

    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '40px 20px' }}>
            <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        background: 'transparent', border: 'none', 
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        fontSize: '15px', fontWeight: '500', marginBottom: '30px'
                    }}
                >
                    <IoArrowBack /> {t('return_btn')}
                </button>

                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '15px' }}>{t('help_title')}</h1>
                    <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
                        <IoSearch style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#86868b', fontSize: '20px' }} />
                        <input 
                            type="text" 
                            placeholder={t('help_search_placeholder')} 
                            style={{ 
                                width: '100%', padding: '16px 16px 16px 50px',
                                borderRadius: '30px', border: '1px solid transparent',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '16px',
                                outline: 'none', transition: 'box-shadow 0.2s'
                            }}
                        />
                    </div>
                </div>

                <div className="grid grid-2" style={{ gap: '20px', marginBottom: '50px' }}>
                    {helpTopics.map((topic, i) => (
                        <div key={i} className="card" style={{ display: 'flex', gap: '15px', padding: '24px', cursor: 'pointer' }}>
                            <div style={{ 
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'var(--primary-light)', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {topic.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>{topic.title}</h3>
                                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{topic.desc}</p>
                            </div>
                            <IoChevronForward color="#C7C7CC" />
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '40px' }}>
                    <div style={{ padding: '24px', background: '#FAFAFA', borderBottom: '1px solid #E5E5EA' }}>
                        <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <IoChatbubbles color="var(--primary)" /> {t('help_faq_title')}
                        </h2>
                    </div>
                    <div style={{ padding: '0 24px' }}>
                        {faqs.map((faq, i) => (
                            <div key={i} style={{ 
                                padding: '24px 0', 
                                borderBottom: i < faqs.length - 1 ? '1px solid #E5E5EA' : 'none' 
                            }}>
                                <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>{faq.q}</h4>
                                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'var(--primary)', color: 'white' }}>
                    <h2 style={{ color: 'white', margin: '0 0 10px 0' }}>{t('help_contact_title')}</h2>
                    <p style={{ opacity: 0.9, marginBottom: '20px' }}>{t('help_contact_desc')}</p>
                    <button className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: '600' }}>
                        {t('help_contact_cta')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HelpPage;
