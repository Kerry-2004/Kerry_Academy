# Kerryht Academy

Plateforme e-learning de Kerry Cherestal — Django/DRF + PostgreSQL en backend, Next.js en frontend, reprenant l'identité visuelle "dark luxury" de [Kerryht.com](../Kerrht).

Ce dépôt est construit **par phases**. Cette version couvre la **Phase 1 : fondations** (authentification sécurisée, modèles de base, dashboard étudiant vide). Les phases suivantes (quiz, paiements MonCash/Stripe, certificats PDF, vidéo Cloudflare Stream, stockage R2, déploiement VPS) restent à construire — voir le plan de la session pour le détail des 9 phases.

## Structure

```
backend/    Django + DRF (API + admin)
frontend/   Next.js (App Router) + TypeScript + Tailwind
```

## Prérequis

- Python 3.11+ (testé aussi avec 3.14)
- Node.js 20+
- Docker (pour PostgreSQL en local) — ou un PostgreSQL déjà installé

## Lancer le backend

```bash
cd backend
docker-compose up -d db          # Postgres local sur le port 5432
python -m venv venv
./venv/Scripts/activate          # Windows : venv\Scripts\activate ; macOS/Linux : source venv/bin/activate
pip install -r requirements/dev.txt

cp .env.example .env             # puis renseigner SECRET_KEY et DATABASE_URL si besoin
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

L'API tourne sur `http://localhost:8000`, l'admin sur `http://localhost:8000/admin/` (thème [django-unfold](https://unfoldadmin.com/) aux couleurs de Kerryht Academy, permet d'ajouter formations/catégories/modules/leçons directement).

### Tests backend

```bash
pytest
```

## Lancer le frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Le site tourne sur `http://localhost:3000`.

## Déploiement

- **VPS (recommandé)** — [DEPLOY_VPS.md](DEPLOY_VPS.md) : tout sur un serveur Ubuntu (Nginx + Gunicorn + Next.js + PostgreSQL), vidéos servies depuis le disque avec support Range. Fichiers prêts dans `deploy/` (services systemd, config Nginx).
- **Sans VPS (alternative)** — [DEPLOY.md](DEPLOY.md) : Vercel (frontend) + Render (backend). Fichiers : `render.yaml`, `backend/build.sh`.

Les deux s'appuient sur `config/settings/prod.py` (WhiteNoise, HTTPS/HSTS, cookies configurables).

## Endpoints API (Phase 1)

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Inscription (retourne un access token + pose le cookie refresh) |
| POST | `/api/auth/login/` | Connexion |
| POST | `/api/auth/refresh/` | Rafraîchit l'access token via le cookie httpOnly |
| POST | `/api/auth/logout/` | Déconnexion, invalide le refresh token |
| GET | `/api/auth/me/` | Utilisateur courant |
| GET | `/api/courses/` | Liste des formations publiées |
| GET | `/api/courses/{slug}/` | Détail d'une formation publiée |

## Sécurité mise en place (Phase 1)

- Access token JWT court (15 min) transmis en mémoire côté client ; refresh token (7 jours) en cookie `httpOnly` + `Secure` (prod) + `SameSite=Lax`, avec rotation et blacklist.
- Throttling anti brute-force sur `login`/`register` (5 requêtes/min par IP).
- Rôles `admin` / `instructor` / `student` avec classes de permission DRF réutilisables (`apps/core/permissions.py`).
- Réglages `SECURE_*` (HSTS, cookies secure, redirection HTTPS) activés uniquement en `config/settings/prod.py`.
- CORS restreint à l'origine du frontend.

## Roadmap

1. **Phase 1 — Fondations** ✅ (ce dépôt)
2. Phase 2 — CRUD formations/modules/leçons + dashboard étudiant fonctionnel
3. Phase 3 — Moteur de quiz
4. Phase 4 — Paiements MonCash + Stripe
5. Phase 5 — Certificats PDF + QR code de vérification
6. Phase 6 — Vidéo sécurisée Cloudflare Stream
7. Phase 7 — Stockage Cloudflare R2/S3 + notifications
8. Phase 8 — Durcissement sécurité, tests, migration des dernières pages statiques
9. Phase 9 — Déploiement VPS (Nginx, Gunicorn, PostgreSQL, Certbot), CI/CD
