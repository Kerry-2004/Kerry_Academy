from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Enrollment, Progress


@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    list_display = ["user", "course", "status", "enrolled_at"]
    list_filter = ["status"]
    search_fields = ["user__email", "course__title"]
    autocomplete_fields = ["user", "course"]


@admin.register(Progress)
class ProgressAdmin(ModelAdmin):
    list_display = ["enrollment", "lesson", "completed_at"]
