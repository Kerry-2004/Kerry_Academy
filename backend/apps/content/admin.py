from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin

from .models import HomeContent, Testimonial


@admin.register(HomeContent)
class HomeContentAdmin(ModelAdmin):
    """Écran unique : téléverser / remplacer / supprimer la vidéo d'accueil."""

    fields = ["hero_video", "hero_poster", "updated_at"]
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
