import re

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

from .media_serve import serve_media

urlpatterns = [
    path("admin/", admin.site.urls),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/enrollments/", include("apps.enrollments.urls")),
]

# Sert les fichiers média (vidéos, images uploadées) avec support des requêtes
# Range — en dev ET en prod. En production sur un stockage éphémère (offre
# gratuite Render/Railway), pensez à passer à Cloudflare R2 / S3 (Phase 7) ou à
# un disque persistant pour que les uploads survivent aux redéploiements.
media_prefix = re.escape(settings.MEDIA_URL.lstrip("/"))
urlpatterns += [
    re_path(
        rf"^{media_prefix}(?P<path>.*)$",
        serve_media,
        {"document_root": settings.MEDIA_ROOT},
    ),
]
