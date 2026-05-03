import React from 'react';
import '../css/AppleDesign.css';

const MentionsLegales = () => {
    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '60px 20px' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card">
                    <h1 style={{ marginBottom: '30px', borderBottom: '1px solid #E5E5E5', paddingBottom: '20px' }}>Mentions Légales</h1>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>1. Édition du site</h2>
                        <p className="text-secondary">
                            Le site <strong>OpenGlow Beauty</strong> est un service en ligne accessible au public, destiné à la mise en relation entre utilisateurs et professionnels de la beauté.
                        </p>
                        <p className="text-secondary">
                            <strong>Propriétaire :</strong> Pedro Gomes<br />
                            <strong>Contact :</strong> Pedrogomescamara.pro@gmail.com<br />
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>2. Hébergement</h2>
                        <p className="text-secondary">
                            Ce site est hébergé sur une infrastructure de production permettant son accès en ligne au public.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>3. Propriété intellectuelle</h2>
                        <p className="text-secondary">
                            L'ensemble du code source a été développé par Pedro Gomes. Les images et icônes sont utilisées à des fins d'illustration (Lucide React, Unsplash).
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>4. Données personnelles</h2>
                        <p className="text-secondary">
                            Ce site collecte les données strictement nécessaires au fonctionnement du service (création de compte, gestion des réservations et du profil utilisateur). Aucune donnée n'est revendue ou partagée avec des tiers en dehors des obligations légales et techniques.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default MentionsLegales;
