import { useNavigate } from 'react-router-dom';
import { IoArrowBack, IoSearch, IoCut, IoCalendar, IoCard, IoSettings, IoChatbubbles, IoChevronForward } from 'react-icons/io5';
import '../css/AppleDesign.css';

function HelpPage() {
    const navigate = useNavigate();

    const helpTopics = [
        {
            icon: <IoSettings size={24} color="var(--primary)" />,
            title: "Configurer mon profil",
            desc: "Apprenez à mettre en valeur votre salon avec des photos, adresses, et informations d'ouverture.",
        },
        {
            icon: <IoCut size={24} color="var(--primary)" />,
            title: "Gérer mes prestations",
            desc: "Ajouter, modifier ou désactiver les prestations disponibles pour vos clients.",
        },
        {
            icon: <IoCalendar size={24} color="var(--primary)" />,
            title: "Mon Planning & Réservations",
            desc: "Comprendre où consulter vos prochains rendez-vous et comment les valider.",
        },
        {
            icon: <IoCard size={24} color="var(--primary)" />,
            title: "Abonnement professionnel",
            desc: "Obtenez de l'aide concernant le passage à la version premium (facturation et avantages).",
        }
    ];

    const faqs = [
        {
            q: "J'ai oublié mon mot de passe, comment le réinitialiser ?",
            a: "Actuellement, veuillez contacter le support directement avec votre adresse e-mail professionnelle pour demander une réinitialisation manuelle."
        },
        {
            q: "Les clients peuvent-ils réserver sans mon accord ?",
            a: "Par défaut, les clients peuvent réserver les créneaux disponibles. Vous serez notifié. Une option d'approbation manuelle arrivera prochainement."
        },
        {
            q: "Comment supprimer une photo de mon salon ?",
            a: "Dans la version actuelle, vous pouvez téléverser de nouvelles photos. Pour archiver des anciennes, rendez-vous dans la console d'administration MyPlanning."
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
                    <IoArrowBack /> Retour
                </button>

                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '15px' }}>Bonjour, comment pouvons-nous aider ?</h1>
                    <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
                        <IoSearch style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#86868b', fontSize: '20px' }} />
                        <input 
                            type="text" 
                            placeholder="Rechercher une question ou un thème..." 
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
                            <IoChatbubbles color="var(--primary)" /> Questions fréquentes (FAQ)
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
                    <h2 style={{ color: 'white', margin: '0 0 10px 0' }}>Vous ne trouvez pas votre réponse ?</h2>
                    <p style={{ opacity: 0.9, marginBottom: '20px' }}>Notre équipe support professionnel est disponible par e-mail.</p>
                    <button className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: '600' }}>
                        Contacter le support
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HelpPage;
