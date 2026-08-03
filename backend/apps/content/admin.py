from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin

from .models import Ebook, EbookOrder, HomeContent, Testimonial


@admin.register(HomeContent)
class HomeContentAdmin(ModelAdmin):
    """Écran unique : vidéo d'accueil + contacts pour la vente d'ebooks."""

    fields = ["hero_video", "hero_poster", "whatsapp_number", "contact_email", "updated_at"]
    readonly_fields = ["updated_at"]

    class Media:
        # Barre de progression en temps réel pendant l'upload de la vidéo.
        js = ["content/admin/upload_progress.js"]

    def has_add_permission(self, request):
        # Une seule fiche possible : on masque « Ajouter » dès qu'elle existe.
        return not HomeContent.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # On ne supprime pas la fiche ; on vide les champs à la place.
        return False


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    """Modération des avis : consulter, approuver ou refuser."""

    list_display = ["author_name", "course", "rating", "status", "created_at"]
    list_filter = ["status", "rating", "course"]
    search_fields = ["author_name", "comment"]
    list_editable = ["status"]
    # Le contenu de l'avis n'est pas modifiable par l'admin : on ne fait que modérer.
    readonly_fields = [
        "user", "course", "author_name", "rating", "comment", "created_at", "reviewed_at",
    ]
    fields = [
        "author_name", "course", "rating", "comment", "status", "created_at", "reviewed_at",
    ]
    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="✓ Approuver les avis sélectionnés (les publier)")
    def approve_selected(self, request, queryset):
        updated = queryset.update(
            status=Testimonial.Status.APPROVED, reviewed_at=timezone.now()
        )
        self.message_user(request, f"{updated} avis approuvé(s) et publié(s).")

    @admin.action(description="✕ Refuser les avis sélectionnés")
    def reject_selected(self, request, queryset):
        updated = queryset.update(
            status=Testimonial.Status.REJECTED, reviewed_at=timezone.now()
        )
        self.message_user(request, f"{updated} avis refusé(s).")

    def save_model(self, request, obj, form, change):
        # Quand l'admin change le statut depuis la fiche, on date la modération.
        if change and "status" in form.changed_data and obj.status != Testimonial.Status.PENDING:
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(Ebook)
class EbookAdmin(ModelAdmin):
    list_display = ["title", "author", "price", "is_published", "created_at"]
    list_filter = ["is_published"]
    search_fields = ["title", "author", "description"]
    prepopulated_fields = {"slug": ("title",)}

    class Media:
        # Barre de progression lors de l'upload de la couverture / du fichier.
        js = ["content/admin/upload_progress.js"]


@admin.register(EbookOrder)
class EbookOrderAdmin(ModelAdmin):
    """Gestion des commandes : confirmer le paiement débloque le téléchargement."""

    list_display = ["reference", "ebook", "user", "status", "created_at", "confirmed_at"]
    list_filter = ["status", "ebook"]
    search_fields = ["reference", "user__email", "ebook__title"]
    list_editable = ["status"]
    readonly_fields = ["reference", "ebook", "user", "created_at", "confirmed_at"]
    fields = ["reference", "ebook", "user", "status", "created_at", "confirmed_at"]
    actions = ["mark_paid", "mark_cancelled"]

    @admin.action(description="✓ Marquer comme payé (débloque le téléchargement)")
    def mark_paid(self, request, queryset):
        updated = queryset.update(status=EbookOrder.Status.PAID, confirmed_at=timezone.now())
        self.message_user(request, f"{updated} commande(s) marquée(s) comme payée(s).")

    @admin.action(description="✕ Annuler les commandes sélectionnées")
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(status=EbookOrder.Status.CANCELLED)
        self.message_user(request, f"{updated} commande(s) annulée(s).")

    def save_model(self, request, obj, form, change):
        # Date la confirmation quand l'admin passe la commande à « payé ».
        if change and "status" in form.changed_data:
            obj.confirmed_at = timezone.now() if obj.status == EbookOrder.Status.PAID else None
        super().save_model(request, obj, form, change)
