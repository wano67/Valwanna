# Wishlist de cadeaux

Application Next.js 14 (App Router) avec Tailwind CSS et Prisma/PostgreSQL. La page publique affiche la liste des cadeaux en lecture seule, et un espace admin protège le CRUD via une session `iron-session`.

## Prérequis
- Node.js 18+
- npm
- PostgreSQL accessible (local ou géré par Railway). Exemple Docker local :
  ```bash
  docker run --name valwanna-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=valwanna -p 5432:5432 -d postgres:16
  ```

## Installation
```bash
npm install
```

## Démarrage rapide (DEV PostgreSQL)
```bash
# Assurez-vous qu'un PostgreSQL tourne et que DATABASE_URL le pointe.
npm run bootstrap:dev          # génère .env.local + mot de passe admin + secret session (PostgreSQL)
npm run prisma:migrate         # applique les migrations sur la base indiquée par DATABASE_URL
npm run dev                    # lance l'appli
```
- Login admin : `admin` / mot de passe affiché lors du bootstrap (gardez-le). En dev, un mot de passe en clair est accepté et hashé en mémoire au démarrage.
- En dev, vous pouvez vérifier la configuration via `/api/_debug/env` (retourne des booléens uniquement).
- Prisma CLI ne lit pas `.env.local` directement : le wrapper `scripts/run-prisma.js` charge `.env.local` ou `prisma/.env` uniquement en dev si `DATABASE_URL` n'est pas déjà défini, sinon il utilise `process.env`.

## Configuration `.env.local`
Copiez l’exemple puis renseignez vos valeurs :
```bash
cp .env.example .env.local
```

Variables nécessaires :
- `DATABASE_URL` : URL PostgreSQL, ex: `postgresql://user:password@host:5432/valwanna?schema=public`.
- `ADMIN_USERNAME` : identifiant admin.
- DEV : `ADMIN_PASSWORD` (plain, >=8 caractères) ou `ADMIN_PASSWORD_HASH` (bcrypt). Le bootstrap met `ADMIN_PASSWORD` automatiquement.
- PROD : exiger `ADMIN_PASSWORD_HASH` (bcrypt) généré via `npm run hash:password -- "motDePasse"`. `ADMIN_PASSWORD` est refusé en production (sauf si vous forcez localement avec `ALLOW_PLAINTEXT_ADMIN=true`, à ne pas déployer).
- Si vous stockez le hash dans un fichier `.env*`, évitez l'expansion des `$` : utilisez `ADMIN_PASSWORD_HASH_B64` (hash encodé base64) ou échappez les `$`. Dans Railway, saisissez directement `ADMIN_PASSWORD_HASH` (pas besoin d'échappement).
- `SESSION_PASSWORD` : secret long (32+ caractères) pour chiffrer la session.
- `MICROLINK_API_KEY` : optionnel, améliore l’auto-remplissage quand un site bloque le scraping.
- `ENABLE_PLAYWRIGHT_PREVIEW` : optionnel, laissez `false` en prod (évite le headless Playwright). Activez seulement si nécessaire.

### Exemple `.env.local`
> Placez ce fichier **à la racine du projet (même niveau que package.json)** et ne le commitez pas.
```
DATABASE_URL="postgresql://user:password@host:5432/valwanna?schema=public"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="votre_hash_bcrypt"
SESSION_PASSWORD="votre_secret_ultra_long_de_32_caracteres_ou_plus"
MICROLINK_API_KEY=""
ENABLE_PLAYWRIGHT_PREVIEW=false
```
> Astuce : vous pouvez générer un environnement de dev complet avec `npm run bootstrap:dev` (PostgreSQL requis).

### Générer les secrets
- Hash bcrypt : `npm run hash:password -- "votreMotDePasse"`
- Secret de session : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Base de données & Prisma
- Migrations PostgreSQL dans `prisma/migrations/`. Les anciennes migrations SQLite ont été déplacées dans `prisma/migrations_sqlite_backup` (données non migrées automatiquement).
- `prisma/.env` est utilisé uniquement par Prisma CLI en local (mettre une URL Postgres locale). En production (Railway), Prisma lit directement `process.env.DATABASE_URL` et n’a pas besoin de fichier.
- Commandes utiles :
  - `npm run prisma:migrate` : migrations en dev (charge .env.local).
  - `npm run prisma:migrate:deploy` : migrations en prod (utilise process.env).
  - `npm run prisma:generate` : régénère le client Prisma (exécuté en postinstall).
  - `npm run prisma:studio` : ouvre Prisma Studio (CRUD visuel).

