# Wishlist de cadeaux

Application Next.js 14 (App Router) avec Tailwind CSS et Prisma/SQLite. La page publique affiche la liste des cadeaux en lecture seule, un espace admin protège le CRUD via une session `iron-session` (identifiants dans `.env.local`).

## Prérequis
- Node.js 18+
- npm

## Installation
```bash
npm install
```

## Démarrage rapide (DEV)
```bash
npm run bootstrap:dev          # génère .env.local + mot de passe admin + secret session
npm run prisma:init            # initialise dev.db via Prisma (wrapper qui charge .env.local)
npm run dev                    # lance l'appli
```
- Login admin : `admin` / mot de passe affiché lors du bootstrap (gardez-le en mémoire). En dev, un mot de passe en clair est accepté et hashé en mémoire au démarrage.
- En dev, vous pouvez vérifier la configuration via `/api/_debug/env` (retourne des booléens uniquement).
- Prisma CLI ne lit pas `.env.local` directement : un wrapper (`scripts/run-prisma.js`) charge `.env.local` et un fichier `prisma/.env` (généré au bootstrap) contenant uniquement `DATABASE_URL`.

## Configuration `.env.local`
Copiez le fichier d’exemple puis renseignez vos valeurs :
```bash
cp .env.example .env.local
```

Variables nécessaires :
- `DATABASE_URL` : chemin SQLite (`file:./dev.db` par défaut).
- `ADMIN_USERNAME` : identifiant admin.
- DEV : `ADMIN_PASSWORD` (plain, >=8 caractères) ou `ADMIN_PASSWORD_HASH` (bcrypt). Le bootstrap met `ADMIN_PASSWORD` automatiquement.
- PROD : utiliser `ADMIN_PASSWORD_HASH` (bcrypt) généré via `npm run hash:password -- "motDePasse"`. Ne laissez pas `ADMIN_PASSWORD` en production.
- `SESSION_PASSWORD` : secret long (32+ caractères) pour chiffrer la session.
- `MICROLINK_API_KEY` : optionnel, améliore l’auto-remplissage quand un site bloque le scraping.
- `ENABLE_PLAYWRIGHT_PREVIEW` : optionnel, mettre `true` pour activer le fallback headless Playwright sur les sites qui renvoient 403/JS-only.
- `SCRAPER_API_KEY` : optionnel, proxy anti-bot (ScraperAPI ou équivalent) utilisé avant le headless.
- `SERPER_API_KEY` : optionnel, utilise serper.dev comme fallback supplémentaire pour récupérer titre/description/images.

### Exemple `.env.local`
> Placez ce fichier **à la racine du projet (même niveau que package.json)** et ne le commitez pas.
```
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="votre_hash_bcrypt"
SESSION_PASSWORD="votre_secret_ultra_long_de_32_caracteres_ou_plus"
```
> Astuce : vous pouvez générer un environnement de dev complet avec `npm run bootstrap:dev` (recommandé pour démarrer vite).

### Générer le hash bcrypt (prod)
```bash
npm run hash:password -- "votreMotDePasse"
# copie le résultat dans ADMIN_PASSWORD_HASH de .env.local
```

## Base de données
Initialisez Prisma et la base locale :
```bash
npm run prisma:init
```
Autres commandes utiles :
- `npm run prisma:migrate` : applique les migrations en cours (charge .env.local via wrapper).
- `npm run prisma:generate` : régénère le client Prisma.
- `npm run prisma:studio` : ouvre Prisma Studio (CRUD visuel).

## Lancer le serveur
```bash
npm run dev
# http://localhost:3000
```

## Authentification admin
- Login sur `/admin/login` avec `ADMIN_USERNAME` + mot de passe associé au `ADMIN_PASSWORD_HASH`.
- La session est stockée dans un cookie signé via `iron-session`.

## API
- `GET /api/gifts` : liste publique triée par date de création décroissante.
- `POST /api/gifts` : création (admin).
- `PUT /api/gifts/:id` : mise à jour (admin).
- `DELETE /api/gifts/:id` : suppression (admin).
- `POST /api/preview` : (admin) auto-remplissage depuis une URL publique (Open Graph / Twitter / JSON-LD), protégé contre SSRF.

## Pages publiques
- `/` : liste complète des cadeaux (lecture seule) avec liens externes si fournis.
- `/gifts/[id]` : fiche détail d’un cadeau (publique), avec bouton “Voir le lien” si présent et navigation retour.
- Espace admin sur `/admin` et `/admin/login` pour gérer le CRUD.

## Dépannage : Prisma / DATABASE_URL manquant
Checklist :
- `.env.local` bien situé à la racine (même niveau que `package.json`), puis redémarrer `npm run dev` après modification.
- Vérifier la config via l’endpoint dev-only `/api/_debug/env` (retourne uniquement des booléens).
- Vérifier avec le script local :
  ```bash
  npm run check:env
  ```
- Commandes utiles en cas de doute :
  ```bash
  npm run hash:password -- "motDePasse"
  npm run prisma:migrate -- --name init
  npm run dev
  ```
- Démarrage express en dev (génère .env.local et mots de passe) :
  ```bash
  npm run bootstrap:dev
  npm run prisma:init
  npm run dev
  ```

### Si `ADMIN_PASSWORD_HASH` est un placeholder
- Régénérez l'env : `npm run bootstrap:dev:force`
- Vérifiez les chemins/chargement : `npm run debug:env:paths`
- Vérifiez les clés chargées : `npm run debug:env:keys`
- Relancez : `rm -rf .next && npm run dev`
- En dev, contrôlez `/api/_debug/env` (les clés doivent être à `true` et `adminHashLooksBcrypt` à `true`).
- Si monorepo, assurez-vous que `.env.local` est au même niveau que le `package.json` de cette app Next.

## Auto-remplissage depuis une URL (admin)
- Ajoutez un lien dans le formulaire puis cliquez sur “Auto-remplir ✨” pour récupérer titre/description/prix/images via Open Graph / Twitter / JSON-LD.
- Si le site bloque (403/401/429) ou est JS-only, fallback Microlink (configure `MICROLINK_API_KEY` pour plus de compatibilité).
- Pour certains sites (Fnac, Galeries Lafayette), un provider dédié est utilisé. Si la page bloque le scraping, un fallback headless Playwright peut être activé avec `ENABLE_PLAYWRIGHT_PREVIEW=true` (dépendance `playwright`).
- Possibilité d’utiliser un proxy anti-bot (`SCRAPER_API_KEY` avec ScraperAPI, etc.) pour augmenter la compatibilité avant le headless.
- serper.dev (`SERPER_API_KEY`) est utilisé en ultime recours pour essayer de récupérer titre/description/images via les résultats enrichis.
- Protection SSRF : URLs http/https uniquement, blocage IP privées/localhost et limite de taille/temps de la réponse.
- Si rien n’est trouvé, les champs restent vides; vous pouvez saisir manuellement.

## Test manuel rapide
1) `npm run dev`
2) `/admin/login` → admin + mot de passe généré par `bootstrap:dev`
3) Ajouter un cadeau (optionnel: auto-remplir avec un lien) → vérifier qu’il apparaît sur `/` et sur `/gifts/{id}` (description, prix, images si présents).

## Développement
- `npm run lint` pour les vérifications ESLint.
- Styles via Tailwind (`tailwind.config.ts`), composants dans `src/components`.
