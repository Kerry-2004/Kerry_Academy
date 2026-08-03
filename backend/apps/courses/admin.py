from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline, TabularInline

from .models import Answer, Category, Course, Lesson, Module, Question


class AnswerInline(TabularInline):
    model = Answer
    extra = 2


class QuestionInline(TabularInline):
    model = Question
    extra = 1
    ordering = ["order"]
    # Unfold ne prend en charge qu'un seul niveau d'imbrication native : les
    # réponses (3ᵉ niveau, sous Leçon > Question) ne peuvent pas s'afficher ici.
    # On propose donc un lien direct vers la page de la question une fois enregistrée.
    show_change_link = True


class LessonInline(StackedInline):
    model = Lesson
    extra = 1
    ordering = ["order"]
    fields = ["title", "order", "content_type", "video", "text_content", "file", "is_free_preview"]
    inlines = [QuestionInline]

    class Media:
        js = [
            "courses/admin/lesson_content_type.js",
            "content/admin/upload_progress.js",
        ]


class ModuleInline(TabularInline):
    model = Module
    extra = 1
    ordering = ["order"]
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    list_display = ["title", "category", "instructor", "price", "is_published", "created_at"]
    list_filter = ["is_published", "category"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ["instructor"]
    inlines = [ModuleInline]

    class Media:
        # Barre de progression lors de l'upload de la miniature.
        js = ["content/admin/upload_progress.js"]


@admin.register(Module)
class ModuleAdmin(ModelAdmin):
    list_display = ["title", "course", "order"]
    list_filter = ["course"]
    ordering = ["course", "order"]
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(ModelAdmin):
    list_display = ["title", "module", "content_type", "order"]
    list_filter = ["content_type", "module__course"]
    search_fields = ["title"]
    fields = ["module", "title", "order", "content_type", "video", "text_content", "file", "is_free_preview"]
    inlines = [QuestionInline]

    class Media:
        js = [
            "courses/admin/lesson_content_type.js",
            "content/admin/upload_progress.js",
        ]


@admin.register(Question)
class QuestionAdmin(ModelAdmin):
    list_display = ["text", "lesson", "order"]
    list_filter = ["lesson__module__course"]
    search_fields = ["text"]
    inlines = [AnswerInline]
