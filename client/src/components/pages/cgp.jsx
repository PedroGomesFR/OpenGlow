import React from 'react';
import '../css/AppleDesign.css';

const CGP = () => {
    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '60px 20px' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card">
                    <h1 style={{ marginBottom: '30px', borderBottom: '1px solid #E5E5E5', paddingBottom: '20px' }}>Conditions Générales de Prestation</h1>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>1. Objet</h2>
                        <p className="text-secondary">
                            Les présentes Conditions Générales de Prestation (CGP) régissent l'utilisation de la plateforme OpenGloweauty, qui permet aux professionnels de la beauté de proposer leurs services et aux clients de réserver des prestations.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>2. Inscription et Compte Utilisateur</h2>
                        <p className="text-secondary">
                            L'inscription sur la plateforme est gratuite. Les utilisateurs s'engagent à fournir des informations exactes et à jour. Les professionnels doivent valider leur statut avant de proposer des services.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>3. Prestations et Réservations</h2>
                        <p className="text-secondary">
                            Les professionnels définissent leurs prestations avec description, durée et tarif. Les clients peuvent réserver en ligne. La confirmation est soumise à l'accord du professionnel.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>4. Tarifs et Paiements</h2>
                        <p className="text-secondary">
                            Les tarifs sont fixés par les professionnels. Les paiements s'effectuent directement entre le client et le professionnel, hors plateforme. OpenGloweauty ne perçoit aucune commission.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>5. Annulation et Modification</h2>
                        <p className="text-secondary">
                            Les annulations doivent être effectuées 24 heures à l'avance. En cas d'annulation tardive, des frais peuvent être appliqués selon la politique du professionnel.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>6. Responsabilités</h2>
                        <p className="text-secondary">
                            OpenGloweauty agit en tant qu'intermédiaire technique. Les professionnels sont responsables de la qualité de leurs services. Les clients sont responsables de leurs réservations.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>7. Données Personnelles</h2>
                        <p className="text-secondary">
                            Les données collectées sont utilisées uniquement pour le fonctionnement de la plateforme. Conformément au RGPD, les utilisateurs disposent de droits d'accès, de rectification et de suppression de leurs données.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>8. Propriété Intellectuelle</h2>
                        <p className="text-secondary">
                            Le contenu de la plateforme (code, design, logos) est protégé. Les utilisateurs conservent les droits sur leur contenu personnel.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>9. Résiliation</h2>
                        <p className="text-secondary">
                            Les utilisateurs peuvent supprimer leur compte à tout moment. OpenGloweauty se réserve le droit de suspendre un compte en cas de violation des CGP.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>10. Droit Applicable</h2>
                        <p className="text-secondary">
                            Les présentes CGP sont soumises au droit français. Tout litige sera porté devant les tribunaux compétents.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>11. Modifications</h2>
                        <p className="text-secondary">
                            OpenGloweauty se réserve le droit de modifier les CGP. Les utilisateurs seront informés des changements.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default CGP;