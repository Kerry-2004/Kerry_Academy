# Déploiement sur VPS Hostinger (KVM 2) — sous-domaine school.kerryht.com

Kerryht Academy est déployée sur le sous-domaine **`school.kerryht.com`** (le domaine
principal `kerryht.com` reste votre portfolio). Tout tourne sur un seul serveur Ubuntu :

- **Nginx** — reverse proxy + HTTPS ; route tout sur `school.kerryht.com` :
  - `/` → Next.js (frontend)
  - `/api`, `/admin`, `/ckeditor5` → Django
  - `/static`, `/media` (vidéos) → servis directement par Nginx (avec Range)
- **Django + Gunicorn** (backend/API/admin)
- **Next.js** (frontend)
- **PostgreSQL** (base de données)
- Les **vidéos** sont stockées sur le disque NVMe (100 Go) — parfait pour < 100 utilisateurs.

> Remplacez `deploy` par votre utilisateur Linux et les mots de passe par les vôtres.
> Comme tout est sur le même sous-domaine, l'authentification par cookie est simple
> (même origine) et il n'y a pas de complications CORS.

---

## 1. DNS — ajouter le sous-domaine

Dans la zone DNS de `kerryht.com` (chez Hostinger : hPanel → **Domaines** → `kerryht.com`
→ **DNS / Zone DNS**), ajoutez **un seul** enregistrement `A` vers l'**IP de votre VPS** :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `school` | IP_DU_VPS |

> N'y touchez pas au reste : votre portfolio `kerryht.com` / `www` n'est pas affecté.
> La propagation prend quelques minutes à quelques heures.

---

## 2. Préparer le serveur

Connectez-vous (terminal du navigateur Hostinger = le plus simple). Vous êtes `root`.
Créez un utilisateur de travail :

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

Installez les paquets :

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-dev build-essential \
    postgresql nginx git curl

# Node.js 20 LTS (pour Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Base de données PostgreSQL

```bash
sudo -u postgres psql
```

Dans l'invite `psql` :

```sql
CREATE DATABASE kerryht_academy;
CREATE USER kerryht WITH PASSWORD 'MOT_DE_PASSE_DB';
ALTER ROLE kerryht SET client_encoding TO 'utf8';
ALTER ROLE kerryht SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE kerryht_academy TO kerryht;
\c kerryht_academy
GRANT ALL ON SCHEMA public TO kerryht;
\q
```

---

## 4. Récupérer le code

```bash
cd ~
git clone https://github.com/Kerry-2004/Kerry_Academy.git kerryht-academy
cd kerryht-academy
```

---

## 5. Backend (Django)

```bash
cd ~/kerryht-academy/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements/prod.txt
```

Créez le fichier `backend/.env` :

```bash
nano .env
```

Contenu (adaptez le mot de passe DB et la clé secrète) :

```
SECRET_KEY=REMPLACEZ_PAR_UNE_CLE_ALEATOIRE
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.prod
ALLOWED_HOSTS=school.kerryht.com
DATABASE_URL=postgres://kerryht:MOT_DE_PASSE_DB@localhost:5432/kerryht_academy
CORS_ALLOWED_ORIGINS=https://school.kerryht.com
CSRF_TRUSTED_ORIGINS=https://school.kerryht.com
REFRESH_COOKIE_SAMESITE=Lax
```

> Générer une clé secrète : `python -c "import secrets; print(secrets.token_urlsafe(64))"`

Migrations, fichiers statiques, compte admin :

```bash
python manage.py migrate
python manage.py collectstatic --no-input
python manage.py createsuperuser
deactivate
```

---

## 6. Frontend (Next.js)

```bash
cd ~/kerryht-academy/frontend
npm ci
NEXT_PUBLIC_API_URL=https://school.kerryht.com npm run build
```

> `NEXT_PUBLIC_API_URL` est intégré **au moment du build**. Après un changement, rebuild.

---

## 7. Services systemd (démarrage auto + redémarrage)

```bash
sudo cp ~/kerryht-academy/deploy/kerryht-backend.service /etc/systemd/system/
sudo cp ~/kerryht-academy/deploy/kerryht-frontend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now kerryht-backend
sudo systemctl enable --now kerryht-frontend

sudo systemctl status kerryht-backend
sudo systemctl status kerryht-frontend
```

---

## 8. Nginx

Autorisez Nginx (www-data) à traverser le dossier personnel :

```bash
chmod 755 /home/deploy
```

Installez la configuration :

```bash
sudo cp ~/kerryht-academy/deploy/nginx-kerryht.conf /etc/nginx/sites-available/kerryht
sudo ln -s /etc/nginx/sites-available/kerryht /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

À ce stade, `http://school.kerryht.com` doit répondre (une fois le DNS propagé).

---

## 9. HTTPS (Let's Encrypt / Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d school.kerryht.com
```

Certbot obtient le certificat, ajoute le HTTPS et la redirection HTTP→HTTPS. Renouvellement automatique.

---

## 10. Vérification

- [ ] `https://school.kerryht.com` → l'accueil s'affiche.
- [ ] `https://school.kerryht.com/admin/` → connexion admin OK.
- [ ] Inscription d'un étudiant → connexion → tableau de bord.
- [ ] Une formation créée dans l'admin apparaît sur `/courses`.
- [ ] Upload d'une vidéo dans l'admin → lecture ET avance/recul fonctionnent.

---

## 11. Mettre à jour l'application plus tard

```bash
cd ~/kerryht-academy
git pull

# Backend
cd backend && source venv/bin/activate
pip install -r requirements/prod.txt
python manage.py migrate
python manage.py collectstatic --no-input
deactivate
sudo systemctl restart kerryht-backend

# Frontend
cd ../frontend
npm ci
NEXT_PUBLIC_API_URL=https://school.kerryht.com npm run build
sudo systemctl restart kerryht-frontend
```

---

## Notes

- **Sauvegardes** : `pg_dump kerryht_academy > backup.sql` pour la base ; les vidéos sont dans `backend/media/` ; le snapshot Hostinger couvre tout le disque.
- **Pare-feu** : `sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable`.
