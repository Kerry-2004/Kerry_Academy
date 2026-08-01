# Déploiement sur VPS Hostinger (KVM 2)

Tout tourne sur un seul serveur Ubuntu :

- **Nginx** (reverse proxy + HTTPS + sert statiques/vidéos)
- **Django + Gunicorn** (backend/API/admin) — `api.kerryht.com`
- **Next.js** (frontend) — `kerryht.com`
- **PostgreSQL** (base de données)
- Les **vidéos** sont stockées sur le disque NVMe (100 Go) — parfait pour < 100 utilisateurs.

> Remplacez partout `kerryht.com` par votre domaine, `deploy` par votre utilisateur Linux, et les mots de passe par les vôtres.

---

## 1. DNS chez Hostinger

Dans hPanel → **Domaines** → **Zone DNS**, créez 3 enregistrements `A` vers l'**IP de votre VPS** :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `@` | IP_DU_VPS |
| `A` | `www` | IP_DU_VPS |
| `A` | `api` | IP_DU_VPS |

(La propagation prend quelques minutes à quelques heures.)

---

## 2. Préparer le serveur

Connectez-vous en SSH (`ssh root@IP_DU_VPS`), puis créez un utilisateur non-root :

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
git clone https://github.com/<votre-user>/kerryht-academy.git
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

Contenu (adaptez les valeurs) :

```
SECRET_KEY=REMPLACEZ_PAR_UNE_CLE_ALEATOIRE
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.prod
ALLOWED_HOSTS=api.kerryht.com
DATABASE_URL=postgres://kerryht:MOT_DE_PASSE_DB@localhost:5432/kerryht_academy
CORS_ALLOWED_ORIGINS=https://kerryht.com,https://www.kerryht.com
CSRF_TRUSTED_ORIGINS=https://kerryht.com,https://www.kerryht.com
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
NEXT_PUBLIC_API_URL=https://api.kerryht.com npm run build
```

> `NEXT_PUBLIC_API_URL` est intégré **au moment du build** — il doit être présent sur cette commande. Après un changement, il faut rebuild.

---

## 7. Services systemd (démarrage auto + redémarrage)

Copiez les fichiers fournis (dossier `deploy/`), en adaptant l'utilisateur/chemins si besoin :

```bash
sudo cp ~/kerryht-academy/deploy/kerryht-backend.service /etc/systemd/system/
sudo cp ~/kerryht-academy/deploy/kerryht-frontend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now kerryht-backend
sudo systemctl enable --now kerryht-frontend

# Vérifier
sudo systemctl status kerryht-backend
sudo systemctl status kerryht-frontend
```

---

## 8. Nginx

Autorisez Nginx (www-data) à lire les fichiers du projet :

```bash
chmod 755 /home/deploy
```

Installez la configuration :

```bash
sudo cp ~/kerryht-academy/deploy/nginx-kerryht.conf /etc/nginx/sites-available/kerryht
sudo ln -s /etc/nginx/sites-available/kerryht /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # retire la page par défaut
sudo nginx -t        # tester la config
sudo systemctl reload nginx
```

À ce stade, `http://kerryht.com` et `http://api.kerryht.com` doivent répondre.

---

## 9. HTTPS (Let's Encrypt / Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kerryht.com -d www.kerryht.com -d api.kerryht.com
```

Certbot obtient les certificats, ajoute les blocs HTTPS et la redirection HTTP→HTTPS automatiquement. Le renouvellement est automatique.

---

## 10. Vérification

- [ ] `https://kerryht.com` → l'accueil s'affiche.
- [ ] `https://api.kerryht.com/admin/` → connexion admin OK.
- [ ] Inscription d'un étudiant depuis le site → connexion → tableau de bord.
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
NEXT_PUBLIC_API_URL=https://api.kerryht.com npm run build
sudo systemctl restart kerryht-frontend
```

---

## Notes

- **Sauvegardes** : votre plan inclut 1 snapshot. Pensez aussi à sauvegarder la base : `pg_dump kerryht_academy > backup.sql`. Les vidéos sont dans `backend/media/`.
- **Sécurité serveur** : activez le pare-feu (`sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable`).
- **Gros uploads vidéo** : `client_max_body_size 1024M` est déjà réglé dans la config Nginx (upload jusqu'à ~1 Go via l'admin).
