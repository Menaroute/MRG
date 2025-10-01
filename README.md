# MRG - Suivi Interne

Application de suivi interne pour la gestion des projets et des tâches.

## Technologies utilisées

Ce projet est construit avec :

- **Vite** - Outil de build rapide
- **TypeScript** - Langage de programmation typé
- **React** - Bibliothèque UI
- **shadcn-ui** - Composants UI modernes
- **Tailwind CSS** - Framework CSS utilitaire
- **Supabase** - Backend-as-a-Service

## Installation et développement

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/Menaroute/MRG.git

# Naviguer vers le dossier du projet
cd MRG

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:8080`

## Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire l'application pour la production
- `npm run preview` - Prévisualiser la build de production
- `npm run lint` - Lancer le linter ESLint

## Structure du projet

```
src/
├── components/     # Composants réutilisables
├── contexts/       # Contextes React
├── hooks/          # Hooks personnalisés
├── integrations/   # Intégrations externes (Supabase)
├── lib/            # Utilitaires
├── pages/          # Pages de l'application
└── types/          # Définitions TypeScript
```

## Fonctionnalités

- Authentification utilisateur
- Tableau de bord administrateur
- Gestion des clients
- Suivi des tâches et projets
- Interface responsive

## Déploiement

Pour déployer l'application :

```bash
# Construire l'application
npm run build

# Les fichiers de production seront dans le dossier 'dist'
```

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence privée.