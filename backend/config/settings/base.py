from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_ckeditor_5",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "apps.core",
    "apps.accounts",
    "apps.courses",
    "apps.enrollments",
    "apps.content",
]

AUTH_USER_MODEL = "accounts.User"
LOGIN_REDIRECT_URL = "/admin/"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": env.db("DATABASE_URL", default="postgres://postgres:postgres@localhost:5432/kerryht_academy"),
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "America/Port-au-Prince"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
# Fichiers privés (ebooks payants) : hors MEDIA_ROOT, donc non exposés par Nginx.
# Servis uniquement via une vue Django qui vérifie l'achat.
PRIVATE_MEDIA_ROOT = BASE_DIR / "private_media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Éditeur de texte enrichi (leçons de type "texte") : mise en forme + upload d'images
CKEDITOR_5_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
CKEDITOR_5_UPLOAD_PATH = "lessons/text_uploads/"
CKEDITOR_5_CONFIGS = {
    "default": {
        "toolbar": [
            "bold", "italic", "underline", "strikethrough", "|",
            "bulletedList", "numberedList", "blockQuote", "|",
            "link", "uploadImage", "|",
            "undo", "redo",
        ],
    },
    # Éditeur riche complet pour la présentation des formations (page dédiée).
    "extends": {
        "blockToolbar": [
            "paragraph", "heading1", "heading2", "heading3", "|",
            "bulletedList", "numberedList", "|",
            "blockQuote",
        ],
        "toolbar": [
            "heading", "|",
            "bold", "italic", "underline", "strikethrough", "|",
            "fontSize", "fontColor", "fontBackgroundColor", "highlight", "|",
            "alignment", "|",
            "bulletedList", "numberedList", "todoList", "|",
            "outdent", "indent", "|",
            "link", "blockQuote", "insertTable", "imageUpload", "mediaEmbed",
            "horizontalLine", "code", "codeBlock", "|",
            "removeFormat", "sourceEditing", "|",
            "undo", "redo",
        ],
        "image": {
            "toolbar": [
                "imageTextAlternative", "|",
                "imageStyle:alignLeft", "imageStyle:alignCenter", "imageStyle:alignRight", "|",
                "imageStyle:full", "imageStyle:side",
            ],
            "styles": ["full", "side", "alignLeft", "alignCenter", "alignRight"],
        },
        "table": {
            "contentToolbar": [
                "tableColumn", "tableRow", "mergeTableCells",
                "tableProperties", "tableCellProperties",
            ],
        },
        "heading": {
            "options": [
                {"model": "paragraph", "title": "Paragraphe", "class": "ck-heading_paragraph"},
                {"model": "heading1", "view": "h1", "title": "Titre 1", "class": "ck-heading_heading1"},
                {"model": "heading2", "view": "h2", "title": "Titre 2", "class": "ck-heading_heading2"},
                {"model": "heading3", "view": "h3", "title": "Sous-titre", "class": "ck-heading_heading3"},
            ],
        },
        # Stocke un <iframe> plutôt qu'un <oembed> → les vidéos s'affichent sur le site.
        "mediaEmbed": {"previewsInData": True},
    },
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "auth-login": "5/min",
        "auth-register": "5/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Nom du cookie httpOnly portant le refresh token (voir apps/accounts/views.py)
REFRESH_TOKEN_COOKIE = "refresh_token"
# SameSite du cookie de refresh. En local ("Lax") suffit. Si le frontend (Vercel)
# et le backend (Render) sont sur des domaines RACINE différents, il faut "None"
# pour que le cookie soit envoyé sur les requêtes cross-site (nécessite HTTPS).
REFRESH_COOKIE_SAMESITE = env("REFRESH_COOKIE_SAMESITE", default="Lax")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000"])

# --- Email (Resend, via l'API HTTP — voir apps/accounts/emails.py) ---
# Clé API Resend. Si vide, les emails sont simplement ignorés (utile en local/tests).
RESEND_API_KEY = env("RESEND_API_KEY", default="")
# Expéditeur. Le domaine doit être vérifié dans Resend. Pour un premier test sans
# domaine vérifié, Resend autorise "onboarding@resend.dev" MAIS uniquement vers
# l'email du compte Resend. En prod : "Kerryht Academy <bonjour@kerryht.com>".
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Kerryht Academy <onboarding@resend.dev>")
# URL publique du site, utilisée dans les liens des emails.
SITE_URL = env("SITE_URL", default="http://localhost:3000")

# --- Variables réservées aux phases suivantes (documentées ici, non utilisées en Phase 1) ---
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")
MONCASH_CLIENT_ID = env("MONCASH_CLIENT_ID", default="")
MONCASH_CLIENT_SECRET = env("MONCASH_CLIENT_SECRET", default="")
CLOUDFLARE_STREAM_ACCOUNT_ID = env("CLOUDFLARE_STREAM_ACCOUNT_ID", default="")
CLOUDFLARE_STREAM_API_TOKEN = env("CLOUDFLARE_STREAM_API_TOKEN", default="")
CLOUDFLARE_R2_ACCESS_KEY_ID = env("CLOUDFLARE_R2_ACCESS_KEY_ID", default="")
CLOUDFLARE_R2_SECRET_ACCESS_KEY = env("CLOUDFLARE_R2_SECRET_ACCESS_KEY", default="")
CLOUDFLARE_R2_BUCKET = env("CLOUDFLARE_R2_BUCKET", default="")

# --- Thème de l'admin (django-unfold), aux couleurs de Kerryht Academy ---
UNFOLD = {
    "SITE_TITLE": "Kerryht Academy Admin",
    "SITE_HEADER": "Kerryht Academy",
    "SITE_SYMBOL": "school",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "COLORS": {
        "primary": {
            "50": "253 250 240",
            "100": "250 244 224",
            "200": "244 230 190",
            "300": "236 210 148",
            "400": "226 190 108",
            "500": "201 168 76",
            "600": "176 143 58",
            "700": "140 112 44",
            "800": "105 84 33",
            "900": "74 59 23",
            "950": "46 36 14",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "navigation": [
            {
                "title": "Formations",
                "items": [
                    {
                        "title": "Catégories",
                        "icon": "category",
                        "link": "/admin/courses/category/",
                    },
                    {
                        "title": "Formations",
                        "icon": "menu_book",
                        "link": "/admin/courses/course/",
                    },
                    {
                        "title": "Modules",
                        "icon": "view_module",
                        "link": "/admin/courses/module/",
                    },
                ],
            },
            {
                "title": "Étudiants",
                "items": [
                    {
                        "title": "Utilisateurs",
                        "icon": "people",
                        "link": "/admin/accounts/user/",
                    },
                    {
                        "title": "Inscriptions",
                        "icon": "assignment_turned_in",
                        "link": "/admin/enrollments/enrollment/",
                    },
                ],
            },
            {
                "title": "Page d'accueil",
                "items": [
                    {
                        "title": "Vidéo d'accueil",
                        "icon": "smart_display",
                        "link": "/admin/content/homecontent/",
                    },
                    {
                        "title": "Témoignages",
                        "icon": "reviews",
                        "link": "/admin/content/testimonial/",
                    },
                ],
            },
            {
                "title": "Boutique",
                "items": [
                    {
                        "title": "Ebooks",
                        "icon": "menu_book",
                        "link": "/admin/content/ebook/",
                    },
                    {
                        "title": "Commandes",
                        "icon": "shopping_cart",
                        "link": "/admin/content/ebookorder/",
                    },
                    {
                        "title": "Paiement (instructions)",
                        "icon": "payments",
                        "link": "/admin/content/paymentsettings/",
                    },
                ],
            },
        ],
    },
}
