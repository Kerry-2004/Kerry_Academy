from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.courses.models import Course

# Stockage PRIVÉ pour les fichiers d'ebooks : en dehors de MEDIA_ROOT, donc
# jamais exposé par Nginx (aucune route /private_media/). Le téléchargement
# passe obligatoirement par la vue protégée EbookDownloadView (achat vérifié).
private_storage = FileSystemStorage(location=str(settings.PRIVATE_MEDIA_ROOT))


class HomeContent(models.Model):
    """Contenu éditable de la page d'accueil.

    Fiche unique (singleton) : il n'y a qu'une seule page d'accueil, donc on
    force toujours la même ligne (pk=1). L'admin peut téléverser, remplacer ou
    supprimer la vidéo et l'image de couverture affichées sur l'accueil.
    """

    hero_video = models.FileField(
        "Vidéo d'accueil", upload_to="home/", blank=True, null=True
    )
    hero_poster = models.ImageField(
        "Image de couverture", upload_to="home/", blank=True, null=True
    )
    # Contacts affichés à l'acheteur pour le paiement manuel des ebooks.
    whatsapp_number = models.CharField(
        "Numéro WhatsApp (format international, ex. +50912345678)",
        max_length=30,
        blank=True,
    )
    contact_email = models.EmailField("Email de contact", blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Page d'accueil"
        verbose_name_plural = "Page d'accueil"

    def __str__(self):
        return "Page d'accueil"

    def save(self, *args, **kwargs):
        self.pk = 1  # garantit une seule ligne
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Testimonial(models.Model):
    """Avis laissé par un étudiant ayant terminé une formation.

    Un avis n'est JAMAIS publié automatiquement : il naît en statut « en
    attente » et n'apparaît sur la page d'accueil qu'une fois « approuvé » par
    l'administrateur.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        REJECTED = "rejected", "Refusé"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="testimonials"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="testimonials"
    )
    # Nom d'affichage figé au moment de l'avis (indépendant des changements de profil).
    author_name = models.CharField(max_length=200)
    rating = models.PositiveSmallIntegerField(
        "Note (sur 5)",
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField("Commentaire")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        # Un seul avis par étudiant et par formation.
        unique_together = ["user", "course"]

    def __str__(self):
        return f"{self.author_name} — {self.course.title} ({self.get_status_display()})"


class PaymentSettings(models.Model):
    """Instructions de paiement (modifiables) affichées à l'étudiant qui doit
    payer pour débloquer l'accès complet à une formation. Fiche unique."""

    moncash_number = models.CharField("Numéro MonCash", max_length=40, blank=True, default="+509 4780-8070")
    moncash_name = models.CharField("Nom du compte MonCash", max_length=120, blank=True, default="Kerry Cherestal")
    natcash_number = models.CharField("Numéro Natcash", max_length=40, blank=True, default="+509 4157-0822")
    natcash_name = models.CharField("Nom du compte Natcash", max_length=120, blank=True, default="Kerry Cherestal")
    whatsapp_number = models.CharField(
        "Numéro WhatsApp (envoi de la preuve)", max_length=40, blank=True, default="+509 4780-8070"
    )
    instructions = models.TextField(
        "Message d'instructions",
        blank=True,
        default=(
            "Envoyez la preuve de paiement via WhatsApp. Dans un délai de moins "
            "d'1 h de temps, vous aurez accès à la formation complète."
        ),
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paiement (instructions)"
        verbose_name_plural = "Paiement (instructions)"

    def __str__(self):
        return "Instructions de paiement"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Ebook(models.Model):
    """Ebook vendu sur la page d'accueil.

    La couverture est publique (affichée dans le catalogue) ; le fichier est
    stocké dans un dossier privé et n'est servi qu'après confirmation de l'achat.
    """

    title = models.CharField("Titre", max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    author = models.CharField("Auteur", max_length=200, blank=True)
    description = models.TextField("Description", blank=True)
    cover = models.ImageField("Couverture", upload_to="ebooks/covers/", blank=True, null=True)
    file = models.FileField(
        "Fichier de l'ebook (privé — PDF/EPUB)",
        upload_to="ebooks/files/",
        storage=private_storage,
    )
    price = models.DecimalField("Prix", max_digits=10, decimal_places=2, default=0)
    is_published = models.BooleanField("Publié", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class EbookOrder(models.Model):
    """Commande d'ebook. Paiement manuel : la commande naît « en attente », et
    l'admin la passe « payé » une fois le paiement reçu (WhatsApp/MonCash).
    Le téléchargement n'est débloqué qu'au statut « payé »."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente de paiement"
        PAID = "paid", "Payé"
        CANCELLED = "cancelled", "Annulé"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ebook_orders"
    )
    ebook = models.ForeignKey(Ebook, on_delete=models.CASCADE, related_name="orders")
    reference = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        # Une seule commande par utilisateur et par ebook.
        unique_together = ["user", "ebook"]

    def __str__(self):
        return f"{self.reference} — {self.ebook.title} ({self.get_status_display()})"