### Initialiser les migrations Postgres (local)
1. Démarrer un Postgres local (ex: Docker ci-dessus) et placer son URL dans `.env.local` ou `prisma/.env`.
2. Lancer `npm run prisma:init` (wrappe `prisma migrate dev --name init` et charge les env locaux).
3. Vérifier que la migration `20260107000000_init` est appliquée.

## Déployer sur Railway
1. Créez un service PostgreSQL sur Railway et récupérez son `DATABASE_URL` (format PostgreSQL).
2. Dans le service Valwanna, référencez ce `DATABASE_URL` (ex: `DATABASE_URL=${{postgres-thvd.DATABASE_URL}}`).
3. Ajoutez les variables d’env ci-dessous (section “Variables Railway”).
4. Dans Railway, configurez la **Deploy/Build command** sur :  
   `npm run prisma:migrate:deploy && npm run build`  
   (assure les migrations avant le build).
   (ou utilisez le script helper : `npm run railway:build`).
5. **Start command** : `npm run start` (ce script lance aussi `prisma migrate deploy` au démarrage par sécurité).
6. Déployez. Si vous aviez des données SQLite locales, migrez-les manuellement (export/import) avant de couper l’ancien environnement.

### Variables Railway (checklist)
- `DATABASE_URL` : chaîne PostgreSQL Railway.
- `ADMIN_USERNAME` : ex: `admin`.
- `ADMIN_PASSWORD_HASH` : hash bcrypt (obligatoire en prod). Option : `ADMIN_PASSWORD_HASH_B64` si vous préférez l'encodage base64.
- `SESSION_PASSWORD` : ≥32 caractères (voir commande ci-dessus).
- `MICROLINK_API_KEY` : optionnel.
- `ENABLE_PLAYWRIGHT_PREVIEW` : `false` recommandé en prod.
- (Supprimez `ADMIN_PASSWORD`, `SCRAPER_API_KEY`, `SERPER_API_KEY` si non utilisés.)

## Migration depuis SQLite
- Les anciennes migrations sont sauvegardées dans `prisma/migrations_sqlite_backup` ; elles ne s’appliquent pas à PostgreSQL.
- Aucune migration automatique des données SQLite vers PostgreSQL n’est fournie. Exportez/importez manuellement si nécessaire.

## Authentification admin
- Login sur `/admin/login` avec `ADMIN_USERNAME` + mot de passe associé au `ADMIN_PASSWORD_HASH` (ou `ADMIN_PASSWORD` uniquement en dev).
- La session est stockée dans un cookie signé via `iron-session`.

## API
- `GET /api/gifts` : liste publique triée par date de création décroissante.
- `POST /api/gifts` : création (admin).
- `PUT /api/gifts/:id` : mise à jour (admin).
- `DELETE /api/gifts/:id` : suppression (admin).
- `POST /api/preview` : (admin) auto-remplissage depuis une URL publique (Open Graph / Twitter / JSON-LD), protégé contre SSRF.

## Pages publiques
- `/` : liste complète des cadeaux (lecture seule) avec liens externes si fournis.
- `/gifts/[id]` : fiche détail d’un cadeau (publique).
- Espace admin sur `/admin` et `/admin/login` pour gérer le CRUD.

## Dépannage rapide
- `.env.local` à la racine, Postgres démarré, puis `npm run prisma:migrate`.
- Vérifier la config via `/api/_debug/env` (dev) ou `npm run check:env`.
- Commandes utiles : `npm run hash:password -- "motDePasse"`, `npm run prisma:migrate -- --name init`, `npm run dev`.

## Développement
- `npm run lint` pour les vérifications ESLint.
- Styles via Tailwind (`tailwind.config.ts`), composants dans `src/components`.
