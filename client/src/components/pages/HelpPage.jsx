import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoSearch, IoCut, IoCalendar, IoCard, IoSettings, IoChatbubbles, IoChevronForward, IoPeople, IoSparkles, IoMap, IoCheckmarkCircle } from 'react-icons/io5';
import '../css/AppleDesign.css';
import { useTranslation } from 'react-i18next';

const OPEN_SUPPORT_CHAT_EVENT = 'openglow:open-support-chat';

function HelpPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const tx = (key, defaultValue) => t(key, { defaultValue });
    const storedUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    }, []);
    const [helpAudience, setHelpAudience] = useState(
        storedUser && storedUser.isClient === false ? 'professional' : 'client'
    );

    const professionalTopics = [
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

    const clientTopics = [
        {
            icon: <IoSearch size={24} color="var(--primary)" />,
            title: tx('help_client_topic_search_title', 'Trouver un professionnel'),
            desc: tx('help_client_topic_search_desc', 'Utilisez la recherche et la carte pour repérer un salon selon votre ville, votre besoin ou votre spécialité.'),
        },
        {
            icon: <IoCalendar size={24} color="var(--primary)" />,
            title: tx('help_client_topic_booking_title', 'Réserver un créneau'),
            desc: tx('help_client_topic_booking_desc', 'Choisissez une prestation, une date et une heure disponibles directement depuis la fiche du professionnel.'),
        },
        {
            icon: <IoChatbubbles size={24} color="var(--primary)" />,
            title: tx('help_client_topic_reviews_title', 'Suivre et noter mes rendez-vous'),
            desc: tx('help_client_topic_reviews_desc', 'Retrouvez vos réservations, annulez si nécessaire et laissez un avis après votre passage.'),
        },
        {
            icon: <IoCard size={24} color="var(--primary)" />,
            title: tx('help_client_topic_account_title', 'Gérer mon compte'),
            desc: tx('help_client_topic_account_desc', 'Mettez à jour vos informations personnelles, vos préférences et gardez un historique clair de vos rendez-vous.'),
        }
    ];

    const professionalFaqs = [
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

    const clientFaqs = [
        {
            q: tx('help_client_faq_1_q', 'Comment trouver un salon près de chez moi ?'),
            a: tx('help_client_faq_1_a', 'Utilisez la recherche ou la carte des professionnels. Vous pouvez filtrer par ville, nom, spécialité ou explorer les salons à proximité.'),
        },
        {
            q: tx('help_client_faq_2_q', 'Comment réserver un rendez-vous ?'),
            a: tx('help_client_faq_2_a', 'Depuis la fiche du professionnel, sélectionnez la prestation souhaitée, choisissez une date disponible, puis confirmez votre créneau.'),
        },
        {
            q: tx('help_client_faq_3_q', 'Puis-je annuler une réservation ?'),
            a: tx('help_client_faq_3_a', 'Oui. Depuis la page de vos réservations, vous pouvez consulter vos rendez-vous et annuler ceux qui ne sont plus nécessaires.'),
        },
        {
            q: tx('help_client_faq_4_q', 'Comment laisser un avis après mon rendez-vous ?'),
            a: tx('help_client_faq_4_a', 'Après votre prestation, ouvrez la fiche du professionnel ou votre historique de réservations pour publier une note et un commentaire.'),
        }
    ];

    const professionalGuideSteps = [
        {
            icon: <IoCheckmarkCircle color="var(--primary)" size={22} />,
            title: tx('help_pro_guide_step_1_title', 'Compléter votre vitrine'),
            desc: tx('help_pro_guide_step_1_desc', 'Renseignez le nom de votre établissement, votre adresse, votre description, vos horaires et votre photo pour inspirer confiance dès la première visite.'),
        },
        {
            icon: <IoCut color="var(--primary)" size={22} />,
            title: tx('help_pro_guide_step_2_title', 'Créer des prestations claires'),
            desc: tx('help_pro_guide_step_2_desc', 'Ajoutez des services avec un nom précis, une durée réaliste, un tarif lisible et une description simple pour faciliter la réservation.'),
        },
        {
            icon: <IoSparkles color="var(--primary)" size={22} />,
            title: tx('help_pro_guide_step_3_title', 'Mettre vos photos en avant'),
            desc: tx('help_pro_guide_step_3_desc', 'Publiez des images nettes de votre salon, de vos réalisations et de votre ambiance pour améliorer le taux de clic sur votre fiche.'),
        },
        {
            icon: <IoCalendar color="var(--primary)" size={22} />,
            title: tx('help_pro_guide_step_4_title', 'Tenir votre planning à jour'),
            desc: tx('help_pro_guide_step_4_desc', 'Maintenez vos disponibilités cohérentes et vérifiez régulièrement vos réservations pour éviter les créneaux erronés.'),
        },
        {
            icon: <IoPeople color="var(--primary)" size={22} />,
            title: tx('help_pro_guide_step_5_title', 'Soigner la relation client'),
            desc: tx('help_pro_guide_step_5_desc', 'Répondez vite, gardez vos informations fiables et surveillez les avis pour renforcer la confiance et fidéliser.'),
        }
    ];

    const clientGuideSteps = [
        {
            icon: <IoSearch color="var(--primary)" size={22} />,
            title: tx('help_client_guide_step_1_title', 'Chercher le bon professionnel'),
            desc: tx('help_client_guide_step_1_desc', 'Commencez par la recherche ou la carte pour comparer les salons selon la localisation, la spécialité, les photos et les avis.'),
        },
        {
            icon: <IoMap color="var(--primary)" size={22} />,
            title: tx('help_client_guide_step_2_title', 'Vérifier la fiche avant de réserver'),
            desc: tx('help_client_guide_step_2_desc', 'Consultez l’adresse, les horaires, les prestations, les tarifs et la galerie pour confirmer que le salon correspond à votre besoin.'),
        },
        {
            icon: <IoCalendar color="var(--primary)" size={22} />,
            title: tx('help_client_guide_step_3_title', 'Réserver votre créneau'),
            desc: tx('help_client_guide_step_3_desc', 'Choisissez une prestation, une date puis une heure disponible. Vérifiez les détails avant de confirmer votre rendez-vous.'),
        },
        {
            icon: <IoCard color="var(--primary)" size={22} />,
            title: tx('help_client_guide_step_4_title', 'Suivre vos rendez-vous'),
            desc: tx('help_client_guide_step_4_desc', 'Depuis votre espace, retrouvez vos réservations à venir, annulez si besoin et gardez un historique clair de vos passages.'),
        },
        {
            icon: <IoChatbubbles color="var(--primary)" size={22} />,
            title: tx('help_client_guide_step_5_title', 'Partager votre retour'),
            desc: tx('help_client_guide_step_5_desc', 'Après la prestation, laissez une note et un commentaire pour aider les autres clients et valoriser les professionnels sérieux.'),
        }
    ];

    const helpTopics = helpAudience === 'professional' ? professionalTopics : clientTopics;
    const faqs = helpAudience === 'professional' ? professionalFaqs : clientFaqs;
    const guideSteps = helpAudience === 'professional' ? professionalGuideSteps : clientGuideSteps;
    const guideTitle = helpAudience === 'professional'
        ? tx('help_pro_guide_title', 'Guide professionnel')
        : tx('help_client_guide_title', 'Guide client');
    const guideIntro = helpAudience === 'professional'
        ? tx('help_pro_guide_intro', 'Les étapes essentielles pour construire une fiche convaincante et gérer votre activité efficacement.')
        : tx('help_client_guide_intro', 'Le parcours conseillé pour trouver un salon, réserver sereinement et suivre vos rendez-vous.');

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
                    <div style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '22px' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setHelpAudience('client')}
                            style={{
                                background: helpAudience === 'client' ? 'var(--primary)' : 'white',
                                color: helpAudience === 'client' ? 'white' : 'var(--text-primary)',
                                border: helpAudience === 'client' ? '1px solid var(--primary)' : '1px solid #E5E5EA'
                            }}
                        >
                            Client
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setHelpAudience('professional')}
                            style={{
                                background: helpAudience === 'professional' ? 'var(--primary)' : 'white',
                                color: helpAudience === 'professional' ? 'white' : 'var(--text-primary)',
                                border: helpAudience === 'professional' ? '1px solid var(--primary)' : '1px solid #E5E5EA'
                            }}
                        >
                            Professionnel
                        </button>
                    </div>
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

                <div className="card" style={{ padding: '28px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <IoCheckmarkCircle color="var(--primary)" size={24} />
                        <h2 style={{ fontSize: '24px', margin: 0 }}>{guideTitle}</h2>
                    </div>
                    <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>{guideIntro}</p>

                    <div style={{ display: 'grid', gap: '14px' }}>
                        {guideSteps.map((step, index) => (
                            <div key={index} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px', borderRadius: '16px', background: '#FAFAFA', border: '1px solid #E5E5EA' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {step.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Étape {index + 1}
                                    </div>
                                    <h3 style={{ fontSize: '18px', margin: '0 0 6px 0' }}>{step.title}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
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
                    <p style={{ opacity: 0.9, marginBottom: '20px' }}>
                        {helpAudience === 'professional'
                            ? t('help_contact_desc')
                            : tx('help_contact_client_desc', 'Notre équipe peut vous aider par e-mail si vous rencontrez un blocage avec votre compte ou une réservation.')}
                    </p>
                    <button
                        className="btn"
                        style={{ background: 'white', color: 'var(--primary)', fontWeight: '600' }}
                        onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SUPPORT_CHAT_EVENT))}
                    >
                        {t('help_contact_cta')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HelpPage;
