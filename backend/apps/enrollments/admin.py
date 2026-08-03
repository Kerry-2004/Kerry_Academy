from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Enrollment, Progress


@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    list_display = ["user", "course", "status", "enrolled_at"]
    list_filter = ["status", "course"]
    list_editable = ["status"]
    search_fields = ["user__email", "course__title"]
    autocomplete_fields = ["user", "course"]
    actions = ["confirm_payment", "set_pending"]

    @admin.action(description="✓ Confirmer le paiement (accès complet)")
    def confirm_payment(self, request, queryset):
        updated = queryset.update(status=Enrollment.Status.ACTIVE)
        self.message_user(request, f"{updated} inscription(s) activée(s) — accès complet débloqué.")

    @admin.action(description="⏳ Repasser en attente de paiement")
    def set_pending(self, request, queryset):
        updated = queryset.update(status=Enrollment.Status.PENDING_PAYMENT)
        self.message_user(request, f"{updated} inscription(s) repassée(s) en attente.")


@admin.register(Progress)
class ProgressAdmin(ModelAdmin):
    list_display = ["enrollment", "lesson", "completed_at"]
