from django.conf import settings
from django.db import models
from django_ckeditor_5.fields import CKEditor5Field


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Course(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    short_description = models.CharField(
        "Description courte (carte)",
        max_length=300,
        blank=True,
        help_text="Résumé affiché sur la carte de la formation (1 à 2 phrases).",
    )
    # Ancienne description en texte simple — conservée comme repli.
    description = models.TextField("Ancienne description (texte simple)", blank=True)
    # Présentation riche affichée sur la page dédiée de la formation.
    long_description = CKEditor5Field("Présentation complète", blank=True, config_name="extends")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="courses")
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="courses_taught"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    thumbnail = models.ImageField(upload_to="courses/thumbnails/", blank=True, null=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class Lesson(models.Model):
    class ContentType(models.TextChoices):
        TEXT = "text", "Texte"
        VIDEO = "video", "Vidéo"
        QUIZ = "quiz", "Quiz"
        FILE = "file", "Fichier"

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    content_type = models.CharField(max_length=10, choices=ContentType.choices, default=ContentType.TEXT)
    is_free_preview = models.BooleanField(default=False)

    # Contenu propre à chaque type — un seul des quatre champs est utilisé, selon content_type.
    video = models.FileField(upload_to="lessons/videos/", blank=True, null=True)
    text_content = CKEditor5Field(blank=True, config_name="default")
    file = models.FileField(upload_to="lessons/files/", blank=True, null=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.module.title} — {self.title}"


class Question(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.text[:60]


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text
