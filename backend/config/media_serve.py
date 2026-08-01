"""Service des fichiers média en développement avec support des requêtes HTTP Range.

Le serveur statique intégré de Django (``django.views.static.serve``) ne répond pas
aux en-têtes ``Range`` : il renvoie toujours le fichier entier avec un statut 200.
Les navigateurs désactivent alors la recherche (avance/recul) dans les vidéos.
Cette vue renvoie du ``206 Partial Content`` pour permettre le seek.

En production, c'est Nginx qui sert /media avec le support Range natif (voir le plan
de déploiement) ; cette vue n'est branchée qu'en mode DEBUG.
"""

import mimetypes
import os
import re

from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse

RANGE_RE = re.compile(r"bytes\s*=\s*(\d+)\s*-\s*(\d*)", re.IGNORECASE)


def _file_chunks(path, start, length, chunk_size=8192):
    with open(path, "rb") as handle:
        handle.seek(start)
        remaining = length
        while remaining > 0:
            data = handle.read(min(chunk_size, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data


def serve_media(request, path, document_root=None):
    full_path = os.path.normpath(os.path.join(document_root, path))
    # Empêche de sortir du dossier média via des chemins relatifs.
    if not full_path.startswith(os.path.normpath(document_root)) or not os.path.isfile(full_path):
        raise Http404("Fichier introuvable.")

    size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or "application/octet-stream"
    range_header = request.META.get("HTTP_RANGE", "")
    match = RANGE_RE.match(range_header)

    if not match:
        response = FileResponse(open(full_path, "rb"), content_type=content_type)
        response["Content-Length"] = str(size)
        response["Accept-Ranges"] = "bytes"
        return response

    start = int(match.group(1))
    end = int(match.group(2)) if match.group(2) else size - 1
    end = min(end, size - 1)

    if start >= size or start > end:
        response = HttpResponse(status=416)  # Range Not Satisfiable
        response["Content-Range"] = f"bytes */{size}"
        return response

    length = end - start + 1
    response = StreamingHttpResponse(
        _file_chunks(full_path, start, length),
        status=206,
        content_type=content_type,
    )
    response["Content-Length"] = str(length)
    response["Content-Range"] = f"bytes {start}-{end}/{size}"
    response["Accept-Ranges"] = "bytes"
    return response
