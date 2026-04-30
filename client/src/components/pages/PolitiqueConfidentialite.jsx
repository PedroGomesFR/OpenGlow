import React from 'react';
import '../css/AppleDesign.css';

const PolitiqueConfidentialite = () => {
    return (
        <div style={{ background: '#F5F5F7', minHeight: '100vh', padding: '60px 20px' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card">
                    <h1 style={{ marginBottom: '10px', borderBottom: '1px solid #E5E5E5', paddingBottom: '20px' }}>
                        Politique de Confidentialité
                    </h1>
                    <p className="text-secondary" style={{ marginBottom: '30px', fontSize: '13px' }}>
                        Dernière mise à jour : 30 avril 2026
                    </p>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>1. Responsable du traitement</h2>
                        <p className="text-secondary">
                            Le site <strong>OpenGlow Beauty</strong> est édité par Pedro Gomes.<br />
                            Contact : <a href="mailto:Pedrogomescamara.pro@gmail.com">Pedrogomescamara.pro@gmail.com</a>
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>2. Données collectées</h2>
                        <p className="text-secondary" style={{ marginBottom: '10px' }}>
                            Dans le cadre de l'utilisation de la plateforme, nous collectons les données personnelles suivantes :
                        </p>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li><strong>Données d'identification</strong> : prénom, nom, adresse e-mail, date de naissance</li>
                            <li><strong>Données professionnelles (professionnels uniquement)</strong> : profession, nom de l'établissement, numéro SIRET, adresse de l'établissement, coordonnées géographiques</li>
                            <li><strong>Données de connexion</strong> : mot de passe (hashé avec bcrypt), jetons d'authentification</li>
                            <li><strong>Données de réservation</strong> : nom, e-mail, téléphone, dates et horaires, services choisis</li>
                            <li><strong>Photos de profil et de salon</strong> (facultatif)</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>3. Finalités du traitement</h2>
                        <p className="text-secondary" style={{ marginBottom: '10px' }}>Vos données sont utilisées pour :</p>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li>Créer et gérer votre compte utilisateur</li>
                            <li>Permettre la prise de rendez-vous entre clients et professionnels</li>
                            <li>Envoyer des confirmations et notifications par e-mail</li>
                            <li>Afficher les professionnels sur la carte et dans les résultats de recherche</li>
                            <li>Assurer la sécurité de la plateforme (vérification e-mail, CAPTCHA)</li>
                        </ul>
                        <p className="text-secondary" style={{ marginTop: '10px' }}>
                            <strong>Base légale :</strong> Exécution du contrat (art. 6.1.b RGPD) et consentement de l'utilisateur (art. 6.1.a RGPD).
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>4. Durée de conservation</h2>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li><strong>Comptes utilisateurs</strong> : conservés tant que le compte est actif. Supprimés à la demande de l'utilisateur.</li>
                            <li><strong>Comptes non vérifiés</strong> : supprimés automatiquement après 15 minutes.</li>
                            <li><strong>Données de réservation</strong> : conservées 3 ans à compter de la prestation.</li>
                            <li><strong>Journaux de connexion</strong> : conservés 12 mois maximum.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>5. Sous-traitants et services tiers</h2>
                        <p className="text-secondary" style={{ marginBottom: '10px' }}>
                            Nous faisons appel aux prestataires suivants, susceptibles de traiter vos données :
                        </p>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li><strong>Google reCAPTCHA</strong> — protection contre les bots. Données de comportement envoyées à Google. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Politique de confidentialité Google</a></li>
                            <li><strong>OpenStreetMap / Nominatim</strong> — recherche et affichage d'adresses. <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">Politique de confidentialité OSM</a></li>
                            <li><strong>MongoDB Atlas</strong> — hébergement des données (serveurs en Europe).</li>
                            <li><strong>Alwaysdata</strong> — hébergement du serveur applicatif (France).</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>6. Vos droits (RGPD)</h2>
                        <p className="text-secondary" style={{ marginBottom: '10px' }}>
                            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
                        </p>
                        <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                            <li><strong>Droit d'accès</strong> (art. 15) — obtenir une copie de vos données</li>
                            <li><strong>Droit de rectification</strong> (art. 16) — corriger vos données inexactes</li>
                            <li><strong>Droit à l'effacement</strong> (art. 17) — supprimer votre compte depuis votre espace personnel</li>
                            <li><strong>Droit à la portabilité</strong> (art. 20) — recevoir vos données dans un format structuré</li>
                            <li><strong>Droit d'opposition</strong> (art. 21) — vous opposer à un traitement de vos données</li>
                        </ul>
                        <p className="text-secondary" style={{ marginTop: '10px' }}>
                            Pour exercer ces droits, contactez-nous à : <a href="mailto:Pedrogomescamara.pro@gmail.com">Pedrogomescamara.pro@gmail.com</a>.<br />
                            Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>7. Cookies et stockage local</h2>
                        <p className="text-secondary">
                            Ce site utilise le stockage local du navigateur (<em>localStorage</em>) pour conserver votre session de connexion (jeton d'authentification). Ce stockage est strictement nécessaire au fonctionnement du service et ne requiert pas de consentement.
                        </p>
                        <p className="text-secondary" style={{ marginTop: '10px' }}>
                            Google reCAPTCHA peut déposer des cookies techniques à des fins de sécurité. En utilisant ce site, vous acceptez leur dépôt.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>8. Sécurité</h2>
                        <p className="text-secondary">
                            Nous mettons en œuvre des mesures techniques appropriées pour protéger vos données : chiffrement des mots de passe (bcrypt), communication HTTPS, authentification par jeton JWT, vérification de l'identité par e-mail.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>9. Modifications</h2>
                        <p className="text-secondary">
                            Nous nous réservons le droit de modifier cette politique. Toute modification substantielle sera notifiée par e-mail ou via une bannière sur le site.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PolitiqueConfidentialite;
