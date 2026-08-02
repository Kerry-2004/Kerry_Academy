"""Envoi d'emails transactionnels via Resend (API HTTP).

On passe par l'API HTTPS de Resend plutôt que par SMTP : les VPS bloquent souvent
les ports SMTP (25/465/587), alors que le port 443 est toujours ouvert.

L'envoi se fait dans un thread démon pour ne jamais bloquer ni faire échouer la
requête d'inscription : un souci d'email ne doit pas empêcher un étudiant de
créer son compte.
"""

import logging
import threading

import resend
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_welcome_email(user):
    """Déclenche (en arrière-plan) l'email de bienvenue pour un nouvel inscrit."""
    if not settings.RESEND_API_KEY:
        logger.info("RESEND_API_KEY absent : email de bienvenue ignoré pour %s.", user.email)
        return

    # On ne passe que des valeurs simples au thread (pas l'objet ORM).
    threading.Thread(
        target=_deliver_welcome_email,
        args=(user.email, user.first_name or ""),
        daemon=True,
    ).start()


def _deliver_welcome_email(email, first_name):
    resend.api_key = settings.RESEND_API_KEY

    site_url = settings.SITE_URL.rstrip("/")
    context = {
        "first_name": first_name,
        "site_url": site_url,
        "courses_url": f"{site_url}/courses",
        "dashboard_url": f"{site_url}/dashboard",
    }
    html_body = render_to_string("emails/welcome.html", context)
    text_body = render_to_string("emails/welcome.txt", context)

    try:
        resend.Emails.send(
            {
                "from": settings.DEFAULT_FROM_EMAIL,
                "to": [email],
                "subject": "Bienvenue sur Kerryht Academy 🎓",
                "html": html_body,
                "text": text_body,
            }
        )
        logger.info("Email de bienvenue envoyé à %s.", email)
    except Exception:  # noqa: BLE001 — on log et on abandonne, sans propager.
        logger.exception("Échec de l'envoi de l'email de bienvenue à %s.", email)
