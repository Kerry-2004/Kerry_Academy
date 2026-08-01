from django.conf import settings
from django.db import models

from apps.courses.models import Course, Lesson


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Paiement en attente"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Terminée"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "course"]

    def __str__(self):
        return f"{self.user.email} → {self.course.title} ({self.status})"


class Progress(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name="progress_entries")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress_entries")
    completed_at = models.DateTimeField(null=True, blank=True)
    # Renseignés uniquement pour les leçons de type quiz (nombre de bonnes réponses / total).
    score = models.PositiveIntegerField(null=True, blank=True)
    max_score = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ["enrollment", "lesson"]
        verbose_name_plural = "progress entries"

    def __str__(self):
        return f"{self.enrollment} — {self.lesson.title}"
