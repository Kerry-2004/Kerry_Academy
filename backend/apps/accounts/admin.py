from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin

from .models import Profile, User


class UserAdmin(BaseUserAdmin, ModelAdmin):
    ordering = ["email"]
    list_display = ["email", "first_name", "last_name", "role", "is_staff", "is_active"]
    list_filter = ["role", "is_staff", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("first_name", "last_name", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "role", "password1", "password2"),
        }),
    )
    readonly_fields = ["date_joined"]


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ["user", "phone", "country"]
    search_fields = ["user__email"]


admin.site.register(User, UserAdmin)
