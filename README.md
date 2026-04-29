# OpenGlow

**OpenGlow** est une plateforme de prise de rendez-vous en ligne moderne, conçue pour connecter les clients avec des professionnels de la beauté et du bien-être. Entièrement gratuite et open-source, elle offre une alternative puissante et flexible aux solutions propriétaires.

## 🚀 Caractéristiques Principales

### Pour les Clients
- **Recherche Intelligente** : Trouvez des professionnels par service, localisation ou nom.
- **Carte Interactive** : Visualisez les prestataires autour de vous grâce à la cartographie intégrée.
- **Réservation Facile** : Consultez les disponibilités en temps réel et réservez en quelques clics.
- **Espace Personnel** : Gérez vos rendez-vous, suivez votre historique et vos préférences.

### Pour les Professionnels
- **Gestion Complète** : Créez et personnalisez votre profil professionnel.
- **Gestion des Services** : Ajoutez vos prestations avec prix, durée et descriptions.
- **Disponibilités** : Configurez vos horaires d'ouverture et jours de fermeture.
- **Gestion des RDV** : Suivi en temps réel de votre agenda, confirmations et rappels.
- **Statistiques** : Consultez vos performances et votre activité.

### Fonctionnalités Avancées
- **Système de Vérification** : Validation des emails par envoi de code SMTP pour sécuriser les comptes.
- **Gestion des Rôles** : Accès distinct pour les clients, professionnels et administrateurs.
- **Multilingue** : Support complet pour le Français, Anglais, Espagnol, Allemand, Italien, Portugais et Arabe.
- **Design Moderne** : Interface inspirée du design Apple, fluide et intuitive.

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** : Bibliothèque JavaScript pour l'interface utilisateur.
- **Vite** : Outil de build rapide et serveur de développement.
- **CSS natif** : Styles purs sans frameworks lourds pour une performance optimale.

### Backend
- **Node.js** : Environnement d'exécution JavaScript côté serveur.
- **Express.js** : Framework web pour la gestion des routes et API.
- **MongoDB** : Base de données NoSQL pour le stockage des données.
- **JWT (JSON Web Tokens)** : Authentification sécurisée des utilisateurs.

## 📂 Structure du Projet

```
OpenGlow
├── client/          # Application Frontend (React)
├── server/          # API Backend (Node.js/Express)
└── README.md        # Documentation du projet
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v16 ou supérieur)
- npm (généralement installé avec Node.js)
- MongoDB (local ou service cloud comme MongoDB Atlas)

### 1. Backend

```bash
# Naviguer vers le dossier du serveur
cd server

# Installer les dépendances
npm install

# Créer un fichier .env à partir du modèle
cp .env.example .env

# Configurer les variables d'environnement dans .env
# (PORT, MONGODB_URI, JWT_SECRET, SMTP_...)

# Lancer le serveur
npm start
```

### 2. Frontend

```bash
# Naviguer vers le dossier du client
cd client

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le serveur de développement démarrera généralement sur `http://localhost:5173`.

## 📧 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub.
