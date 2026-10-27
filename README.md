# Khidmatul Khadim — Next.js (Vercel) + NestJS (Render) + Supabase

```
apps/web   Next.js 14 PWA  -> Vercel
apps/api   NestJS + Prisma -> Render
Supabase   Postgres
```
Le navigateur parle seulement à Next.js. Les pages et actions serveur appellent l'API NestJS avec le jeton d'invitation du membre (cookie httpOnly -> `Authorization: Bearer`). L'API n'a donc pas besoin de CORS.

## 1. Supabase
Project Settings > Database > Connection string. Récupère deux URLs :
- `DATABASE_URL` : **Transaction pooler** (port 6543), ajoute `?pgbouncer=true`
- `DIRECT_URL` : **Session pooler** (port 5432). Sur Render, utilise le pooler (IPv4) et pas la connexion directe (IPv6).

## 2. Render (API)
New > Blueprint, pointe sur ce dépôt (`render.yaml`), ou crée un Web Service avec Root Directory `apps/api` et les mêmes commandes.
Variables : `DATABASE_URL`, `DIRECT_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT` (ex. ton email).
Au démarrage, `prisma db push` crée les tables. Test : `https://TON-API.onrender.com/health`.
Le plan gratuit s'endort après inactivité : la première requête peut prendre 30 à 60 s.

## 3. Données de départ
En local, avec `apps/api/.env` rempli avec les URLs Supabase :
```
cd apps/api && npm install && npx prisma db push && npm run seed
```
Le seed affiche des liens `localhost`. Les vrais liens d'invitation sont dans l'onglet **Membres** de l'app (`https://TON-SITE.vercel.app/join/...`).

## 4. Vercel (web)
Import du dépôt, **Root Directory = `apps/web`**. Variables :
- `API_URL` = `https://TON-API.onrender.com` (sans `/` final)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = la même clé publique que `VAPID_PUBLIC_KEY`

## En local
```
cd apps/api && npm install && npm run dev     # http://localhost:3001
cd apps/web && npm install && npm run dev     # http://localhost:3000
```

## API
Membre : `GET /me`, `GET /cycle`, `PATCH /statuses/:id`, `POST /push`, `GET /auth/join/:token` (public).
Admin : `GET /admin/overview`, `GET|POST /admin/members`, `POST /admin/cycles`, `POST /admin/remind`, `POST /admin/assignments`.

## Fonctions ajoutées

- Admin : modifier un membre (nom, téléphone, admin) et ses juz, marquer un juz terminé pour quelqu'un, réinitialiser un juz ou toute la semaine.
- Boutons instantanés (mise à jour locale puis envoi en arrière-plan).
- Hors ligne : l'app s'ouvre sans réseau, les actions sont gardées et envoyées au retour de la connexion.
- Thème Touba : mosquée dont les fenêtres s'allument avec l'avancement, messages et confettis.
