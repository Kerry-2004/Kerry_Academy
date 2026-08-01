# Déploiement — Vercel (frontend) + Render (backend) + domaine Hostinger

Ce guide déploie Kerryht Academy sans VPS :

- **Backend Django + PostgreSQL** → **Render** (offre gratuite)
- **Frontend Next.js** → **Vercel** (offre gratuite)
- **Domaine** (acheté chez Hostinger) → pointé vers Vercel et Render via les réglages DNS de Hostinger.

> ⚠️ **À lire avant de commencer — limites des offres gratuites**
> - Le service Render gratuit **s'endort** après ~15 min d'inactivité : le premier accès après une pause prend 30–60 s à réveiller.
> - Le disque de Render gratuit est **éphémère** : les fichiers **uploadés** (vidéos, images de cours, images CKEditor) **sont effacés à chaque redéploiement**. Le texte, les quiz, les comptes (en base PostgreSQL) sont conservés ; **seuls les fichiers média** disparaissent.
>   → Pour héberger les vidéos durablement, il faudra passer au **stockage objet Cloudflare R2 / S3** (Phase 7 de la feuille de route) ou à un plan Render payant avec disque persistant. On peut déployer maintenant et ajouter ça ensuite.

---

## 0. Prérequis

- Un compte **GitHub** (Render et Vercel déploient depuis un dépôt Git).
- Un compte **Render** (render.com) et un compte **Vercel** (vercel.com) — connexion via GitHub possible.
- Ton **domaine** déjà acheté chez Hostinger.

---

## 1. Mettre le code sur GitHub

Depuis le dossier `Kerryht-Academy` :

```bash
git init
git add .
git commit -m "Kerryht Academy"
```

Crée un dépôt vide sur GitHub (ex. `kerryht-academy`), puis :

```bash
git remote add origin https://github.com/<ton-user>/kerryht-academy.git
git branch -M main
git push -u origin main
```

> Les fichiers sensibles (`.env`, `db.sqlite3`, `node_modules`, `media/`, `venv/`) sont déjà exclus par les `.gitignore` — ils ne partiront pas sur GitHub.

---

## 2. Backend sur Render

### 2.1 Créer le service via le Blueprint

1. Sur Render → **New** → **Blueprint**.
2. Connecte ton dépôt GitHub. Render détecte le fichier `render.yaml` à la racine et propose de créer :
   - une base **PostgreSQL** (`kerryht-db`),
   - un service web **kerryht-backend**.
3. Valide. Render lance le build (`bash build.sh` : installe les dépendances, `collectstatic`, `migrate`).

### 2.2 Renseigner les variables d'environnement

Dans le service **kerryht-backend** → **Environment**, complète les variables laissées vides (`sync: false`). Au premier déploiement tu ne connais pas encore le domaine final — mets d'abord l'URL Render, tu ajusteras après l'étape domaine :

| Variable | Valeur (exemple) |
|---|---|
| `ALLOWED_HOSTS` | `kerryht-backend.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://<ton-projet>.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://<ton-projet>.vercel.app` |

`SECRET_KEY`, `DATABASE_URL`, `DJANGO_SETTINGS_MODULE`, `DEBUG`, `REFRESH_COOKIE_SAMESITE` sont déjà réglés par le Blueprint. Enregistre → Render redéploie.

### 2.3 Créer le compte administrateur

Service Render → onglet **Shell** :

```bash
python manage.py createsuperuser
```

L'admin sera accessible sur `https://kerryht-backend.onrender.com/admin/`.

> **Note version Python** : le Blueprint fixe `PYTHON_VERSION=3.12.7`. Si Render refuse cette version précise, mets une autre 3.12.x proposée par Render.

---

## 3. Frontend sur Vercel

1. Sur Vercel → **Add New** → **Project** → importe le même dépôt GitHub.
2. **Root Directory** : sélectionne `frontend`.
3. Framework : Next.js (détecté automatiquement). Build/Output par défaut.
4. **Environment Variables** → ajoute :
   - `NEXT_PUBLIC_API_URL` = `https://kerryht-backend.onrender.com` (l'URL Render de l'étape 2 ; tu la remplaceras par `https://api.tondomaine.com` après l'étape 4).
5. **Deploy**. Vercel fournit une URL `https://<ton-projet>.vercel.app`.

Vérifie que le site s'ouvre. (Le premier chargement des cours peut être lent si Render dort — c'est normal.)

