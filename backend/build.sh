#!/usr/bin/env bash
# Commande de build pour Render (backend Django).
set -o errexit

pip install -r requirements/prod.txt
python manage.py collectstatic --no-input
python manage.py migrate