---

## 4. Brancher ton domaine Hostinger

On va faire pointer :
- `tondomaine.com` + `www` → **Vercel** (le site)
- `api.tondomaine.com` → **Render** (l'API)

### 4.1 Côté Vercel (site)

1. Projet Vercel → **Settings** → **Domains** → ajoute `tondomaine.com` (et `www.tondomaine.com`).
2. Vercel affiche les enregistrements DNS à créer (un `A` pour l'apex et/ou un `CNAME` pour `www`).

### 4.2 Côté Render (API)

1. Service Render → **Settings** → **Custom Domains** → ajoute `api.tondomaine.com`.
2. Render affiche un `CNAME` cible (ex. `kerryht-backend.onrender.com`).

### 4.3 Côté Hostinger (DNS)

Dans hPanel Hostinger → **Domaines** → **DNS / Zone DNS**, crée les enregistrements indiqués par Vercel et Render :

| Type | Nom | Valeur | Fourni par |
|---|---|---|---|
| `A` | `@` | (IP donnée par Vercel) | Vercel |
| `CNAME` | `www` | (cible donnée par Vercel) | Vercel |
| `CNAME` | `api` | `kerryht-backend.onrender.com` | Render |

La propagation DNS prend de quelques minutes à quelques heures. Vercel et Render émettent automatiquement les certificats **HTTPS** une fois le DNS validé.

### 4.4 Mettre à jour les variables avec le vrai domaine

Une fois `api.tondomaine.com` et `tondomaine.com` actifs :

- **Render** (`kerryht-backend`) :
  - `ALLOWED_HOSTS` = `api.tondomaine.com,kerryht-backend.onrender.com`
  - `CORS_ALLOWED_ORIGINS` = `https://tondomaine.com,https://www.tondomaine.com`
  - `CSRF_TRUSTED_ORIGINS` = `https://tondomaine.com,https://www.tondomaine.com`
- **Vercel** :
  - `NEXT_PUBLIC_API_URL` = `https://api.tondomaine.com` → puis **Redeploy** le projet Vercel (les variables `NEXT_PUBLIC_*` sont intégrées au build).

---

## 5. (Optionnel) Reprendre les données de développement

Les cours/leçons créés en local sont dans `db.sqlite3` et ne partent pas sur Render. Deux options :

- **Le plus simple** : recréer les cours via l'admin de production (`https://api.tondomaine.com/admin/`). Recommandé, car les **fichiers média** (vidéos/images) doivent de toute façon être ré-uploadés.
- **Export/import** (structure seulement, sans les fichiers) : en local
  ```bash
  python manage.py dumpdata --natural-foreign --natural-primary \
    -e contenttypes -e auth.permission -e admin.logentry -e sessions \
    -e token_blacklist > data.json
  ```
  puis charger `data.json` sur Render via le Shell (`python manage.py loaddata data.json`). Les vidéos/images resteront à ré-uploader.

---

## 6. Vérification finale

- [ ] `https://tondomaine.com` affiche l'accueil.
- [ ] `https://api.tondomaine.com/admin/` ouvre l'admin et la connexion fonctionne.
- [ ] Création d'un compte étudiant depuis le site → connexion → tableau de bord.
- [ ] Une formation créée dans l'admin apparaît sur `/courses`.
- [ ] Un quiz se lance et donne une note.

---

## 7. Prochaines étapes conseillées

1. **Stockage vidéo durable** (Cloudflare R2 / S3) pour que les vidéos survivent aux redéploiements — les variables `CLOUDFLARE_R2_*` sont déjà prévues dans les réglages.
2. **Paiements** MonCash + Stripe (Phase 4) avant d'ouvrir les inscriptions payantes.
3. Passer Render/Vercel à une petite formule payante quand le trafic augmente (fin de la mise en veille).
